<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validated->fails()) {
            return response()->json(['errors' => $validated->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validated->fails()) {
            return response()->json(['errors' => $validated->errors()], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                ]
            );

            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend callback with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/auth/google/callback?token={$token}");
        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/login?error=google_auth_failed");
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
            'reminder_settings' => 'nullable|array',
            'whatsapp_enabled' => 'nullable|boolean',
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
            'reminder_settings' => 'nullable|array',
            'whatsapp_enabled' => 'nullable|boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => [
                'timezone' => $user->timezone,
                'currency' => $user->currency,
                'reminder_settings' => $user->reminder_settings,
                'whatsapp_enabled' => $user->whatsapp_enabled,
            ]
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['error' => 'Current password is incorrect'], 400);
        }

        $user->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Password changed successfully']);
    }
}
