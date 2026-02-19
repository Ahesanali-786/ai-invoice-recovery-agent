<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
        <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
        <p>Hello,</p>
        
        <p><strong>{{ $inviter->name }}</strong> has invited you to join <strong>{{ $organization->name }}</strong> on Invoice Recovery.</p>
        
        <div class="info-box">
            <h3>Organization Details:</h3>
            <p><strong>Name:</strong> {{ $organization->name }}</p>
            <p><strong>Role:</strong> {{ ucfirst($invitation->role) }}</p>
            <p><strong>Invited by:</strong> {{ $inviter->name }} ({{ $inviter->email }})</p>
        </div>
        
        <p>Click the button below to accept the invitation and join the organization:</p>
        
        <div style="text-align: center;">
            <a href="{{ $acceptUrl }}" class="button">Accept Invitation</a>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
            Or copy and paste this link into your browser:<br>
            <a href="{{ $acceptUrl }}">{{ $acceptUrl }}</a>
        </p>
        
        <p style="font-size: 14px; color: #6b7280;">
            This invitation will expire on {{ $invitation->expires_at->format('F j, Y') }}.
        </p>
        
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
    
    <div class="footer">
        <p>© {{ date('Y') }} Invoice Recovery. All rights reserved.</p>
    </div>
</body>
</html>
