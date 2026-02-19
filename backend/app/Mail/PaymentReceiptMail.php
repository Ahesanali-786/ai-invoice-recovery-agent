<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $receiptData;

    public function __construct(array $receiptData)
    {
        $this->receiptData = $receiptData;
    }

    public function build(): self
    {
        $html = $this->buildReceiptHtml();

        return $this
            ->subject("✅ Payment Received - {$this->receiptData['invoice_number']}")
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->html($html);
    }

    private function buildReceiptHtml(): string
    {
        $data = $this->receiptData;

        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Payment Receipt</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f3f4f6;
        }
        .container {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .receipt-badge {
            background: white;
            color: #059669;
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            margin-top: 15px;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
        }
        .thank-you {
            text-align: center;
            margin-bottom: 30px;
        }
        .thank-you h2 {
            color: #059669;
            margin: 0 0 10px;
        }
        .receipt-details {
            background: #f9fafb;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-size: 14px;
        }
        .detail-value {
            font-weight: 600;
            color: #111827;
        }
        .amount-paid {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 25px 0;
        }
        .amount-paid .label {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .amount-paid .value {
            font-size: 36px;
            font-weight: 700;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            color: #6b7280;
            font-size: 13px;
        }
        .footer p {
            margin: 5px 0;
        }
        .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✅ Payment Received</h1>
            <p>Thank you for your business!</p>
            <div class='receipt-badge'>OFFICIAL RECEIPT</div>
        </div>
        
        <div class='content'>
            <div class='thank-you'>
                <h2>Thank You, {$data['client_name']}!</h2>
                <p>Your payment has been successfully processed and recorded.</p>
            </div>
            
            <div class='amount-paid'>
                <div class='label'>Amount Paid</div>
                <div class='value'>{$data['amount']}</div>
            </div>
            
            <div class='receipt-details'>
                <div class='detail-row'>
                    <span class='detail-label'>Receipt Number</span>
                    <span class='detail-value'>{$data['receipt_number']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Invoice Number</span>
                    <span class='detail-value'>{$data['invoice_number']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Payment Date</span>
                    <span class='detail-value'>{$data['paid_date']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Payment Method</span>
                    <span class='detail-value'>{$data['payment_method']}</span>
                </div>
            </div>
            
            <p style='text-align: center; color: #6b7280; font-size: 14px;'>
                This receipt confirms that your payment has been received in full. <br>
                Please keep this receipt for your records.
            </p>
        </div>
        
        <div class='footer'>
            <p><strong>" . config('app.name', 'Invoice Recovery') . "</strong></p>
            <p>&copy; " . date('Y') . " All rights reserved.</p>
            <div class='contact-info'>
                <p>Questions? Contact us at " . config('mail.from.address') . "</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }
}
