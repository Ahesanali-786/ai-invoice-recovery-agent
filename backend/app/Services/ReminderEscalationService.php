<?php

namespace App\Services;

use App\Mail\PaymentReceiptMail;
use App\Mail\ReminderMail;
use App\Models\AutomatedReminder;
use App\Models\ClientBehaviorAnalysis;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ReminderEscalationService
{
    /**
     * Tone escalation stages with content variations
     */
    private array $escalationStages = [
        'gentle' => [
            'subject' => 'Friendly reminder: Invoice {{ invoice_number }} - {{ amount }}',
            'tone' => 'friendly',
            'emoji' => '👋',
            'header_color' => '#667eea',
            'days_after_due' => 0,
        ],
        'standard' => [
            'subject' => 'Payment reminder: Invoice {{ invoice_number }} - {{ amount }}',
            'tone' => 'professional',
            'emoji' => '📋',
            'header_color' => '#f59e0b',
            'days_after_due' => 7,
        ],
        'urgent' => [
            'subject' => 'Urgent: Invoice {{ invoice_number }} - {{ amount }} - Action required',
            'tone' => 'urgent',
            'emoji' => '⚠️',
            'header_color' => '#ef4444',
            'days_after_due' => 14,
        ],
        'final' => [
            'subject' => 'FINAL NOTICE: Invoice {{ invoice_number }} - {{ amount }}',
            'tone' => 'final',
            'emoji' => '🚨',
            'header_color' => '#7c2d12',
            'days_after_due' => 30,
        ],
    ];

    /**
     * Send automated reminder with smart escalation
     */
    public function sendReminder(int $automatedReminderId): array
    {
        $reminder = AutomatedReminder::with(['invoice', 'client'])->find($automatedReminderId);

        if (!$reminder || $reminder->status !== 'active') {
            return ['success' => false, 'message' => 'Reminder not found or inactive'];
        }

        // Check if invoice already paid
        $invoice = $reminder->invoice;
        if ($invoice->status === 'paid') {
            $this->markAsPaid($reminder, $invoice);
            return ['success' => true, 'message' => 'Invoice already paid, reminder stopped'];
        }

        $stage = $this->escalationStages[$reminder->current_stage];
        $analysis = ClientBehaviorAnalysis::where('client_id', $reminder->client_id)->first();

        // Build email content with current stage tone
        $emailData = $this->buildEmailContent($reminder, $stage, $analysis);

        // Send via preferred channel
        $sent = $this->dispatchReminder($reminder, $emailData);

        if ($sent) {
            // Update reminder record
            $reminder->update([
                'last_reminder_sent_at' => now(),
                'total_reminders_sent' => $reminder->total_reminders_sent + 1,
            ]);

            // Schedule next reminder or escalate
            $this->scheduleNextStep($reminder, $analysis);

            Log::info('Automated reminder sent', [
                'reminder_id' => $reminder->id,
                'stage' => $reminder->current_stage,
                'channel' => $reminder->channel,
            ]);

            return [
                'success' => true,
                'message' => "{$reminder->current_stage} reminder sent via {$reminder->channel}",
                'next_action' => $reminder->next_scheduled_at,
            ];
        }

        return ['success' => false, 'message' => 'Failed to send reminder'];
    }

    /**
     * Build email content based on stage and personalization
     */
    private function buildEmailContent(AutomatedReminder $reminder, array $stage, ?ClientBehaviorAnalysis $analysis): array
    {
        $invoice = $reminder->invoice;
        $client = $reminder->client;

        // Personalize tone based on client behavior
        $personalization = '';
        if ($analysis && $analysis->responds_to_discounts && $stage['tone'] !== 'final') {
            $discount = $analysis->getRecommendedDiscount();
            $personalization = "\n\n💰 <strong>Limited time offer:</strong> Pay within 3 days and receive a {$discount}% early payment discount!";
        }

        $subject = str_replace(
            ['{{ invoice_number }}', '{{ amount }}'],
            [$invoice->invoice_number, '$' . number_format($invoice->amount, 2)],
            $stage['subject']
        );

        $body = $this->getEmailTemplate($stage['tone'], [
            'client_name' => $client->name,
            'invoice_number' => $invoice->invoice_number,
            'amount' => '$' . number_format($invoice->amount, 2),
            'due_date' => $invoice->due_date->format('F j, Y'),
            'days_overdue' => $invoice->due_date->diffInDays(now()),
            'emoji' => $stage['emoji'],
            'header_color' => $stage['header_color'],
            'personalization' => $personalization,
            'payment_url' => config('app.frontend_url') . '/pay/' . $invoice->id,
        ]);

        return [
            'subject' => $subject,
            'body' => $body,
            'tone' => $stage['tone'],
        ];
    }

    /**
     * Get email template HTML for specific tone
     */
    private function getEmailTemplate(string $tone, array $data): string
    {
        $templates = [
            'friendly' => $this->getFriendlyTemplate($data),
            'professional' => $this->getProfessionalTemplate($data),
            'urgent' => $this->getUrgentTemplate($data),
            'final' => $this->getFinalTemplate($data),
        ];

        return $templates[$tone] ?? $templates['professional'];
    }

    /**
     * Dispatch reminder via appropriate channel
     */
    private function dispatchReminder(AutomatedReminder $reminder, array $emailData): bool
    {
        $client = $reminder->client;
        $user = User::find($reminder->user_id);

        try {
            switch ($reminder->channel) {
                case 'email':
                    Mail::to($client->email)->send(new ReminderMail($emailData));
                    break;
                case 'whatsapp':
                    // Send WhatsApp message (implement with WhatsApp Business API)
                    $this->sendWhatsAppReminder($client, $emailData);
                    break;
                case 'both':
                    Mail::to($client->email)->send(new ReminderMail($emailData));
                    $this->sendWhatsAppReminder($client, $emailData);
                    break;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send reminder', [
                'error' => $e->getMessage(),
                'reminder_id' => $reminder->id,
            ]);
            return false;
        }
    }

    /**
     * Schedule next reminder or escalate
     */
    private function scheduleNextStep(AutomatedReminder $reminder, ?ClientBehaviorAnalysis $analysis): void
    {
        // Check if max reminders reached
        if ($reminder->total_reminders_sent >= 6) {
            $reminder->stop('max_attempts');
            return;
        }

        // Check if should escalate
        $daysSinceLastReminder = $reminder->last_reminder_sent_at->diffInDays(now());
        $currentStageConfig = $this->escalationStages[$reminder->current_stage];
        $nextStage = $reminder->getNextStage();

        if ($nextStage && $daysSinceLastReminder >= 7) {
            // Escalate to next stage
            $reminder->escalate();
        }

        // Schedule next reminder using smart strategy
        $smartService = new SmartReminderService();
        $strategy = $smartService->getSmartStrategy($reminder->invoice_id, $reminder->client_id);
        $nextScheduled = $smartService->scheduleNextReminder($strategy);

        $reminder->update([
            'next_scheduled_at' => $nextScheduled,
            'scheduled_hour' => $strategy['send_hour'],
            'scheduled_day' => $strategy['send_day'],
        ]);
    }

    /**
     * Mark reminder as paid and send receipt
     */
    public function markAsPaid(AutomatedReminder $reminder, Invoice $invoice): void
    {
        $reminder->markPaymentReceived();

        // Send thank you receipt
        $this->sendPaymentReceipt($invoice, $reminder->client);

        Log::info('Payment auto-confirmed and receipt sent', [
            'invoice_id' => $invoice->id,
            'client_id' => $reminder->client_id,
        ]);
    }

    /**
     * Send payment confirmation receipt
     */
    public function sendPaymentReceipt(Invoice $invoice, $client): void
    {
        $receiptData = [
            'client_name' => $client->name,
            'invoice_number' => $invoice->invoice_number,
            'amount' => '$' . number_format($invoice->amount, 2),
            'paid_date' => now()->format('F j, Y'),
            'payment_method' => 'Online Payment',
            'receipt_number' => 'RCP-' . $invoice->id . '-' . now()->format('Ymd'),
        ];

        try {
            Mail::to($client->email)->send(new PaymentReceiptMail($receiptData));

            Log::info('Payment receipt sent', [
                'invoice_id' => $invoice->id,
                'client_id' => $client->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send receipt', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send WhatsApp reminder (placeholder for WhatsApp Business API)
     */
    private function sendWhatsAppReminder($client, array $emailData): void
    {
        // Implement WhatsApp Business API integration
        Log::info('WhatsApp reminder queued', [
            'client_id' => $client->id,
            'message' => $emailData['subject'],
        ]);
    }

    /**
     * Email templates
     */
    private function getFriendlyTemplate(array $data): string
    {
        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: {$data['header_color']}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: {$data['header_color']}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>{$data['emoji']} Friendly Reminder</h1>
    </div>
    <div class='content'>
        <p>Hi {$data['client_name']},</p>
        <p>Just a friendly reminder that invoice <strong>{$data['invoice_number']}</strong> for <strong>{$data['amount']}</strong> was due on {$data['due_date']}.</p>
        <p>If you've already sent the payment, please ignore this email. Otherwise, you can easily pay online:</p>
        <div style='text-align: center;'>
            <a href='{$data['payment_url']}' class='button'>Pay Invoice</a>
        </div>
        {$data['personalization']}
        <p>Thank you for your business!</p>
    </div>
    <div class='footer'>
        <p>© " . date('Y') . " Invoice Recovery. All rights reserved.</p>
    </div>
</body>
</html>";
    }

    private function getProfessionalTemplate(array $data): string
    {
        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: {$data['header_color']}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid {$data['header_color']}; }
        .button { background: {$data['header_color']}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>{$data['emoji']} Payment Reminder</h1>
    </div>
    <div class='content'>
        <p>Dear {$data['client_name']},</p>
        <p>This is a reminder regarding the following outstanding invoice:</p>
        <div class='info-box'>
            <p><strong>Invoice Number:</strong> {$data['invoice_number']}</p>
            <p><strong>Amount:</strong> {$data['amount']}</p>
            <p><strong>Due Date:</strong> {$data['due_date']}</p>
            <p><strong>Days Overdue:</strong> {$data['days_overdue']}</p>
        </div>
        <p>Please remit payment at your earliest convenience. You can pay securely online:</p>
        <div style='text-align: center;'>
            <a href='{$data['payment_url']}' class='button'>Pay Now</a>
        </div>
        {$data['personalization']}
    </div>
    <div class='footer'>
        <p>© " . date('Y') . " Invoice Recovery. All rights reserved.</p>
    </div>
</body>
</html>";
    }

    private function getUrgentTemplate(array $data): string
    {
        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: {$data['header_color']}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning-box { background: white; border: 2px solid {$data['header_color']}; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .button { background: {$data['header_color']}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>{$data['emoji']} URGENT: Payment Required</h1>
    </div>
    <div class='content'>
        <p>Dear {$data['client_name']},</p>
        <div class='warning-box'>
            <p><strong>⚠️ ACTION REQUIRED</strong></p>
            <p>Invoice <strong>{$data['invoice_number']}</strong> for <strong>{$data['amount']}</strong> is now <strong>{$data['days_overdue']} days overdue</strong>.</p>
            <p><strong>Due Date:</strong> {$data['due_date']}</p>
        </div>
        <p>Immediate payment is required to avoid further action. Please settle this invoice today:</p>
        <div style='text-align: center;'>
            <a href='{$data['payment_url']}' class='button'>Pay Immediately</a>
        </div>
        {$data['personalization']}
        <p>If payment has already been sent, please disregard this notice.</p>
    </div>
    <div class='footer'>
        <p>© " . date('Y') . " Invoice Recovery. All rights reserved.</p>
    </div>
</body>
</html>";
    }

    private function getFinalTemplate(array $data): string
    {
        return "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: {$data['header_color']}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
        .final-notice { background: #7c2d12; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
        .button { background: {$data['header_color']}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>{$data['emoji']} FINAL NOTICE</h1>
    </div>
    <div class='content'>
        <p>Dear {$data['client_name']},</p>
        <div class='final-notice'>
            <p><strong>⚠️ FINAL NOTICE BEFORE COLLECTION ACTION</strong></p>
            <p>Invoice <strong>{$data['invoice_number']}</strong></p>
            <p>Amount: <strong>{$data['amount']}</strong></p>
            <p>Overdue: <strong>{$data['days_overdue']} days</strong></p>
        </div>
        <p>This is our final attempt to collect payment before escalating to collections. Payment must be received within 3 business days.</p>
        <div style='text-align: center;'>
            <a href='{$data['payment_url']}' class='button'>Pay Now - Avoid Collections</a>
        </div>
        <p style='margin-top: 20px;'><strong>Next Steps if Unpaid:</strong></p>
        <ul>
            <li>Account referred to collections agency</li>
            <li>Credit reporting may be affected</li>
            <li>Legal action may be pursued</li>
        </ul>
    </div>
    <div class='footer'>
        <p>© " . date('Y') . " Invoice Recovery. All rights reserved.</p>
    </div>
</body>
</html>";
    }

    /**
     * Process all ready-to-send reminders (for scheduled job)
     */
    public function processScheduledReminders(): array
    {
        $reminders = AutomatedReminder::readyToSend()->get();
        $results = ['sent' => 0, 'failed' => 0, 'paid' => 0];

        foreach ($reminders as $reminder) {
            $result = $this->sendReminder($reminder->id);

            if ($result['success']) {
                if (str_contains($result['message'], 'already paid')) {
                    $results['paid']++;
                } else {
                    $results['sent']++;
                }
            } else {
                $results['failed']++;
            }
        }

        return $results;
    }
}
