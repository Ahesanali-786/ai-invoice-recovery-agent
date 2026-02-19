<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #ddd;
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: normal;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .message-box {
            background-color: #f9f9f9;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        .invoice-details {
            background-color: #ffffff;
            border: 1px solid #ddd;
            padding: 20px;
            margin: 20px 0;
        }
        .invoice-details h3 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 16px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #666;
            font-size: 14px;
        }
        .detail-value {
            color: #333;
            font-size: 14px;
            font-weight: bold;
        }
        .amount {
            color: #27ae60;
            font-size: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #f39c12;
            color: white;
        }
        .status-overdue {
            background-color: #e74c3c;
            color: white;
        }
        .status-paid {
            background-color: #27ae60;
            color: white;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .pay-button {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            font-size: 14px;
            border-radius: 3px;
        }
        .footer {
            background-color: #ecf0f1;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>
                @if($type === 'gentle')
                    Friendly Payment Reminder
                @elseif($type === 'urgent')
                    Payment Overdue Notice
                @elseif($type === 'final')
                    Final Payment Notice
                @else
                    Payment Reminder
                @endif
            </h1>
        </div>

        <div class="content">
            <p class="greeting">Dear {{ $invoice->client->name }},</p>

            <div class="message-box">
                {!! nl2br(e($reminderContent)) !!}
            </div>

            <div class="invoice-details">
                <h3>Invoice Information</h3>
                
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">#{{ $invoice->invoice_number }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Amount Due:</span>
                    <span class="detail-value amount">{{ $invoice->currency }} {{ number_format($invoice->amount, 2) }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Issue Date:</span>
                    <span class="detail-value">{{ $invoice->issue_date->format('M d, Y') }}</span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value" style="{{ $invoice->isOverdue() ? 'color: #e74c3c;' : '' }}">
                        {{ $invoice->due_date->format('M d, Y') }}
                        @if($invoice->isOverdue())
                            <span style="color: #e74c3c; font-size: 11px; display: block;">
                                ({{ $invoice->daysOverdue() }} days overdue)
                            </span>
                        @endif
                    </span>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        @if($invoice->isOverdue())
                            <span class="status-badge status-overdue">OVERDUE</span>
                        @elseif($invoice->status === 'paid')
                            <span class="status-badge status-paid">PAID</span>
                        @else
                            <span class="status-badge status-pending">PENDING</span>
                        @endif
                    </span>
                </div>
            </div>

            <div class="button-container">
                <a href="#" class="pay-button">Pay Invoice Now</a>
            </div>

            <p style="font-size: 13px; color: #666; text-align: center; margin-top: 30px;">
                If you have any questions, please contact us at<br>
                <strong>{{ config('mail.from.address') }}</strong>
            </p>

            <p style="font-size: 13px; color: #666; text-align: center; margin-top: 20px;">
                Thank you for your business.<br>
                <strong>{{ config('app.name') }}</strong>
            </p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
            <p>{{ config('app.url') }}</p>
        </div>
    </div>
</body>
</html>
