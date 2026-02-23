<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
        ]);

        if ($validated->fails()) {
            return response()->json(['error' => 'Email not found'], 404);
        }

        $email = $request->email;
        $token = Str::random(64);

        // Delete any existing tokens for this email
        DB::table('password_resets')->where('email', $email)->delete();

        // Insert new token
        DB::table('password_resets')->insert([
            'email' => $email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Generate reset URL
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $resetUrl = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($email);

        // Send email
        try {
            $this->sendPasswordResetEmail($email, $resetUrl);
        } catch (\Exception $e) {
            // Log error but don't expose to user for security
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Password reset link sent to your email',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validated->fails()) {
            return response()->json(['errors' => $validated->errors()], 422);
        }

        // Find the reset record
        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json(['error' => 'Invalid or expired reset token'], 400);
        }

        // Check if token is expired (1 hour)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_resets')->where('email', $request->email)->delete();
            return response()->json(['error' => 'Reset token has expired'], 400);
        }

        // Verify token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['error' => 'Invalid reset token'], 400);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        // Delete reset token
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully']);
    }

    private function sendPasswordResetEmail(string $email, string $resetUrl): void
    {
        $user = User::where('email', $email)->first();
        $appName = config('app.name', 'Invoice Recovery');

        $subject = "Reset Your Password - {$appName}";

        // Plain text email for maximum compatibility
        $body = "Hello {$user->name},\n\n";
        $body .= "You are receiving this email because we received a password reset request for your account.\n\n";
        $body .= "Click the link below to reset your password:\n";
        $body .= $resetUrl . "\n\n";
        $body .= "This password reset link will expire in 60 minutes.\n\n";
        $body .= "If you did not request a password reset, no further action is required.\n\n";
        $body .= "Regards,\n";
        $body .= "{$appName} Team";

        // Check if we're in production or development
        $mailDriver = config('mail.default', config('mail.driver', 'log'));

        if ($mailDriver === 'log' || $mailDriver === null) {
            // Log the email for local development
            \Log::info('PASSWORD RESET EMAIL', [
                'to' => $email,
                'subject' => $subject,
                'reset_url' => $resetUrl,
                'body' => $body,
            ]);
        } else {
            // Send actual email
            Mail::raw($body, function ($message) use ($email, $subject) {
                $message
                    ->to($email)
                    ->subject($subject);
            });
        }
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar if exists (extract path from full URL)
        if ($user->avatar) {
            $avatarPath = str_replace(asset(''), '', $user->avatar);
            if (str_starts_with($avatarPath, 'storage/')) {
                $filePath = str_replace('storage/', '', $avatarPath);
                $oldPath = storage_path('app/public/' . $filePath);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        // Update user with full URL
        $avatarUrl = asset('storage/' . $path);
        $user->update(['avatar' => $avatarUrl]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'avatar' => $avatarUrl,
        ]);
    }

    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        // Delete avatar file if exists (extract path from full URL)
        if ($user->avatar) {
            $avatarPath = str_replace(asset(''), '', $user->avatar);
            if (str_starts_with($avatarPath, 'storage/')) {
                $filePath = str_replace('storage/', '', $avatarPath);
                $path = storage_path('app/public/' . $filePath);
                if (file_exists($path)) {
                    unlink($path);
                }
            }
        }

        // Set avatar to null (will use UI Avatars fallback)
        $user->update(['avatar' => null]);

        return response()->json([
            'message' => 'Avatar removed successfully',
            'avatar' => null,
        ]);
    }
}
