<?php

namespace App\Services;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class InvoicePdfService
{
    /**
     * Generate PDF for an invoice
     */
    public function generate(Invoice $invoice): \Barryvdh\DomPDF\PDF
    {
        $invoice->load(['client', 'user', 'lineItems']);
        
        $data = [
            'invoice' => $invoice,
            'company' => [
                'name' => $invoice->user->company_name ?? $invoice->user->name,
                'email' => $invoice->user->email,
                'phone' => $invoice->user->phone,
                'address' => $invoice->user->address ?? 'N/A',
            ],
            'client' => $invoice->client,
            'lineItems' => $invoice->lineItems ?? [],
            'subtotal' => $invoice->subtotal ?? $invoice->amount,
            'tax' => $invoice->tax_amount ?? 0,
            'total' => $invoice->amount,
            'status' => $this->getStatusBadge($invoice->status),
        ];

        return Pdf::loadView('pdf.invoice', $data);
    }

    /**
     * Generate and save PDF to storage
     */
    public function generateAndSave(Invoice $invoice): string
    {
        $pdf = $this->generate($invoice);
        $filename = 'invoices/invoice_' . $invoice->invoice_number . '_' . time() . '.pdf';
        
        Storage::disk('public')->makeDirectory('invoices');
        Storage::disk('public')->put($filename, $pdf->output());
        
        return Storage::disk('public')->path($filename);
    }

    /**
     * Stream PDF to browser
     */
    public function stream(Invoice $invoice)
    {
        $pdf = $this->generate($invoice);
        return $pdf->stream('invoice_' . $invoice->invoice_number . '.pdf');
    }

    /**
     * Download PDF
     */
    public function download(Invoice $invoice)
    {
        $pdf = $this->generate($invoice);
        return $pdf->download('invoice_' . $invoice->invoice_number . '.pdf');
    }

    /**
     * Get PDF output as string (for email attachment)
     */
    public function getPdfContent(Invoice $invoice): string
    {
        $pdf = $this->generate($invoice);
        return $pdf->output();
    }

    /**
     * Get status badge color and text
     */
    private function getStatusBadge(string $status): array
    {
        return match($status) {
            'paid' => ['color' => '#27ae60', 'text' => 'PAID'],
            'pending' => ['color' => '#f39c12', 'text' => 'PENDING'],
            'overdue' => ['color' => '#e74c3c', 'text' => 'OVERDUE'],
            'cancelled' => ['color' => '#95a5a6', 'text' => 'CANCELLED'],
            default => ['color' => '#3498db', 'text' => strtoupper($status)],
        };
    }
}
