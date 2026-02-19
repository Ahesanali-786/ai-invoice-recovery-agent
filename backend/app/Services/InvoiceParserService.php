<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use OpenAI;

class InvoiceParserService
{
    private $client;

    public function __construct()
    {
        $apiKey = config('services.openai.api_key');
        $this->client = $apiKey ? OpenAI::client($apiKey) : null;
    }

    public function parseInvoice(UploadedFile $file): array
    {
        $path = Storage::disk('local')->path($file->store('temp', 'local'));

        $mimeType = $file->getMimeType();

        if (str_starts_with($mimeType, 'image/')) {
            $base64 = base64_encode(file_get_contents($path));
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an invoice parsing assistant. Extract key information from invoices and return it as JSON. Include: invoice_number, invoice_date, due_date, total_amount, vendor_name, vendor_address, line_items (array of description, quantity, unit_price, total), tax_amount, subtotal.'
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:' . $mimeType . ';base64,' . $base64
                                ]
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 2000,
            ]);
        } else {
            $content = file_get_contents($path);
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an invoice parsing assistant. Extract key information from invoice text and return it as JSON. Include: invoice_number, invoice_date, due_date, total_amount, vendor_name, vendor_address, line_items (array of description, quantity, unit_price, total), tax_amount, subtotal.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $content
                    ]
                ],
                'max_tokens' => 2000,
            ]);
        }

        Storage::disk('local')->delete($file->hashName('temp'));

        $content = $response->choices[0]->message->content ?? '{}';

        $jsonStart = strpos($content, '{');
        $jsonEnd = strrpos($content, '}');

        if ($jsonStart !== false && $jsonEnd !== false) {
            $json = substr($content, $jsonStart, $jsonEnd - $jsonStart + 1);
            return json_decode($json, true) ?? [];
        }

        return [];
    }

    public function generateReminderMessage(array $invoice, string $type, int $escalationLevel): string
    {
        // Fallback if OpenAI client is not configured
        if (!$this->client) {
            $templates = [
                'gentle' => "Dear Customer,\n\nThis is a friendly reminder that invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} is due on {$invoice['due_date']}. Please let us know if you have any questions.\n\nBest regards",
                'standard' => "Dear Customer,\n\nPlease be reminded that invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} was due on {$invoice['due_date']}. Kindly arrange payment at your earliest convenience.\n\nBest regards",
                'urgent' => "Dear Customer,\n\nInvoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} is now OVERDUE (due date: {$invoice['due_date']}). Please make payment immediately to avoid further action.\n\nBest regards",
                'final' => "Dear Customer,\n\nFINAL NOTICE: Invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} remains unpaid despite previous reminders. Immediate payment is required to avoid escalation.\n\nBest regards",
            ];
            return $templates[$type] ?? $templates['standard'];
        }

        $prompts = [
            'gentle' => "Write a polite, friendly payment reminder email for invoice #{$invoice['invoice_number']} of {$invoice['currency']} {$invoice['amount']} due on {$invoice['due_date']}. Keep it warm and understanding.",
            'standard' => "Write a professional payment reminder email for invoice #{$invoice['invoice_number']} of {$invoice['currency']} {$invoice['amount']} that was due on {$invoice['due_date']}. Be firm but professional.",
            'urgent' => "Write an urgent payment reminder email for overdue invoice #{$invoice['invoice_number']} of {$invoice['currency']} {$invoice['amount']} that was due on {$invoice['due_date']}. Emphasize the overdue status.",
            'final' => "Write a final notice payment demand email for seriously overdue invoice #{$invoice['invoice_number']} of {$invoice['currency']} {$invoice['amount']}. Mention potential escalation.",
        ];

        $prompt = $prompts[$type] ?? $prompts['standard'];

        if ($escalationLevel > 0) {
            $prompt .= " This is escalation level {$escalationLevel}.";
        }

        try {
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a professional accounts receivable assistant. Write concise, effective payment reminder messages.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'max_tokens' => 500,
            ]);

            return trim($response->choices[0]->message->content ?? 'Payment reminder');
        } catch (\Exception $e) {
            // Fallback template if AI fails
            $templates = [
                'gentle' => "Dear Customer,\n\nThis is a friendly reminder that invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} is due on {$invoice['due_date']}. Please let us know if you have any questions.\n\nBest regards",
                'standard' => "Dear Customer,\n\nPlease be reminded that invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} was due on {$invoice['due_date']}. Kindly arrange payment at your earliest convenience.\n\nBest regards",
                'urgent' => "Dear Customer,\n\nInvoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} is now OVERDUE (due date: {$invoice['due_date']}). Please make payment immediately to avoid further action.\n\nBest regards",
                'final' => "Dear Customer,\n\nFINAL NOTICE: Invoice #{$invoice['invoice_number']} for {$invoice['currency']} {$invoice['amount']} remains unpaid despite previous reminders. Immediate payment is required to avoid escalation.\n\nBest regards",
            ];
            return $templates[$type] ?? $templates['standard'];
        }
    }
}
