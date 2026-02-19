<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AutomatedReminder;
use App\Models\Invoice;
use App\Services\ReminderEscalationService;
use App\Services\SmartReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SmartReminderController extends Controller
{
    private SmartReminderService $smartService;
    private ReminderEscalationService $escalationService;

    public function __construct(
        SmartReminderService $smartService,
        ReminderEscalationService $escalationService
    ) {
        $this->smartService = $smartService;
        $this->escalationService = $escalationService;
    }

    /**
     * Start automated reminder sequence for an invoice
     */
    public function startAutomation(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,id',
            'use_smart_strategy' => 'boolean',
        ]);

        $invoiceId = $request->input('invoice_id');
        $useSmart = $request->input('use_smart_strategy', true);
        $userId = Auth::id();

        $invoice = Invoice::with('client')->findOrFail($invoiceId);

        // Check if automation already exists
        $existing = AutomatedReminder::where('invoice_id', $invoiceId)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Automation already active for this invoice',
                'automation' => $existing,
            ], 409);
        }

        // Get organization ID first (before smart strategy)
        $organizationId = $request->attributes->get('organization_id') ?? $request->user()->current_organization_id;

        if (!$organizationId) {
            return response()->json([
                'message' => 'No organization selected. Please select an organization first.',
            ], 400);
        }

        // Get smart strategy if enabled
        $strategy = null;
        if ($useSmart) {
            $strategy = $this->smartService->getSmartStrategy($invoiceId, $invoice->client_id, (int) $organizationId);
        }

        // Schedule first reminder
        $nextScheduled = $useSmart && $strategy
            ? $this->smartService->scheduleNextReminder($strategy)
            : now()->addHours(1);

        // Create automation record
        $automation = AutomatedReminder::create([
            'invoice_id' => $invoiceId,
            'client_id' => $invoice->client_id,
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'current_stage' => $strategy['recommended_tone'] ?? 'gentle',
            'next_scheduled_at' => $nextScheduled,
            'scheduled_hour' => $strategy['send_hour'] ?? 10,
            'scheduled_day' => $strategy['send_day'] ?? 'Tuesday',
            'channel' => $strategy['channel'] ?? 'email',
            'used_personalized_strategy' => $useSmart,
            'discount_offered' => $strategy['offer_discount'] ? ($strategy['discount_rate'] ?? 0) : null,
            'status' => 'active',
        ]);

        // Analyze client behavior if smart strategy enabled
        if ($useSmart) {
            $this->smartService->analyzeClient($invoice->client_id, $automation->organization_id);
        }

        Log::info('Smart automation started', [
            'invoice_id' => $invoiceId,
            'strategy' => $strategy ?? 'default',
        ]);

        return response()->json([
            'message' => 'Smart automation started successfully',
            'automation' => $automation,
            'strategy' => $strategy,
        ], 201);
    }

    /**
     * Process all pending automated reminders (for cron job)
     */
    public function processReminders(): JsonResponse
    {
        $results = $this->escalationService->processScheduledReminders();

        return response()->json([
            'message' => 'Reminders processed',
            'results' => $results,
        ]);
    }

    /**
     * Get all active automations for organization
     */
    public function index(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? $request->user()->current_organization_id;

        if (!$organizationId) {
            return response()->json(['automations' => []]);
        }

        $automations = AutomatedReminder::with(['invoice', 'client'])
            ->where('organization_id', $organizationId)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'invoice' => [
                    'id' => $a->invoice->id,
                    'number' => $a->invoice->invoice_number,
                    'amount' => $a->invoice->amount,
                    'status' => $a->invoice->status,
                ],
                'client' => [
                    'id' => $a->client->id,
                    'name' => $a->client->name,
                    'email' => $a->client->email,
                ],
                'current_stage' => $a->current_stage,
                'reminder_count' => $a->total_reminders_sent,
                'status' => $a->status,
                'next_scheduled' => $a->next_scheduled_at,
                'channel' => $a->channel,
                'used_personalized_strategy' => $a->used_personalized_strategy,
            ]);

        return response()->json(['automations' => $automations]);
    }

    /**
     * Get client behavior analysis
     */
    public function getClientBehavior(Request $request, int $clientId): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? $request->user()->current_organization_id;

        if (!$organizationId) {
            return response()->json([
                'analysis' => null,
                'message' => 'No organization selected.',
            ], 400);
        }

        $analysis = \App\Models\ClientBehaviorAnalysis::with('client')
            ->where('client_id', $clientId)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$analysis) {
            // Analyze on demand
            $analysis = $this->smartService->analyzeClient($clientId, $organizationId);
        }

        return response()->json([
            'analysis' => [
                'client' => [
                    'id' => $analysis->client->id,
                    'name' => $analysis->client->name,
                ],
                'avg_payment_days' => $analysis->avg_payment_days,
                'on_time_payment_rate' => $analysis->on_time_payment_rate,
                'risk_category' => $analysis->risk_category,
                'churn_risk_score' => $analysis->churn_risk_score,
                'optimal_send_hour' => $analysis->optimal_send_hour,
                'optimal_send_day' => $analysis->optimal_send_day,
                'preferred_channel' => $analysis->preferred_channel,
                'responds_to_discounts' => $analysis->responds_to_discounts,
                'effective_discount_rate' => $analysis->effective_discount_rate,
                'last_analyzed' => $analysis->last_analyzed_at,
            ],
        ]);
    }

    /**
     * Get all client behavior analyses for organization
     */
    public function getAllClientBehaviors(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? $request->user()->current_organization_id;

        if (!$organizationId) {
            return response()->json([
                'clients' => [],
                'risk_summary' => ['high' => 0, 'medium' => 0, 'low' => 0],
            ]);
        }

        $analyses = \App\Models\ClientBehaviorAnalysis::with('client')
            ->where('organization_id', $organizationId)
            ->orderByDesc('churn_risk_score')
            ->get()
            ->map(fn($a) => [
                'client_id' => $a->client_id,
                'client_name' => $a->client->name,
                'risk_category' => $a->risk_category,
                'churn_risk_score' => $a->churn_risk_score,
                'avg_payment_days' => $a->avg_payment_days,
                'on_time_rate' => $a->on_time_payment_rate,
                'preferred_channel' => $a->preferred_channel,
                'optimal_time' => "{$a->optimal_send_day} at {$a->optimal_send_hour}:00",
            ]);

        $riskSummary = [
            'high' => $analyses->where('risk_category', 'high')->count(),
            'medium' => $analyses->where('risk_category', 'medium')->count(),
            'low' => $analyses->where('risk_category', 'low')->count(),
        ];

        return response()->json([
            'clients' => $analyses,
            'risk_summary' => $riskSummary,
        ]);
    }

    /**
     * Stop automation
     */
    public function stopAutomation(Request $request, int $id): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id') ?? $request->user()->current_organization_id;

        if (!$organizationId) {
            return response()->json([
                'message' => 'No organization selected.',
            ], 400);
        }

        $automation = AutomatedReminder::where('id', $id)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$automation) {
            return response()->json(['message' => 'Automation not found'], 404);
        }

        $automation->stop('manual');

        return response()->json([
            'message' => 'Automation stopped successfully',
        ]);
    }

    /**
     * Handle payment webhook (Stripe/Razorpay/etc)
     */
    public function handlePaymentWebhook(Request $request): JsonResponse
    {
        // Validate webhook signature (implement based on payment provider)
        $payload = $request->all();

        // Extract payment details
        $invoiceId = $payload['invoice_id'] ?? null;
        $paymentStatus = $payload['status'] ?? null;

        if (!$invoiceId || $paymentStatus !== 'completed') {
            return response()->json(['message' => 'Invalid webhook data'], 400);
        }

        $invoice = Invoice::find($invoiceId);
        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        // Mark invoice as paid
        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Stop any active automation for this invoice
        $automation = AutomatedReminder::where('invoice_id', $invoiceId)
            ->where('status', 'active')
            ->first();

        if ($automation) {
            $this->escalationService->markAsPaid($automation, $invoice);
        } else {
            // Just send receipt
            $this->escalationService->sendPaymentReceipt($invoice, $invoice->client);
        }

        Log::info('Payment auto-confirmed via webhook', [
            'invoice_id' => $invoiceId,
            'client_id' => $invoice->client_id,
        ]);

        return response()->json([
            'message' => 'Payment confirmed and receipt sent',
        ]);
    }

    /**
     * Batch analyze all clients
     */
    public function batchAnalyze(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        // Fallback to user's current organization if not set
        if (!$organizationId) {
            $organizationId = $request->user()->current_organization_id;
        }

        if (!$organizationId) {
            return response()->json([
                'message' => 'No organization selected. Please select an organization first.',
            ], 400);
        }

        $results = $this->smartService->batchAnalyzeOrganization((int) $organizationId);

        return response()->json([
            'message' => 'Batch analysis completed',
            'results' => $results,
        ]);
    }

    /**
     * Preview reminder at specific stage
     */
    public function previewReminder(Request $request): JsonResponse
    {
        $request->validate([
            'stage' => 'required|in:gentle,standard,urgent,final',
            'invoice_id' => 'required|integer|exists:invoices,id',
        ]);

        $stage = $request->input('stage');
        $invoiceId = $request->input('invoice_id');

        $invoice = Invoice::with('client')->findOrFail($invoiceId);
        $organizationId = $request->attributes->get('organization_id');

        // Get analysis for personalization
        $analysis = \App\Models\ClientBehaviorAnalysis::where('client_id', $invoice->client_id)
            ->where('organization_id', $organizationId)
            ->first();

        $stages = [
            'gentle' => [
                'subject' => 'Friendly reminder: Invoice ' . $invoice->invoice_number,
                'tone' => 'friendly',
            ],
            'standard' => [
                'subject' => 'Payment reminder: Invoice ' . $invoice->invoice_number,
                'tone' => 'professional',
            ],
            'urgent' => [
                'subject' => 'Urgent: Invoice ' . $invoice->invoice_number . ' - Action required',
                'tone' => 'urgent',
            ],
            'final' => [
                'subject' => 'FINAL NOTICE: Invoice ' . $invoice->invoice_number,
                'tone' => 'final',
            ],
        ];

        return response()->json([
            'preview' => [
                'stage' => $stage,
                'subject' => $stages[$stage]['subject'],
                'tone' => $stages[$stage]['tone'],
                'personalization' => $analysis ? [
                    'risk_category' => $analysis->risk_category,
                    'optimal_hour' => $analysis->optimal_send_hour,
                    'channel' => $analysis->preferred_channel,
                    'discount_eligible' => $analysis->qualifiesForDiscount(),
                ] : null,
            ],
        ]);
    }
}
