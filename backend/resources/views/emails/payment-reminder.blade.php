<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            line-height: 1.6;
            color: #333;
        }

        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }

        .email-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin: 0;
        }

        .email-header .company-name {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
        }

        .email-body {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .message-content {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            white-space: pre-line;
        }

        .invoice-card {
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
        }

        .invoice-card h3 {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }

        .invoice-details {
            display: table;
            width: 100%;
        }

        .detail-row {
            display: table-row;
        }

        .detail-label {
            display: table-cell;
            padding: 8px 0;
            color: #718096;
            font-size: 14px;
            width: 40%;
        }

        .detail-value {
            display: table-cell;
            padding: 8px 0;
            color: #2d3748;
            font-size: 14px;
            font-weight: 600;
        }

        .amount-highlight {
            font-size: 28px;
            color: #667eea;
            font-weight: 700;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-pending {
            background-color: #fef3c7;
            color: #d97706;
        }

        .status-overdue {
            background-color: #fee2e2;
            color: #dc2626;
        }

        .status-paid {
            background-color: #d1fae5;
            color: #059669;
        }

        .cta-section {
            text-align: center;
            margin: 35px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .cta-button:hover {
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .support-section {
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
        }

        .support-section h4 {
            font-size: 16px;
            color: #2d3748;
            margin-bottom: 10px;
        }

        .support-section p {
            font-size: 14px;
            color: #718096;
        }

        .email-footer {
            background-color: #2d3748;
            padding: 30px;
            text-align: center;
        }

        .email-footer p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
            margin: 5px 0;
        }

        .social-links {
            margin-top: 15px;
        }

        .social-links a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            margin: 0 10px;
            font-size: 13px;
        }

        @media only screen and (max-width: 600px) {
            .email-wrapper {
                margin: 10px;
            }

            .email-header,
            .email-body,
            .email-footer {
                padding: 25px 20px;
            }

            .invoice-card {
                padding: 20px;
            }
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1>{{ $type === 'gentle' ? 'Friendly Reminder' : ($type === 'urgent' ? 'Payment Overdue' : ($type === 'final' ? 'Final Notice' : 'Payment Reminder')) }}
            </h1>
            <p class="company-name">{{ config('app.name') }}</p>
        </div>

        <div class="email-body">
            <p class="greeting">Dear {{ $invoice->client->name }},</p>

            <div class="message-content">
                {!! nl2br(e($reminderContent)) !!}
            </div>

            <div class="invoice-card">
                <h3>Invoice Details</h3>
                <div class="invoice-details">
                    <div class="detail-row">
                        <span class="detail-label">Invoice Number:</span>
                        <span class="detail-value">#{{ $invoice->invoice_number }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Amount Due:</span>
                        <span class="detail-value amount-highlight">{{ $invoice->currency }}
                            {{ number_format($invoice->amount, 2) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Issue Date:</span>
                        <span class="detail-value">{{ $invoice->issue_date->format('F j, Y') }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        <span class="detail-value" style="{{ $invoice->isOverdue() ? 'color: #dc2626;' : '' }}">
                            {{ $invoice->due_date->format('F j, Y') }}
                            @if($invoice->isOverdue())
                                <span style="color: #dc2626; font-size: 12px; display: block; margin-top: 4px;">
                                    ({{ $invoice->daysOverdue() }} days overdue)
                                </span>
                            @endif
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span
                                class="status-badge status-{{ $invoice->status }}{{ $invoice->isOverdue() ? ' status-overdue' : '' }}">
                                {{ $invoice->isOverdue() ? 'OVERDUE' : strtoupper($invoice->status) }}
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="cta-section">
                <a href="#" class="cta-button">Pay Now</a>
            </div>

            <div class="support-section">
                <h4>Need Help?</h4>
                <p>If you have any questions about this invoice or need assistance with payment,<br>please contact us at
                    {{ config('mail.from.address') }}</p>
            </div>

            <p style="font-size: 14px; color: #718096; text-align: center; margin-top: 30px;">
                Thank you for your business!<br>
                <strong>{{ config('app.name') }} Team</strong>
            </p>
        </div>

        <div class="email-footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>{{ config('app.url') }}</p>
        </div>
    </div>
</body>

</html>