<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\EmailConversation;
use App\Models\EmailMessage;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommunicationController extends Controller
{
    /**
     * Get all conversations (Email + WhatsApp combined)
     */
    public function getConversations(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        if (!$organizationId) {
            return response()->json(['conversations' => []]);
        }

        $conversations = EmailConversation::with(['client', 'latestMessage', 'invoice'])
            ->where('organization_id', $organizationId)
            ->orderByDesc('last_reply_at')
            ->get()
            ->map(function ($conv) {
                return [
                    'id' => $conv->id,
                    'type' => 'email',
                    'client' => [
                        'id' => $conv->client->id,
                        'name' => $conv->client->name,
                        'email' => $conv->client->email,
                    ],
                    'subject' => $conv->subject,
                    'status' => $conv->status,
                    'last_reply_at' => $conv->last_reply_at,
                    'reply_count' => $conv->reply_count,
                    'unread_count' => $conv->getUnreadCount(),
                    'latest_message' => $conv->latestMessage ? [
                        'direction' => $conv->latestMessage->direction,
                        'snippet' => $conv->latestMessage->getSnippet(80),
                        'sent_at' => $conv->latestMessage->sent_at,
                    ] : null,
                    'invoice' => $conv->invoice ? [
                        'id' => $conv->invoice->id,
                        'number' => $conv->invoice->invoice_number,
                    ] : null,
                ];
            });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Get single conversation with all messages
     */
    public function getConversation(Request $request, int $id): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        $conversation = EmailConversation::with(['client', 'messages', 'invoice'])
            ->where('id', $id)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        // Mark incoming messages as read
        $conversation->markAsRead();

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
                'status' => $conversation->status,
                'client' => [
                    'id' => $conversation->client->id,
                    'name' => $conversation->client->name,
                    'email' => $conversation->client->email,
                ],
                'invoice' => $conversation->invoice ? [
                    'id' => $conversation->invoice->id,
                    'number' => $conversation->invoice->invoice_number,
                    'amount' => $conversation->invoice->amount,
                ] : null,
                'messages' => $conversation->messages->map(function ($msg) {
                    return [
                        'id' => $msg->id,
                        'direction' => $msg->direction,
                        'from_email' => $msg->from_email,
                        'to_email' => $msg->to_email,
                        'subject' => $msg->subject,
                        'body' => $msg->body,
                        'body_html' => $msg->body_html,
                        'attachments' => $msg->attachments,
                        'sent_at' => $msg->sent_at,
                        'is_read' => $msg->is_read,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Send reply to email conversation
     */
    public function sendReply(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'body' => 'required|string',
            'subject' => 'sometimes|string',
        ]);

        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        $conversation = EmailConversation::where('id', $id)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $body = $request->input('body');
        $subject = $request->input('subject', $conversation->subject);

        // Store outgoing message
        $message = EmailMessage::create([
            'conversation_id' => $conversation->id,
            'client_id' => $conversation->client_id,
            'direction' => 'outgoing',
            'from_email' => config('mail.from.address'),
            'to_email' => $conversation->client->email,
            'subject' => $subject,
            'body' => $body,
            'body_html' => nl2br(htmlentities($body)),
            'sent_at' => now(),
            'status' => 'sent',
            'is_read' => true,
        ]);

        // Update conversation
        $conversation->update([
            'last_reply_at' => now(),
            'reply_count' => $conversation->reply_count + 1,
        ]);

        // Here you would integrate with your email service (SendGrid/Mailgun)
        // to actually send the email

        Log::info('Email reply sent', [
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
        ]);

        return response()->json([
            'message' => 'Reply sent successfully',
            'conversation' => $conversation->fresh(),
        ]);
    }

    /**
     * Get unread conversation count
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        if (!$organizationId) {
            return response()->json(['count' => 0]);
        }

        $count = EmailMessage::whereHas('conversation', function ($q) use ($organizationId) {
                $q->where('organization_id', $organizationId);
            })
            ->where('direction', 'incoming')
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Close conversation
     */
    public function closeConversation(Request $request, int $id): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        $conversation = EmailConversation::where('id', $id)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }

        $conversation->update(['status' => 'closed']);

        return response()->json([
            'message' => 'Conversation closed successfully',
        ]);
    }

    /**
     * Get conversations by client
     */
    public function getClientConversations(Request $request, int $clientId): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        
        $conversations = EmailConversation::with(['latestMessage'])
            ->where('client_id', $clientId)
            ->where('organization_id', $organizationId)
            ->orderByDesc('last_reply_at')
            ->get()
            ->map(function ($conv) {
                return [
                    'id' => $conv->id,
                    'subject' => $conv->subject,
                    'status' => $conv->status,
                    'last_reply_at' => $conv->last_reply_at,
                    'reply_count' => $conv->reply_count,
                    'unread_count' => $conv->getUnreadCount(),
                    'latest_message' => $conv->latestMessage ? [
                        'direction' => $conv->latestMessage->direction,
                        'snippet' => $conv->latestMessage->getSnippet(80),
                    ] : null,
                ];
            });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Start new conversation from invoice
     */
    public function startConversationFromInvoice(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,id',
            'subject' => 'required|string',
            'body' => 'required|string',
        ]);

        $organizationId = $request->attributes->get('organization_id') ?? Auth::user()->current_organization_id;
        $userId = Auth::id();

        $invoice = Invoice::with('client')->findOrFail($request->input('invoice_id'));
        
        if (!$organizationId || $invoice->client->organization_id != $organizationId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Create conversation
        $conversation = EmailConversation::create([
            'client_id' => $invoice->client_id,
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'invoice_id' => $invoice->id,
            'subject' => $request->input('subject'),
            'thread_id' => uniqid('thread_'),
            'status' => 'active',
            'last_reply_at' => now(),
            'reply_count' => 1,
        ]);

        // Store outgoing message
        EmailMessage::create([
            'conversation_id' => $conversation->id,
            'client_id' => $invoice->client_id,
            'direction' => 'outgoing',
            'from_email' => config('mail.from.address'),
            'to_email' => $invoice->client->email,
            'subject' => $request->input('subject'),
            'body' => $request->input('body'),
            'body_html' => nl2br(htmlentities($request->input('body'))),
            'sent_at' => now(),
            'status' => 'sent',
            'is_read' => true,
        ]);

        return response()->json([
            'message' => 'Conversation started successfully',
            'conversation' => $conversation,
        ], 201);
    }
}
