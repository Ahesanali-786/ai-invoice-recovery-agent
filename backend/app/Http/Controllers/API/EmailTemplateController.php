<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class EmailTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = Auth::user()->emailTemplates()->get();

        return response()->json([
            'templates' => $templates,
        ]);
    }

    public function show(string $type): JsonResponse
    {
        $template = EmailTemplate::where('user_id', Auth::id())
            ->where('template_type', $type)
            ->first();

        if (!$template) {
            return response()->json([
                'template' => null,
                'message' => 'No custom template found. Default template will be used.',
            ]);
        }

        return response()->json([
            'template' => $template,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'template_type' => 'required|string|max:50',
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'is_active' => 'boolean',
            ]);

            $validated['user_id'] = Auth::id();
            $validated['is_active'] = $validated['is_active'] ?? true;

            // Check if template already exists for this type
            $existing = EmailTemplate::where('user_id', Auth::id())
                ->where('template_type', $validated['template_type'])
                ->first();

            if ($existing) {
                $existing->update($validated);
                $template = $existing;
                $message = 'Template updated successfully';
            } else {
                $template = EmailTemplate::create($validated);
                $message = 'Template created successfully';
            }

            return response()->json([
                'message' => $message,
                'template' => $template,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $template = EmailTemplate::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$template) {
            return response()->json([
                'message' => 'Template not found',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'subject' => 'sometimes|string|max:255',
                'body' => 'sometimes|string',
                'is_active' => 'boolean',
            ]);

            $template->update($validated);

            return response()->json([
                'message' => 'Template updated successfully',
                'template' => $template,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $template = EmailTemplate::where('user_id', Auth::id())
            ->where('id', $id)
            ->first();

        if (!$template) {
            return response()->json([
                'message' => 'Template not found',
            ], 404);
        }

        $template->delete();

        return response()->json([
            'message' => 'Template deleted successfully. Default template will be used.',
        ]);
    }

    public function getDefaultTemplate(string $type): JsonResponse
    {
        $defaultTemplates = [
            'organization_invitation' => [
                'name' => 'Organization Invitation (Default)',
                'subject' => 'You\'ve been invited to join {{ organization_name }}',
                'body' => $this->getDefaultOrganizationInvitationTemplate(),
                'available_variables' => [
                    'inviter_name' => 'Name of the person sending the invitation',
                    'inviter_email' => 'Email of the person sending the invitation',
                    'organization_name' => 'Name of the organization',
                    'invitation_role' => 'Role assigned in the invitation',
                    'accept_url' => 'URL to accept the invitation',
                    'expires_at' => 'Expiration date of the invitation',
                    'app_name' => 'Application name',
                    'year' => 'Current year',
                ],
            ],
        ];

        $template = $defaultTemplates[$type] ?? null;

        if (!$template) {
            return response()->json([
                'message' => 'Default template type not found',
            ], 404);
        }

        return response()->json([
            'template' => $template,
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'body' => 'required|string',
                'subject' => 'required|string',
            ]);

            // Sample data for preview
            $variables = [
                'inviter_name' => 'John Doe',
                'inviter_email' => 'john@example.com',
                'organization_name' => 'Acme Corporation',
                'invitation_role' => 'Admin',
                'accept_url' => config('app.frontend_url', 'http://localhost:5173') . '/accept-invitation?token=sample-token',
                'expires_at' => now()->addDays(7)->format('F j, Y'),
                'app_name' => config('app.name', 'Invoice Recovery'),
                'year' => date('Y'),
            ];

            $body = $validated['body'];
            $subject = $validated['subject'];

            foreach ($variables as $key => $value) {
                $placeholder = '{{ ' . $key . ' }}';
                $body = str_replace($placeholder, $value, $body);
                $subject = str_replace($placeholder, $value, $subject);
            }

            return response()->json([
                'subject' => $subject,
                'body' => $body,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    private function getDefaultOrganizationInvitationTemplate(): string
    {
        return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
        .info-box {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>You\'re Invited!</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p><strong>{{ inviter_name }}</strong> has invited you to join <strong>{{ organization_name }}</strong> on {{ app_name }}.</p>
        <div class="info-box">
            <h3>Organization Details:</h3>
            <p><strong>Name:</strong> {{ organization_name }}</p>
            <p><strong>Role:</strong> {{ invitation_role }}</p>
            <p><strong>Invited by:</strong> {{ inviter_name }} ({{ inviter_email }})</p>
        </div>
        <p>Click the button below to accept the invitation and join the organization:</p>
        <div style="text-align: center;">
            <a href="{{ accept_url }}" class="button">Accept Invitation</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
            Or copy and paste this link into your browser:<br>
            <a href="{{ accept_url }}">{{ accept_url }}</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">
            This invitation will expire on {{ expires_at }}.
        </p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
        <p>&copy; {{ year }} {{ app_name }}. All rights reserved.</p>
    </div>
</body>
</html>';
    }
}
