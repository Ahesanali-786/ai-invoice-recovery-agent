<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use Closure;
use Illuminate\Http\Request;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next, ?string $requiredPermission = null)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        // Get current organization from header or user's default
        $organizationId = $request->header('X-Organization-ID') 
            ?? $user->current_organization_id;

        if (!$organizationId) {
            // Check if user has any organizations
            $firstOrg = $user->organizations()->first();
            if ($firstOrg) {
                $organizationId = $firstOrg->id;
                $user->setCurrentOrganization($organizationId);
            } else {
                return response()->json(['error' => 'No organization found'], 403);
            }
        }

        // Verify user has access to this organization
        $organization = Organization::find($organizationId);
        
        if (!$organization || !$organization->isActive()) {
            return response()->json(['error' => 'Organization not found or inactive'], 403);
        }

        if (!$user->organizations()->where('organizations.id', $organizationId)->exists()) {
            return response()->json(['error' => 'Access denied to this organization'], 403);
        }

        // Check specific permission if required
        if ($requiredPermission && !$user->hasPermission($organizationId, $requiredPermission)) {
            return response()->json(['error' => 'Insufficient permissions'], 403);
        }

        // Set organization context for the request
        $request->attributes->set('organization_id', $organizationId);
        $request->attributes->set('organization', $organization);

        // Update last accessed
        $user->organizations()->updateExistingPivot($organizationId, [
            'last_accessed_at' => now()
        ]);

        return $next($request);
    }
}
