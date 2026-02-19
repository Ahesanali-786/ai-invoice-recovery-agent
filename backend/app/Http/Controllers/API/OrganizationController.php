<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\OrganizationInvitationMail;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $organizations = $request
            ->user()
            ->organizations()
            ->withPivot(['role', 'joined_at', 'last_accessed_at'])
            ->get()
            ->map(function ($org) {
                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'logo' => $org->logo,
                    'role' => $org->pivot->role,
                    'status' => $org->status,
                    'is_current' => $org->id === auth()->user()->current_organization_id,
                    'joined_at' => $org->pivot->joined_at,
                ];
            });

        return response()->json($organizations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'currency' => 'nullable|string|size:3',
            'timezone' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $organization = Organization::create([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']) . '-' . uniqid(),
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'tax_number' => $validated['tax_number'] ?? null,
                'currency' => $validated['currency'] ?? 'USD',
                'timezone' => $validated['timezone'] ?? 'UTC',
                'status' => 'active',
                'trial_ends_at' => now()->addDays(14),
            ]);

            // Add creator as owner
            $organization->users()->attach($request->user()->id, [
                'role' => 'owner',
                'joined_at' => now(),
                'last_accessed_at' => now(),
            ]);

            // Set as current organization
            $request->user()->setCurrentOrganization($organization->id);

            DB::commit();

            return response()->json([
                'message' => 'Organization created successfully',
                'organization' => $organization,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create organization'], 500);
        }
    }

    public function show(Request $request, Organization $organization): JsonResponse
    {
        // Ensure user has access
        if (!$request->user()->organizations()->where('organizations.id', $organization->id)->exists()) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $role = $organization->getMemberRole($request->user()->id);

        return response()->json([
            'id' => $organization->id,
            'name' => $organization->name,
            'slug' => $organization->slug,
            'logo' => $organization->logo,
            'email' => $organization->email,
            'phone' => $organization->phone,
            'address' => $organization->address,
            'tax_number' => $organization->tax_number,
            'currency' => $organization->currency,
            'timezone' => $organization->timezone,
            'status' => $organization->status,
            'trial_ends_at' => $organization->trial_ends_at,
            'subscription_ends_at' => $organization->subscription_ends_at,
            'my_role' => $role,
            'settings' => $organization->settings,
        ]);
    }

    public function update(Request $request, Organization $organization): JsonResponse
    {
        // Only owner or admin can update
        $role = $organization->getMemberRole($request->user()->id);
        if (!in_array($role, ['owner', 'admin'])) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'currency' => 'nullable|string|size:3',
            'timezone' => 'nullable|string',
            'settings' => 'nullable|array',
        ]);

        $organization->update($validated);

        return response()->json([
            'message' => 'Organization updated successfully',
            'organization' => $organization->fresh(),
        ]);
    }

    public function switchOrganization(Request $request, Organization $organization): JsonResponse
    {
        $user = $request->user();

        // Verify membership
        if (!$user->organizations()->where('organizations.id', $organization->id)->exists()) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $user->setCurrentOrganization($organization->id);

        return response()->json([
            'message' => 'Switched to organization: ' . $organization->name,
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
            ],
        ]);
    }

    public function members(Request $request, Organization $organization): JsonResponse
    {
        if (!$request->user()->hasPermission($organization->id, 'manage_team')) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        $members = $organization
            ->users()
            ->withPivot(['role', 'joined_at', 'last_accessed_at'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->pivot->role,
                    'joined_at' => $user->pivot->joined_at,
                    'last_accessed_at' => $user->pivot->last_accessed_at,
                ];
            });

        return response()->json($members);
    }

    public function inviteMember(Request $request, Organization $organization): JsonResponse
    {
        if (!$request->user()->hasPermission($organization->id, 'manage_team')) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:admin,manager,accountant,viewer',
        ]);

        // Check if already invited
        $existingInvitation = OrganizationInvitation::where('organization_id', $organization->id)
            ->where('email', $validated['email'])
            ->whereNull('accepted_at')
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($existingInvitation) {
            return response()->json([
                'message' => 'Invitation already sent to ' . $validated['email'],
                'note' => 'Previous invitation is still pending',
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        // Check if already a member
        if ($user && $organization->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['error' => 'User is already a member'], 400);
        }

        if (!$user) {
            // User doesn't exist - create invitation and send email
            $invitation = OrganizationInvitation::create([
                'organization_id' => $organization->id,
                'email' => $validated['email'],
                'role' => $validated['role'],
                'token' => Str::random(64),
                'invited_by' => $request->user()->id,
                'expires_at' => now()->addDays(7),
            ]);

            // Load relationships for email
            $invitation->load(['organization', 'inviter']);

            // Send invitation email
            Mail::to($validated['email'])->send(new OrganizationInvitationMail($invitation));

            return response()->json([
                'message' => 'Invitation sent to ' . $validated['email'],
                'note' => 'User will be added when they accept the invitation',
                'invitation_id' => $invitation->id,
            ]);
        }

        // User exists - directly add to organization and notify
        $organization->users()->attach($user->id, [
            'role' => $validated['role'],
            'joined_at' => now(),
        ]);

        // Send notification email that they were added
        Mail::to($user->email)->send(new \App\Mail\OrganizationAddedNotification($organization, $user, $request->user()));

        return response()->json([
            'message' => 'Member added successfully',
            'member' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'],
            ],
        ]);
    }

    public function acceptInvitation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $invitation = OrganizationInvitation::where('token', $validated['token'])
            ->whereNull('accepted_at')
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->with(['organization'])
            ->first();

        if (!$invitation) {
            return response()->json([
                'error' => 'Invalid or expired invitation token',
            ], 400);
        }

        // Check if user is authenticated
        $user = $request->user();

        if (!$user) {
            // Store invitation token in session for after registration/login
            return response()->json([
                'requires_auth' => true,
                'message' => 'Please log in or register to accept the invitation',
                'invitation_email' => $invitation->email,
            ]);
        }

        // Verify email matches
        if ($user->email !== $invitation->email) {
            return response()->json([
                'error' => 'This invitation was sent to a different email address',
                'invitation_email' => $invitation->email,
                'your_email' => $user->email,
            ], 403);
        }

        // Check if already a member
        if ($invitation->organization->users()->where('users.id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are already a member of this organization',
            ]);
        }

        // Add user to organization
        $invitation->organization->users()->attach($user->id, [
            'role' => $invitation->role,
            'joined_at' => now(),
        ]);

        // Mark invitation as accepted
        $invitation->update(['accepted_at' => now()]);

        return response()->json([
            'message' => 'You have successfully joined ' . $invitation->organization->name,
            'organization' => [
                'id' => $invitation->organization->id,
                'name' => $invitation->organization->name,
                'role' => $invitation->role,
            ],
        ]);
    }

    public function getPendingInvitations(Request $request): JsonResponse
    {
        $invitations = OrganizationInvitation::where('email', $request->user()->email)
            ->whereNull('accepted_at')
            ->where(function ($query) {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->with(['organization', 'inviter'])
            ->get();

        return response()->json($invitations);
    }

    public function updateMemberRole(Request $request, Organization $organization, User $user): JsonResponse
    {
        // Only owner can change roles, and owner cannot be changed
        $myRole = $organization->getMemberRole($request->user()->id);
        $targetRole = $organization->getMemberRole($user->id);

        if ($myRole !== 'owner') {
            return response()->json(['error' => 'Only owner can change roles'], 403);
        }

        if ($targetRole === 'owner') {
            return response()->json(['error' => 'Cannot change owner role'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,manager,accountant,viewer',
        ]);

        $organization->users()->updateExistingPivot($user->id, [
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'Role updated successfully',
        ]);
    }

    public function removeMember(Request $request, Organization $organization, User $user): JsonResponse
    {
        $myRole = $organization->getMemberRole($request->user()->id);
        $targetRole = $organization->getMemberRole($user->id);

        if (!in_array($myRole, ['owner', 'admin'])) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        if ($targetRole === 'owner') {
            return response()->json(['error' => 'Cannot remove owner'], 403);
        }

        // Cannot remove yourself
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot remove yourself'], 400);
        }

        $organization->users()->detach($user->id);

        return response()->json([
            'message' => 'Member removed successfully',
        ]);
    }

    public function destroy(Request $request, Organization $organization): JsonResponse
    {
        // Only owner can delete organization
        if (!$request->user()->isOwner($organization->id)) {
            return response()->json(['error' => 'Only owner can delete organization'], 403);
        }

        // Soft delete
        $organization->delete();

        return response()->json([
            'message' => 'Organization deleted successfully',
        ]);
    }
}
