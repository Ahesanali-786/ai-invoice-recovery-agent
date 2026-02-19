<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;
use App\Services\InvoicePdfService;

try {
    $invoice = Invoice::with(['client', 'user'])->where('status', 'pending')->first();
    
    if (!$invoice) {
        echo "ERROR: No pending invoices found.\n";
        exit;
    }
    
    echo "Invoice: #{$invoice->invoice_number}\n";
    echo "Client: {$invoice->client->name}\n";
    echo "Amount: {$invoice->currency} {$invoice->amount}\n";
    
    $pdfService = new InvoicePdfService();
    $filename = 'test_invoice_' . $invoice->invoice_number . '.pdf';
    $path = '/var/www/backend/storage/app/public/' . $filename;
    
    // Generate and save
    $pdf = $pdfService->generate($invoice);
    file_put_contents($path, $pdf->output());
    
    echo "\nSUCCESS: PDF Generated!\n";
    echo "Saved to: storage/app/public/{$filename}\n";
    echo "File size: " . filesize($path) . " bytes\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nStack trace:\n" . $e->getTraceAsString() . "\n";
}
