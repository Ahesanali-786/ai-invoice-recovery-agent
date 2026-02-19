<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Services\InvoicePdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\App;

class PaymentReminder extends Mailable
{
    use Queueable, SerializesModels;

    public Invoice $invoice;
    public string $reminderContent;
    public string $type;

    public function __construct(Invoice $invoice, string $message, string $type = 'gentle')
    {
        $this->invoice = $invoice;
        $this->reminderContent = $message;
        $this->type = $type;
    }

    public function build(): self
    {
        $subject = match ($this->type) {
            'gentle' => 'Friendly Payment Reminder - Invoice #' . $this->invoice->invoice_number,
            'standard' => 'Payment Reminder - Invoice #' . $this->invoice->invoice_number,
            'urgent' => 'URGENT: Payment Overdue - Invoice #' . $this->invoice->invoice_number,
            'final' => 'FINAL NOTICE - Invoice #' . $this->invoice->invoice_number,
            default => 'Payment Reminder - Invoice #' . $this->invoice->invoice_number,
        };

        $pdfService = App::make(InvoicePdfService::class);
        $pdfContent = $pdfService->getPdfContent($this->invoice);

        return $this
            ->subject($subject)
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->view('emails.payment-reminder-simple')
            ->attachData($pdfContent, 'invoice_' . $this->invoice->invoice_number . '.pdf', [
                'mime' => 'application/pdf',
            ]);
    }
}
