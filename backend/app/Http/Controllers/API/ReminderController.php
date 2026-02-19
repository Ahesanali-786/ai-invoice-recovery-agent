<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Jobs\SendPaymentReminder;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        $reminders = $invoice->reminders()->orderBy('created_at', 'desc')->get();

        return response()->json($reminders);
    }

    public function sendReminder(Request $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'type' => 'required|in:gentle,standard,urgent,final',
        ]);

        if ($invoice->status === 'paid') {
            return response()->json(['error' => 'Invoice is already paid'], 422);
        }

        SendPaymentReminder::dispatch($invoice, $validated['type']);

        return response()->json(['message' => 'Reminder queued successfully']);
    }
}
