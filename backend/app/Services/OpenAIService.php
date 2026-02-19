<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    private string $apiKey;
    private string $baseUrl = 'https://api.openai.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key', env('OPENAI_API_KEY'));
    }

    /**
     * General chat completion with OpenAI
     */
    public function chat(string $message, array $context = []): array
    {
        try {
            $systemPrompt = $this->buildSystemPrompt($context);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $content = $data['choices'][0]['message']['content'] ?? 'I apologize, but I could not process your request.';

                return [
                    'content' => $content,
                    'actions' => $this->extractActions($content),
                ];
            }

            Log::error('OpenAI API error', ['response' => $response->json()]);
            return [
                'content' => 'I apologize, but I am having trouble connecting to my knowledge base. Please try again later.',
                'actions' => [],
            ];
        } catch (\Exception $e) {
            Log::error('OpenAI Service error', ['error' => $e->getMessage()]);
            return [
                'content' => 'I apologize, but something went wrong. Please try again.',
                'actions' => [],
            ];
        }
    }

    /**
     * Parse natural language search query
     */
    public function parseSearchQuery(string $query): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a query parser for an invoice management system. Extract filters from the user query and return ONLY a JSON object with these fields: client (string or null), status (pending/paid/overdue/null), min_amount (number or null), max_amount (number or null), overdue (boolean), date_from (YYYY-MM-DD or null), date_to (YYYY-MM-DD or null). Return valid JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Parse this query: {$query}"
                    ],
                ],
                'temperature' => 0.3,
                'max_tokens' => 200,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '{}';
                $parsed = json_decode($content, true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    return [
                        'client' => $parsed['client'] ?? null,
                        'status' => $parsed['status'] ?? null,
                        'min_amount' => $parsed['min_amount'] ?? null,
                        'max_amount' => $parsed['max_amount'] ?? null,
                        'overdue' => $parsed['overdue'] ?? false,
                        'date_from' => $parsed['date_from'] ?? null,
                        'date_to' => $parsed['date_to'] ?? null,
                    ];
                }
            }

            return $this->fallbackParseQuery($query);
        } catch (\Exception $e) {
            return $this->fallbackParseQuery($query);
        }
    }

    /**
     * Generate AI insights from invoice data
     */
    public function generateInsights(array $invoiceData): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an AI assistant for invoice recovery. Analyze the provided invoice data and generate 3-5 actionable insights. Return as JSON array with objects containing: type (warning/success/info/action), title (string), description (string).'
                    ],
                    [
                        'role' => 'user',
                        'content' => "Analyze this data: " . json_encode($invoiceData)
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 800,
            ]);

            if ($response->successful()) {
                $content = $response->json()['choices'][0]['message']['content'] ?? '[]';
                $insights = json_decode($content, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($insights)) {
                    return $insights;
                }
            }

            return [];
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Build system prompt with context
     */
    private function buildSystemPrompt(array $context): string
    {
        $prompt = "You are an AI Invoice Recovery Assistant. Your role is to help users manage their invoices and recover payments efficiently.\n\n";
        $prompt .= "You can help with:\n";
        $prompt .= "- Sending payment reminders\n";
        $prompt .= "- Analyzing at-risk invoices\n";
        $prompt .= "- Providing revenue forecasts\n";
        $prompt .= "- Marking invoices as paid\n";
        $prompt .= "- Answering questions about invoice data\n\n";

        if (!empty($context)) {
            $prompt .= "Current organization context:\n";
            foreach ($context as $key => $value) {
                $prompt .= "- {$key}: {$value}\n";
            }
        }

        $prompt .= "\nRespond in a helpful, professional tone. Keep responses concise and actionable.";

        return $prompt;
    }

    /**
     * Extract suggested actions from AI response
     */
    private function extractActions(string $content): array
    {
        $actions = [];

        // Pattern matching for common intents
        if (stripos($content, 'reminder') !== false || stripos($content, 'send') !== false) {
            $actions[] = [
                'type' => 'send_reminder',
                'label' => 'Send Reminders',
                'params' => [],
            ];
        }

        if (stripos($content, 'mark as paid') !== false || stripos($content, 'payment received') !== false) {
            $actions[] = [
                'type' => 'mark_paid',
                'label' => 'Mark as Paid',
                'params' => [],
            ];
        }

        if (stripos($content, 'analyze') !== false || stripos($content, 'risk') !== false) {
            $actions[] = [
                'type' => 'analyze',
                'label' => 'View Analysis',
                'params' => [],
            ];
        }

        return $actions;
    }

    /**
     * Fallback query parser when AI fails
     */
    private function fallbackParseQuery(string $query): array
    {
        $result = [
            'client' => null,
            'status' => null,
            'min_amount' => null,
            'max_amount' => null,
            'overdue' => false,
            'date_from' => null,
            'date_to' => null,
        ];

        $lowerQuery = strtolower($query);

        // Check for status keywords
        if (str_contains($lowerQuery, 'overdue')) {
            $result['overdue'] = true;
            $result['status'] = 'pending';
        } elseif (str_contains($lowerQuery, 'paid')) {
            $result['status'] = 'paid';
        } elseif (str_contains($lowerQuery, 'pending')) {
            $result['status'] = 'pending';
        }

        // Check for amount ranges
        if (preg_match('/over\s*\$?(\d+)/i', $query, $matches)) {
            $result['min_amount'] = (float) $matches[1];
        }
        if (preg_match('/under\s*\$?(\d+)/i', $query, $matches)) {
            $result['max_amount'] = (float) $matches[1];
        }
        if (preg_match('/between\s*\$?(\d+)\s+and\s*\$?(\d+)/i', $query, $matches)) {
            $result['min_amount'] = (float) $matches[1];
            $result['max_amount'] = (float) $matches[2];
        }

        return $result;
    }
}
