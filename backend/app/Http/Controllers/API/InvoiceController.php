<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoiceParserService;
use App\Services\InvoicePdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceParserService $invoiceParser
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->invoices()->with('client');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('overdue')) {
            $query
                ->where('due_date', '<', now())
                ->where('status', '!=', 'paid');
        }

        $invoices = $query->orderBy('due_date', 'desc')->paginate(20);

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'description' => 'nullable|string',
            'invoice_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $request->user()->id;

        if ($request->hasFile('invoice_file')) {
            $path = $request->file('invoice_file')->store('invoices', 'private');
            $data['file_path'] = $path;

            $aiData = $this->invoiceParser->parseInvoice($request->file('invoice_file'));
            $data['ai_extracted_data'] = $aiData;
        }

        $invoice = Invoice::create($data);
        $invoice->load('client');

        return response()->json($invoice, 201);
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        $invoice->load(['client', 'reminders']);

        return response()->json($invoice);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('update', $invoice);

        $validator = Validator::make($request->all(), [
            'amount' => 'sometimes|numeric|min:0',
            'currency' => 'nullable|string|size:3',
            'due_date' => 'sometimes|date',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:pending,paid,cancelled,disputed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['status']) && $data['status'] === 'paid') {
            $data['paid_at'] = now();
        }

        $invoice->update($data);
        $invoice->load('client');

        return response()->json($invoice);
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('delete', $invoice);

        if ($invoice->file_path) {
            Storage::disk('private')->delete($invoice->file_path);
        }

        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    public function markAsPaid(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('update', $invoice);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $request->input('payment_method'),
        ]);

        // Clear analytics cache for this organization
        $organizationId = $invoice->organization_id;
        \App\Models\AnalyticsCache::where('organization_id', $organizationId)->delete();

        return response()->json($invoice);
    }

    public function dashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();

        $stats = [
            'total_invoices' => $user->invoices()->count(),
            'total_revenue' => $user->invoices()->where('status', 'paid')->sum('amount'),
            'outstanding_amount' => $user->invoices()->where('status', '!=', 'paid')->sum('amount'),
            'overdue_amount' => $user
                ->invoices()
                ->where('status', '!=', 'paid')
                ->where('due_date', '<', now())
                ->sum('amount'),
            'overdue_count' => $user
                ->invoices()
                ->where('status', '!=', 'paid')
                ->where('due_date', '<', now())
                ->count(),
            'pending_reminders' => $user
                ->invoices()
                ->where('status', '!=', 'paid')
                ->where('reminder_count', '>', 0)
                ->count(),
        ];

        return response()->json($stats);
    }

    public function downloadPdf(Request $request, Invoice $invoice, InvoicePdfService $pdfService)
    {
        $this->authorize('view', $invoice);

        return $pdfService->download($invoice);
    }

    public function streamPdf(Request $request, Invoice $invoice, InvoicePdfService $pdfService)
    {
        $this->authorize('view', $invoice);

        return $pdfService->stream($invoice);
    }

    /**
     * Generate the next invoice number for the authenticated user.
     * Format: INV-001, INV-002, etc.
     */
    private function generateNextInvoiceNumber($userId): string
    {
        $lastInvoice = Invoice::where('user_id', $userId)
            ->orderBy('id', 'desc')
            ->first();

        if (!$lastInvoice) {
            return 'INV-001';
        }

        // Extract number from last invoice number (e.g., INV-001 -> 1)
        $lastNumber = 0;
        if (preg_match('/INV-(\d+)/', $lastInvoice->invoice_number, $matches)) {
            $lastNumber = intval($matches[1]);
        }

        $nextNumber = $lastNumber + 1;
        return 'INV-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Get the next available invoice number for the authenticated user.
     */
    public function getNextInvoiceNumber(Request $request): JsonResponse
    {
        $invoiceNumber = $this->generateNextInvoiceNumber($request->user()->id);

        return response()->json([
            'invoice_number' => $invoiceNumber
        ]);
    }
}
