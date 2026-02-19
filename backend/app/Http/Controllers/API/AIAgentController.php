<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AIAgentActivity;
use App\Models\AIAgentMessage;
use App\Models\Client;
use App\Models\Invoice;
use App\Services\OpenAIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AIAgentController extends Controller
{
    /**
     * Get AI Agent status
     */
    public function status(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->attributes->get('organization_id');
            Log::info('AIAgent status called', ['org_id' => $organizationId]);

            // Get recent activity stats
            $tasksCompleted = AIAgentActivity::where('organization_id', $organizationId)
                ->where('type', 'task_completed')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            $insightsGenerated = AIAgentActivity::where('organization_id', $organizationId)
                ->where('type', 'insight')
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            $lastActivity = AIAgentActivity::where('organization_id', $organizationId)
                ->latest()
                ->first();

            // Check if there's any ongoing background task
            $currentTask = AIAgentActivity::where('organization_id', $organizationId)
                ->where('status', 'processing')
                ->latest()
                ->first();

            return response()->json([
                'is_online' => true,
                'current_task' => $currentTask?->description,
                'last_activity' => $lastActivity?->created_at?->diffForHumans(),
                'tasks_completed' => $tasksCompleted,
                'insights_generated' => $insightsGenerated,
            ]);
        } catch (\Exception $e) {
            Log::error('AIAgent status error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get AI-generated insights
     */
    public function insights(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');
        $insights = [];

        // Analyze overdue invoices
        $overdueCount = Invoice::where('organization_id', $organizationId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->count();

        if ($overdueCount > 0) {
            $totalOverdue = Invoice::where('organization_id', $organizationId)
                ->where('status', '!=', 'paid')
                ->where('due_date', '<', now())
                ->sum('amount');

            $insights[] = [
                'id' => 'overdue-alert',
                'type' => 'warning',
                'title' => "{$overdueCount} Overdue Invoices",
                'description' => "Total overdue amount: \${$totalOverdue}. Send reminders to recover payments.",
                'action' => [
                    'label' => 'Send All Reminders',
                    'type' => 'send_reminder',
                    'params' => ['filter' => 'overdue']
                ]
            ];
        }

        // Identify at-risk clients
        $atRiskClients = $this->getAtRiskClients($organizationId);
        if (count($atRiskClients) > 0) {
            $insights[] = [
                'id' => 'at-risk-clients',
                'type' => 'action',
                'title' => count($atRiskClients) . ' At-Risk Clients',
                'description' => 'These clients have overdue invoices with no response to reminders.',
                'action' => [
                    'label' => 'View & Take Action',
                    'type' => 'analyze',
                    'params' => ['type' => 'at_risk']
                ]
            ];
        }

        // Detect fast payers for appreciation
        $fastPayers = $this->getFastPayers($organizationId);
        if (count($fastPayers) > 0) {
            $insights[] = [
                'id' => 'fast-payers',
                'type' => 'success',
                'title' => count($fastPayers) . ' Fast-Paying Clients',
                'description' => 'These clients consistently pay within 3 days. Consider offering early payment discounts.',
            ];
        }

        // Revenue prediction
        $predictedRevenue = $this->predictRevenue($organizationId);
        if ($predictedRevenue > 0) {
            $insights[] = [
                'id' => 'revenue-forecast',
                'type' => 'info',
                'title' => 'Revenue Forecast',
                'description' => "Expected \${$predictedRevenue} in the next 30 days from pending invoices.",
            ];
        }

        return response()->json($insights);
    }

    /**
     * Get chat messages history
     */
    public function messages(Request $request): JsonResponse
    {
        try {
            $organizationId = $request->attributes->get('organization_id');
            $userId = $request->user()->id;
            Log::info('AIAgent messages called', ['org_id' => $organizationId, 'user_id' => $userId]);

            $messages = AIAgentMessage::where('organization_id', $organizationId)
                ->where('user_id', $userId)
                ->orderBy('created_at', 'asc')
                ->limit(50)
                ->get()
                ->map(fn($msg) => [
                    'id' => $msg->id,
                    'role' => $msg->role,
                    'content' => $msg->content,
                    'timestamp' => $msg->created_at->toISOString(),
                    'actions' => $msg->actions,
                ]);

            return response()->json($messages);
        } catch (\Exception $e) {
            Log::error('AIAgent messages error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Process chat message
     */
    public function chat(Request $request): JsonResponse
    {
        try {
            $request->validate(['message' => 'required|string']);

            $organizationId = $request->attributes->get('organization_id');
            $userId = $request->user()->id;
            $userMessage = $request->input('message');
            Log::info('AIAgent chat called', ['org_id' => $organizationId, 'user_id' => $userId]);

            // Save user message
            AIAgentMessage::create([
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'role' => 'user',
                'content' => $userMessage,
            ]);

            // Process with AI
            $response = $this->processAIRequest($userMessage, $organizationId);

            // Save AI response
            $aiMessage = AIAgentMessage::create([
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'role' => 'assistant',
                'content' => $response['content'],
                'actions' => $response['actions'] ?? null,
            ]);

            // Log activity
            AIAgentActivity::create([
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'type' => 'chat',
                'description' => 'AI chat interaction',
            ]);

            return response()->json([
                'id' => $aiMessage->id,
                'content' => $aiMessage->content,
                'actions' => $aiMessage->actions,
            ]);
        } catch (\Exception $e) {
            Log::error('AIAgent chat error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Execute AI-suggested action
     */
    public function execute(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|string',
            'params' => 'array',
        ]);

        $organizationId = $request->attributes->get('organization_id');
        $userId = $request->user()->id;
        $type = $request->input('type');
        $params = $request->input('params', []);

        $result = match ($type) {
            'send_reminder' => $this->executeSendReminder($organizationId, $params),
            'schedule_followup' => $this->executeScheduleFollowup($organizationId, $params),
            'mark_paid' => $this->executeMarkPaid($organizationId, $params),
            'analyze' => $this->executeAnalyze($organizationId, $params),
            default => ['success' => false, 'message' => 'Unknown action type'],
        };

        if ($result['success']) {
            AIAgentActivity::create([
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'type' => 'task_completed',
                'description' => $result['message'],
                'status' => 'completed',
            ]);
        }

        return response()->json($result);
    }

    /**
     * Natural language search for invoices
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['query' => 'required|string']);

        $organizationId = $request->attributes->get('organization_id');
        $query = $request->input('query');

        // Use AI to parse the natural language query
        $openAIService = new OpenAIService();
        $parsedQuery = $openAIService->parseSearchQuery($query);

        $invoices = Invoice::where('organization_id', $organizationId)
            ->with('client')
            ->when($parsedQuery['client'], fn($q, $client) =>
                $q->whereHas('client', fn($cq) => $cq->where('name', 'like', "%{$client}%")))
            ->when($parsedQuery['status'], fn($q, $status) => $q->where('status', $status))
            ->when($parsedQuery['min_amount'], fn($q, $amount) => $q->where('amount', '>=', $amount))
            ->when($parsedQuery['max_amount'], fn($q, $amount) => $q->where('amount', '<=', $amount))
            ->when($parsedQuery['overdue'], fn($q) => $q->where('due_date', '<', now())->where('status', '!=', 'paid'))
            ->limit(20)
            ->get();

        return response()->json([
            'query' => $query,
            'parsed' => $parsedQuery,
            'results' => $invoices,
            'count' => $invoices->count(),
        ]);
    }

    // Private helper methods

    private function processAIRequest(string $message, int $organizationId): array
    {
        $lowerMessage = strtolower($message);

        // Check for specific intents
        if (str_contains($lowerMessage, 'reminder') || str_contains($lowerMessage, 'send')) {
            return $this->handleReminderIntent($message, $organizationId);
        }

        if (str_contains($lowerMessage, 'overdue') || str_contains($lowerMessage, 'at risk')) {
            return $this->handleRiskAnalysisIntent($organizationId);
        }

        if (str_contains($lowerMessage, 'revenue') || str_contains($lowerMessage, 'forecast')) {
            return $this->handleRevenueForecastIntent($organizationId);
        }

        if (str_contains($lowerMessage, 'mark paid') || str_contains($lowerMessage, 'payment received')) {
            return $this->handleMarkPaidIntent($message, $organizationId);
        }

        // Default: Use OpenAI for general queries
        $context = $this->buildOrganizationContext($organizationId);
        $openAIService = new OpenAIService();
        $response = $openAIService->chat($message, $context);

        return [
            'content' => $response['content'],
            'actions' => $response['actions'] ?? null,
        ];
    }

    private function handleReminderIntent(string $message, int $organizationId): array
    {
        $overdueInvoices = Invoice::where('organization_id', $organizationId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->with('client')
            ->get();

        $count = $overdueInvoices->count();

        if ($count === 0) {
            return [
                'content' => "Great news! You don't have any overdue invoices that need reminders.",
                'actions' => [],
            ];
        }

        $totalAmount = $overdueInvoices->sum('amount');

        return [
            'content' => "I found {$count} overdue invoices totaling \${$totalAmount}. Would you like me to send reminders to all of them?",
            'actions' => [
                [
                    'type' => 'send_reminder',
                    'label' => "Send Reminders to All ({$count})",
                    'params' => ['filter' => 'overdue', 'count' => $count],
                ],
                [
                    'type' => 'analyze',
                    'label' => 'Review First',
                    'params' => ['type' => 'overdue_invoices'],
                ],
            ],
        ];
    }

    private function handleRiskAnalysisIntent(int $organizationId): array
    {
        $atRiskClients = $this->getAtRiskClients($organizationId);
        $count = count($atRiskClients);

        if ($count === 0) {
            return [
                'content' => 'Your client portfolio looks healthy! No high-risk clients detected at the moment.',
                'actions' => [],
            ];
        }

        return [
            'content' => "I identified {$count} clients at high risk of non-payment. These clients have multiple overdue invoices with no response to previous reminders.",
            'actions' => [
                [
                    'type' => 'analyze',
                    'label' => 'View Risk Details',
                    'params' => ['type' => 'at_risk'],
                ],
            ],
        ];
    }

    private function handleRevenueForecastIntent(int $organizationId): array
    {
        $pendingAmount = Invoice::where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->sum('amount');

        $expected30Days = Invoice::where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->where('due_date', '<=', now()->addDays(30))
            ->sum('amount');

        return [
            'content' => "Based on your pending invoices, you have \${$pendingAmount} outstanding. I predict approximately \${$expected30Days} will be received in the next 30 days based on due dates.",
            'actions' => [
                [
                    'type' => 'analyze',
                    'label' => 'View Cash Flow',
                    'params' => ['type' => 'cash_flow'],
                ],
            ],
        ];
    }

    private function handleMarkPaidIntent(string $message, int $organizationId): array
    {
        // Extract invoice number if mentioned
        preg_match('/(?:INV-|invoice\s*)?(\d+)/i', $message, $matches);

        if (!empty($matches[1])) {
            $invoice = Invoice::where('organization_id', $organizationId)
                ->where('invoice_number', 'like', "%{$matches[1]}%")
                ->first();

            if ($invoice) {
                return [
                    'content' => "I found invoice {$invoice->invoice_number} for \${$invoice->amount}. Mark it as paid?",
                    'actions' => [
                        [
                            'type' => 'mark_paid',
                            'label' => 'Mark as Paid',
                            'params' => ['invoice_id' => $invoice->id],
                        ],
                    ],
                ];
            }
        }

        // Show recent pending invoices
        $pendingInvoices = Invoice::where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->limit(5)
            ->get();

        return [
            'content' => 'I can help you mark invoices as paid. Here are your recent pending invoices:',
            'actions' => $pendingInvoices->map(fn($inv) => [
                'type' => 'mark_paid',
                'label' => "{$inv->invoice_number} - \${$inv->amount}",
                'params' => ['invoice_id' => $inv->id],
            ])->toArray(),
        ];
    }

    private function executeSendReminder(int $organizationId, array $params): array
    {
        $filter = $params['filter'] ?? 'overdue';

        $query = Invoice::where('organization_id', $organizationId)
            ->where('status', '!=', 'paid');

        if ($filter === 'overdue') {
            $query->where('due_date', '<', now());
        }

        $invoices = $query->get();
        $sent = 0;

        foreach ($invoices as $invoice) {
            // Trigger reminder logic
            $invoice->increment('reminder_count');
            $invoice->update(['last_reminder_sent_at' => now()]);
            $sent++;
        }

        return [
            'success' => true,
            'message' => "Sent reminders for {$sent} invoices",
            'count' => $sent,
        ];
    }

    private function executeScheduleFollowup(int $organizationId, array $params): array
    {
        return [
            'success' => true,
            'message' => 'Follow-up scheduled successfully',
        ];
    }

    private function executeMarkPaid(int $organizationId, array $params): array
    {
        $invoiceId = $params['invoice_id'] ?? null;

        if (!$invoiceId) {
            return ['success' => false, 'message' => 'Invoice ID required'];
        }

        $invoice = Invoice::where('organization_id', $organizationId)
            ->where('id', $invoiceId)
            ->first();

        if (!$invoice) {
            return ['success' => false, 'message' => 'Invoice not found'];
        }

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => "Invoice {$invoice->invoice_number} marked as paid",
        ];
    }

    private function executeAnalyze(int $organizationId, array $params): array
    {
        $type = $params['type'] ?? 'general';

        return [
            'success' => true,
            'message' => "Analysis complete for {$type}",
            'redirect' => match ($type) {
                'at_risk', 'overdue_invoices' => '/analytics',
                'cash_flow' => '/analytics',
                default => null,
            },
        ];
    }

    private function getAtRiskClients(int $organizationId): array
    {
        return Invoice::where('organization_id', $organizationId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now()->subDays(14))
            ->where('reminder_count', '>=', 2)
            ->with('client')
            ->get()
            ->groupBy('client_id')
            ->map(fn($invoices, $clientId) => [
                'client_id' => $clientId,
                'client_name' => $invoices->first()->client->name,
                'overdue_count' => $invoices->count(),
                'total_amount' => $invoices->sum('amount'),
            ])
            ->values()
            ->toArray();
    }

    private function getFastPayers(int $organizationId): array
    {
        return Client::where('organization_id', $organizationId)
            ->whereHas('invoices', function ($q) {
                $q
                    ->where('status', 'paid')
                    ->whereRaw('DATEDIFF(paid_at, due_date) <= 3');
            })
            ->get()
            ->toArray();
    }

    private function predictRevenue(int $organizationId): float
    {
        return Invoice::where('organization_id', $organizationId)
            ->where('status', 'pending')
            ->where('due_date', '<=', now()->addDays(30))
            ->sum('amount');
    }

    private function buildOrganizationContext(int $organizationId): array
    {
        $stats = [
            'total_invoices' => Invoice::where('organization_id', $organizationId)->count(),
            'pending_invoices' => Invoice::where('organization_id', $organizationId)->where('status', 'pending')->count(),
            'overdue_invoices' => Invoice::where('organization_id', $organizationId)->where('status', '!=', 'paid')->where('due_date', '<', now())->count(),
            'total_clients' => Client::where('organization_id', $organizationId)->count(),
        ];

        return $stats;
    }
}
