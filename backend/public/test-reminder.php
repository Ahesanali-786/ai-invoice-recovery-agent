<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;
use App\Jobs\SendPaymentReminder;

try {
    // Get first pending invoice
    $invoice = Invoice::with('client', 'user')->where('status', 'pending')->first();
    
    if (!$invoice) {
        echo "No pending invoices found.\n";
        exit;
    }
    
    echo "Testing reminder for Invoice #{$invoice->invoice_number}\n";
    echo "Client: {$invoice->client->name} ({$invoice->client->email})\n";
    echo "Preferred channel: {$invoice->client->preferred_contact_method}\n";
    
    // Dispatch job synchronously
    $job = new SendPaymentReminder($invoice, 'gentle');
    $job->handle(
        app(\App\Services\InvoiceParserService::class),
        app(\App\Services\WhatsAppService::class)
    );
    
    echo "SUCCESS: Job completed!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
