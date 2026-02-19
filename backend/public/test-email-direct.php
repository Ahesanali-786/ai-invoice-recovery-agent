<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice;
use App\Mail\PaymentReminder;
use Illuminate\Support\Facades\Mail;

try {
    $invoice = Invoice::with('client', 'user')->where('status', 'pending')->first();
    
    if (!$invoice) {
        echo "No pending invoices.\n";
        exit;
    }
    
    echo "Sending email to: {$invoice->client->email}\n";
    echo "Invoice: #{$invoice->invoice_number}\n";
    
    $messageText = "Dear Customer,\n\nThis is a friendly reminder that invoice #{$invoice->invoice_number} for {$invoice->currency} {$invoice->amount} is due on {$invoice->due_date->format('F j, Y')}. Please let us know if you have any questions.\n\nBest regards";
    
    // Send immediately (not queued)
    Mail::to($invoice->client->email)
        ->send(new PaymentReminder($invoice, $messageText, 'gentle'));
    
    echo "SUCCESS: Email sent!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
