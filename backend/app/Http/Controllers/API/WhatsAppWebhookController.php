<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Reminder;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsappService
    ) {}

    public function verify(Request $request): JsonResponse
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');
        $verifyToken = config('services.whatsapp.webhook_verify_token');

        if ($mode === 'subscribe' && $token === $verifyToken) {
            return response($challenge, 200);
        }

        return response()->json(['error' => 'Forbidden'], 403);
    }

    public function handle(Request $request): JsonResponse
    {
        $data = $request->all();

        Log::info('WhatsApp webhook received', $data);

        $message = $this->whatsappService->processWebhook($data);

        if ($message) {
            $this->processResponse($message);
        }

        return response()->json(['status' => 'received']);
    }

    private function processResponse(array $message): void
    {
        $client = Client::where('whatsapp_number', $message['from'])->first();

        if (!$client) {
            return;
        }

        $latestReminder = Reminder::whereHas('invoice', function ($q) use ($client) {
            $q->where('client_id', $client->id);
        })
        ->where('status', 'sent')
        ->whereNull('response_received')
        ->latest()
        ->first();

        if ($latestReminder) {
            $latestReminder->recordResponse($message['content']);

            $lowerContent = strtolower($message['content']);

            if (str_contains($lowerContent, 'paid') || str_contains($lowerContent, 'payment sent')) {
                $latestReminder->invoice->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
            }
        }
    }
}
