<?php

namespace App\Jobs;

use App\Mail\PaymentReminder;
use App\Models\Invoice;
use App\Models\Reminder;
use App\Services\InvoiceParserService;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendPaymentReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private Invoice $invoice,
        private string $type = 'gentle'
    ) {}

    public function handle(
        InvoiceParserService $aiService,
        WhatsAppService $whatsappService
    ): void {
        if ($this->invoice->status === 'paid') {
            return;
        }

        $client = $this->invoice->client;
        $user = $this->invoice->user;

        $message = $aiService->generateReminderMessage(
            [
                'invoice_number' => $this->invoice->invoice_number,
                'amount' => $this->invoice->amount,
                'currency' => $this->invoice->currency,
                'due_date' => $this->invoice->due_date->format('F j, Y'),
            ],
            $this->type,
            $this->invoice->escalation_level
        );

        $emailSent = false;
        $whatsappSent = false;
        $errors = [];

        // 1. SEND EMAIL (always)
        try {
            $emailReminder = Reminder::create([
                'invoice_id' => $this->invoice->id,
                'type' => $this->type,
                'channel' => 'email',
                'content' => $message,
                'status' => 'pending',
                'escalation_level' => $this->invoice->escalation_level,
            ]);

            Mail::to($client->email)
                ->send(new PaymentReminder($this->invoice, $message, $this->type));

            $emailReminder->markAsSent();
            $emailSent = true;
        } catch (\Exception $e) {
            Log::error('Failed to send email reminder', [
                'invoice_id' => $this->invoice->id,
                'error' => $e->getMessage(),
            ]);
            $errors[] = 'Email: ' . $e->getMessage();
            if (isset($emailReminder)) {
                $emailReminder->markAsFailed($e->getMessage());
            }
        }

        // 2. SEND WHATSAPP (always if number exists)
        if ($client->whatsapp_number) {
            try {
                $whatsappReminder = Reminder::create([
                    'invoice_id' => $this->invoice->id,
                    'type' => $this->type,
                    'channel' => 'whatsapp',
                    'content' => $message,
                    'status' => 'pending',
                    'escalation_level' => $this->invoice->escalation_level,
                ]);

                $result = $whatsappService->sendMessage(
                    $client->whatsapp_number,
                    $message
                );

                if ($result['success']) {
                    $whatsappReminder->markAsSent();
                    $whatsappSent = true;
                } else {
                    $error = $result['error'] ?? 'WhatsApp API failed';
                    $whatsappReminder->markAsFailed($error);
                    $errors[] = 'WhatsApp: ' . $error;
                }
            } catch (\Exception $e) {
                Log::error('Failed to send WhatsApp reminder', [
                    'invoice_id' => $this->invoice->id,
                    'error' => $e->getMessage(),
                ]);
                $errors[] = 'WhatsApp: ' . $e->getMessage();
                if (isset($whatsappReminder)) {
                    $whatsappReminder->markAsFailed($e->getMessage());
                }
            }
        } else {
            $errors[] = 'WhatsApp: No WhatsApp number available';
        }

        // Update invoice reminder count if at least one was sent
        if ($emailSent || $whatsappSent) {
            $this->invoice->increment('reminder_count');
            $this->invoice->update(['last_reminder_sent_at' => now()]);
        }

        // Log overall result
        if (!empty($errors)) {
            Log::warning('Reminder partially sent', [
                'invoice_id' => $this->invoice->id,
                'email_sent' => $emailSent,
                'whatsapp_sent' => $whatsappSent,
                'errors' => $errors,
            ]);
        }
    }
}
