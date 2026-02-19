<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private string $apiVersion;
    private ?string $phoneNumberId;
    private ?string $accessToken;

    public function __construct()
    {
        $this->apiVersion = config('services.whatsapp.api_version', 'v18.0');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
        $this->accessToken = config('services.whatsapp.access_token');
    }

    public function sendMessage(string $to, string $message): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

        try {
            $response = Http::withToken($this->accessToken)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $this->formatPhoneNumber($to),
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $message,
                    ],
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->json('messages.0.id'),
                    'response' => $response->json(),
                ];
            }

            Log::error('WhatsApp API error', [
                'response' => $response->json(),
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Unknown error'),
            ];
        } catch (\Exception $e) {
            Log::error('WhatsApp send failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function sendTemplate(string $to, string $templateName, array $parameters = []): array
    {
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages";

        $components = [];
        if (!empty($parameters)) {
            $components[] = [
                'type' => 'body',
                'parameters' => array_map(fn($param) => [
                    'type' => 'text',
                    'text' => $param,
                ], $parameters),
            ];
        }

        try {
            $response = Http::withToken($this->accessToken)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $this->formatPhoneNumber($to),
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => ['code' => 'en_US'],
                        'components' => $components,
                    ],
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->json('messages.0.id'),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Unknown error'),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function verifyWebhook(string $token, string $challenge, string $verifyToken): ?string
    {
        if ($token === $verifyToken) {
            return $challenge;
        }
        return null;
    }

    public function processWebhook(array $data): ?array
    {
        try {
            $entry = $data['entry'][0] ?? null;
            $change = $entry['changes'][0] ?? null;
            $value = $change['value'] ?? null;
            $message = $value['messages'][0] ?? null;

            if (!$message) {
                return null;
            }

            return [
                'message_id' => $message['id'],
                'from' => $message['from'],
                'timestamp' => $message['timestamp'],
                'type' => $message['type'],
                'content' => $message['text']['body'] ?? null,
                'profile_name' => $value['contacts'][0]['profile']['name'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function formatPhoneNumber(string $number): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $number);
        if (!str_starts_with($cleaned, '91') && strlen($cleaned) === 10) {
            $cleaned = '91' . $cleaned;
        }
        return $cleaned;
    }
}
