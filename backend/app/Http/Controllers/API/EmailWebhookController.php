<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\EmailConversation;
use App\Models\EmailMessage;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailWebhookController extends Controller
{
    /**
     * Handle incoming email from SendGrid/Mailgun/AWS SES
     * Production-ready webhook endpoint
     */
    public function handleIncomingEmail(Request $request): JsonResponse
    {
        // Validate webhook signature (implement based on provider)
        // SendGrid: X-Twilio-Email-Event-Webhook-Signature
        // Mailgun: signature verification
        
        $payload = $request->all();
        
        // Extract email data based on provider format
        $emailData = $this->parseEmailPayload($payload);
        
        if (!$emailData['from'] || !$emailData['to']) {
            return response()->json(['message' => 'Invalid email data'], 400);
        }
        
        // Find client by email
        $client = Client::where('email', $emailData['from'])->first();
        
        if (!$client) {
            Log::warning('Email received from unknown client', ['from' => $emailData['from']]);
            return response()->json(['message' => 'Client not found'], 404);
        }
        
        // Find existing conversation or create new
        $conversation = $this->findOrCreateConversation(
            $client,
            $emailData['subject'],
            $emailData['message_id'],
            $emailData['in_reply_to']
        );
        
        // Store the incoming email message
        $message = EmailMessage::create([
            'conversation_id' => $conversation->id,
            'client_id' => $client->id,
            'direction' => 'incoming',
            'from_email' => $emailData['from'],
            'to_email' => $emailData['to'],
            'subject' => $emailData['subject'],
            'body' => $emailData['text'] ?? '',
            'body_html' => $emailData['html'] ?? null,
            'attachments' => $emailData['attachments'] ?? [],
            'message_id' => $emailData['message_id'],
            'in_reply_to' => $emailData['in_reply_to'],
            'sent_at' => now(),
            'status' => 'delivered',
            'is_read' => false,
        ]);
        
        // Update conversation stats
        $conversation->update([
            'last_reply_at' => now(),
            'reply_count' => $conversation->reply_count + 1,
        ]);
        
        Log::info('Email reply received and stored', [
            'conversation_id' => $conversation->id,
            'client_id' => $client->id,
            'message_id' => $message->id,
        ]);
        
        return response()->json([
            'message' => 'Email received successfully',
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
        ]);
    }

    /**
     * Parse email payload from different providers
     */
    private function parseEmailPayload(array $payload): array
    {
        // SendGrid format
        if (isset($payload['from'])) {
            return [
                'from' => $payload['from'] ?? null,
                'to' => $payload['to'] ?? null,
                'subject' => $payload['subject'] ?? 'No Subject',
                'text' => $payload['text'] ?? '',
                'html' => $payload['html'] ?? null,
                'message_id' => $payload['headers']['Message-ID'] ?? null,
                'in_reply_to' => $payload['headers']['In-Reply-To'] ?? null,
                'attachments' => $payload['attachments'] ?? [],
            ];
        }
        
        // Mailgun format
        if (isset($payload['sender'])) {
            return [
                'from' => $payload['sender'] ?? null,
                'to' => $payload['recipient'] ?? null,
                'subject' => $payload['subject'] ?? 'No Subject',
                'text' => $payload['body-plain'] ?? '',
                'html' => $payload['body-html'] ?? null,
                'message_id' => $payload['Message-Id'] ?? null,
                'in_reply_to' => $payload['In-Reply-To'] ?? null,
                'attachments' => $this->parseMailgunAttachments($payload),
            ];
        }
        
        // AWS SES format
        if (isset($payload['mail'])) {
            return [
                'from' => $payload['mail']['commonHeaders']['from'][0] ?? null,
                'to' => $payload['mail']['commonHeaders']['to'][0] ?? null,
                'subject' => $payload['mail']['commonHeaders']['subject'] ?? 'No Subject',
                'text' => $payload['content'] ?? '',
                'html' => null,
                'message_id' => $payload['mail']['messageId'] ?? null,
                'in_reply_to' => null,
                'attachments' => [],
            ];
        }
        
        // Generic fallback
        return [
            'from' => $payload['from'] ?? $payload['sender'] ?? null,
            'to' => $payload['to'] ?? $payload['recipient'] ?? null,
            'subject' => $payload['subject'] ?? 'No Subject',
            'text' => $payload['text'] ?? $payload['body'] ?? '',
            'html' => $payload['html'] ?? null,
            'message_id' => $payload['message_id'] ?? null,
            'in_reply_to' => $payload['in_reply_to'] ?? null,
            'attachments' => $payload['attachments'] ?? [],
        ];
    }

    /**
     * Parse Mailgun attachments
     */
    private function parseMailgunAttachments(array $payload): array
    {
        $attachments = [];
        if (isset($payload['attachments'])) {
            foreach ($payload['attachments'] as $attachment) {
                $attachments[] = [
                    'filename' => $attachment['filename'] ?? 'unknown',
                    'size' => $attachment['size'] ?? 0,
                    'url' => $attachment['url'] ?? null,
                ];
            }
        }
        return $attachments;
    }

    /**
     * Find existing conversation or create new one
     */
    private function findOrCreateConversation(
        Client $client,
        string $subject,
        ?string $messageId,
        ?string $inReplyTo
    ): EmailConversation {
        
        // Try to find by thread reference
        if ($inReplyTo) {
            $parentMessage = EmailMessage::where('message_id', $inReplyTo)->first();
            if ($parentMessage) {
                return $parentMessage->conversation;
            }
        }
        
        // Try to find by subject (simplified thread matching)
        $cleanSubject = $this->cleanSubject($subject);
        $existingConversation = EmailConversation::where('client_id', $client->id)
            ->whereRaw('LOWER(subject) LIKE ?', ['%' . strtolower($cleanSubject) . '%'])
            ->where('status', 'active')
            ->where('created_at', '>=', now()->subDays(30))
            ->first();
        
        if ($existingConversation) {
            return $existingConversation;
        }
        
        // Create new conversation
        // Try to find related invoice by subject
        $invoice = $this->findInvoiceBySubject($client, $subject);
        
        return EmailConversation::create([
            'client_id' => $client->id,
            'organization_id' => $client->organization_id,
            'user_id' => $client->user_id ?? 1,
            'invoice_id' => $invoice?->id,
            'subject' => $subject,
            'message_id' => $messageId,
            'thread_id' => $messageId ?? uniqid('thread_'),
            'status' => 'active',
            'last_reply_at' => now(),
            'reply_count' => 1,
        ]);
    }

    /**
     * Clean subject line for matching (remove Re:, Fwd:, etc.)
     */
    private function cleanSubject(string $subject): string
    {
        $prefixes = ['Re:', 'RE:', 'Fwd:', 'FWD:', 'Fw:', 'FW:'];
        $clean = $subject;
        foreach ($prefixes as $prefix) {
            $clean = preg_replace('/^' . preg_quote($prefix, '/') . '\s*/i', '', $clean);
        }
        return trim($clean);
    }

    /**
     * Try to find invoice by subject line
     */
    private function findInvoiceBySubject(Client $client, string $subject): ?Invoice
    {
        // Extract invoice number patterns like INV-001, INV-2024-001, etc.
        if (preg_match('/INV[-]?([A-Z0-9-]+)/i', $subject, $matches)) {
            $invoiceNumber = $matches[0];
            return Invoice::where('client_id', $client->id)
                ->where('invoice_number', 'like', "%$invoiceNumber%")
                ->first();
        }
        
        // Try to find recent invoices for this client
        return Invoice::where('client_id', $client->id)
            ->where('status', '!=', 'paid')
            ->orderByDesc('created_at')
            ->first();
    }

    /**
     * Health check endpoint for webhook
     */
    public function healthCheck(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'email-webhook',
            'timestamp' => now()->toISOString(),
        ]);
    }
}
