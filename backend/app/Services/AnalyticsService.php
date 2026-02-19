<?php

namespace App\Services;

use App\Models\AnalyticsCache;
use App\Models\Invoice;
use App\Models\Organization;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class AnalyticsService
{
    private ?string $openAiKey;

    public function __construct()
    {
        $this->openAiKey = config('services.openai.api_key');
    }

    /**
     * Get revenue forecast for the next 3 months
     */
    public function getRevenueForecast(int $organizationId): array
    {
        // Check cache first
        $cached = $this->getCached($organizationId, 'revenue_forecast');
        if ($cached) {
            return $cached;
        }

        $organization = Organization::find($organizationId);
        $invoices = $organization->invoices()
            ->where('created_at', '>=', now()->subMonths(6))
            ->get();

        // Historical data analysis
        $monthlyRevenue = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $revenue = $invoices
                ->filter(fn($inv) => $inv->paid_at && $inv->paid_at->format('Y-m') === $month->format('Y-m'))
                ->sum('amount');
            $monthlyRevenue[$month->format('M Y')] = $revenue;
        }

        // Simple trend calculation (can be enhanced with ML)
        $trend = $this->calculateTrend($monthlyRevenue);
        
        $forecast = [];
        for ($i = 1; $i <= 3; $i++) {
            $month = now()->addMonths($i);
            $forecast[$month->format('M Y')] = round($trend * $i, 2);
        }

        $result = [
            'historical' => $monthlyRevenue,
            'forecast' => $forecast,
            'trend_percentage' => $this->calculateTrendPercentage($monthlyRevenue),
            'confidence' => $this->calculateConfidence($invoices->count()),
        ];

        $this->cacheResult($organizationId, 'revenue_forecast', $result);

        return $result;
    }

    /**
     * Get at-risk invoices prediction
     */
    public function getAtRiskInvoices(int $organizationId): array
    {
        $cached = $this->getCached($organizationId, 'at_risk');
        if ($cached) {
            return $cached;
        }

        $organization = Organization::find($organizationId);
        $invoices = $organization->invoices()
            ->where('status', '!=', 'paid')
            ->with('client')
            ->get();

        $atRisk = [];
        foreach ($invoices as $invoice) {
            $riskScore = $this->calculateRiskScore($invoice);
            
            if ($riskScore > 60) {
                $atRisk[] = [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'client_name' => $invoice->client->name,
                    'amount' => $invoice->amount,
                    'due_date' => $invoice->due_date->format('Y-m-d'),
                    'days_overdue' => $invoice->isOverdue() ? $invoice->daysOverdue() : 0,
                    'risk_score' => $riskScore,
                    'risk_level' => $this->getRiskLevel($riskScore),
                    'reasons' => $this->getRiskReasons($invoice),
                ];
            }
        }

        // Sort by risk score
        usort($atRisk, fn($a, $b) => $b['risk_score'] <=> $a['risk_score']);

        $result = [
            'count' => count($atRisk),
            'total_amount_at_risk' => array_sum(array_column($atRisk, 'amount')),
            'invoices' => array_slice($atRisk, 0, 10), // Top 10
        ];

        $this->cacheResult($organizationId, 'at_risk', $result);

        return $result;
    }

    /**
     * Get client payment behavior analysis
     */
    public function getPaymentBehavior(int $organizationId): array
    {
        $cached = $this->getCached($organizationId, 'payment_behavior');
        if ($cached) {
            return $cached;
        }

        $organization = Organization::find($organizationId);
        $clients = $organization->clients()
            ->with(['invoices' => fn($q) => $q->where('status', 'paid')])
            ->get();

        $behavior = [];
        foreach ($clients as $client) {
            $paidInvoices = $client->invoices;
            
            if ($paidInvoices->isEmpty()) {
                continue;
            }

            $avgPaymentDays = $paidInvoices->avg(function ($inv) {
                if (!$inv->paid_at) return 0;
                return $inv->due_date->diffInDays($inv->paid_at);
            });

            $behavior[] = [
                'client_id' => $client->id,
                'client_name' => $client->name,
                'total_invoices' => $paidInvoices->count(),
                'avg_payment_days' => round($avgPaymentDays, 1),
                'payment_category' => $this->categorizePaymentSpeed($avgPaymentDays),
                'total_paid' => $paidInvoices->sum('amount'),
            ];
        }

        // Sort by payment speed (fastest first)
        usort($behavior, fn($a, $b) => $a['avg_payment_days'] <=> $b['avg_payment_days']);

        $result = [
            'clients' => $behavior,
            'summary' => [
                'fast_payers' => count(array_filter($behavior, fn($b) => $b['payment_category'] === 'fast')),
                'average_payers' => count(array_filter($behavior, fn($b) => $b['payment_category'] === 'average')),
                'slow_payers' => count(array_filter($behavior, fn($b) => $b['payment_category'] === 'slow')),
            ],
        ];

        $this->cacheResult($organizationId, 'payment_behavior', $result);

        return $result;
    }

    /**
     * Get cash flow projection
     */
    public function getCashFlowProjection(int $organizationId): array
    {
        $organization = Organization::find($organizationId);
        
        $upcomingInvoices = $organization->invoices()
            ->where('status', 'pending')
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(30))
            ->orderBy('due_date')
            ->get();

        $dailyFlow = [];
        for ($i = 0; $i <= 30; $i++) {
            $date = now()->addDays($i);
            $amount = $upcomingInvoices
                ->filter(fn($inv) => $inv->due_date->format('Y-m-d') === $date->format('Y-m-d'))
                ->sum('amount');
            
            $dailyFlow[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'expected_amount' => $amount,
            ];
        }

        return [
            'daily_projection' => $dailyFlow,
            'total_expected_30d' => $upcomingInvoices->sum('amount'),
            'invoices_count' => $upcomingInvoices->count(),
        ];
    }

    /**
     * Calculate risk score for an invoice (0-100)
     */
    private function calculateRiskScore(Invoice $invoice): int
    {
        $score = 0;
        $client = $invoice->client;

        // Days overdue weight (40%)
        if ($invoice->isOverdue()) {
            $daysOverdue = $invoice->daysOverdue();
            $score += min(40, $daysOverdue * 2);
        }

        // Reminder count weight (20%)
        $score += min(20, $invoice->reminder_count * 4);

        // Historical payment behavior weight (30%)
        $clientPaidInvoices = $client->invoices()->where('status', 'paid')->get();
        if ($clientPaidInvoices->count() > 0) {
            $avgPaymentDays = $clientPaidInvoices->avg(function ($inv) {
                if (!$inv->paid_at) return 0;
                return $inv->due_date->diffInDays($inv->paid_at);
            });
            
            if ($avgPaymentDays > 10) {
                $score += min(30, ($avgPaymentDays - 10) * 2);
            }
        } else {
            // No payment history = higher risk
            $score += 15;
        }

        // Escalation level weight (10%)
        $score += min(10, $invoice->escalation_level * 3);

        return min(100, $score);
    }

    private function getRiskLevel(int $score): string
    {
        return match(true) {
            $score >= 80 => 'critical',
            $score >= 60 => 'high',
            $score >= 40 => 'medium',
            default => 'low',
        };
    }

    private function getRiskReasons(Invoice $invoice): array
    {
        $reasons = [];
        
        if ($invoice->isOverdue()) {
            $reasons[] = 'Invoice is ' . $invoice->daysOverdue() . ' days overdue';
        }
        if ($invoice->reminder_count >= 3) {
            $reasons[] = 'Multiple reminders sent without response';
        }
        
        $client = $invoice->client;
        $paidCount = $client->invoices()->where('status', 'paid')->count();
        if ($paidCount === 0) {
            $reasons[] = 'New client with no payment history';
        }

        return $reasons;
    }

    private function categorizePaymentSpeed(float $avgDays): string
    {
        return match(true) {
            $avgDays <= 3 => 'fast',
            $avgDays <= 7 => 'average',
            default => 'slow',
        };
    }

    private function calculateTrend(array $monthlyData): float
    {
        $values = array_values($monthlyData);
        if (count($values) < 2) return 0;

        // Simple linear regression slope
        $n = count($values);
        $sumX = array_sum(array_keys($values));
        $sumY = array_sum($values);
        $sumXY = 0;
        $sumX2 = 0;

        foreach ($values as $x => $y) {
            $sumXY += $x * $y;
            $sumX2 += $x * $x;
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);
        
        return max(0, $values[count($values) - 1] + $slope);
    }

    private function calculateTrendPercentage(array $monthlyData): float
    {
        $values = array_values($monthlyData);
        if (count($values) < 2) return 0;

        $first = $values[0];
        $last = $values[count($values) - 1];

        if ($first == 0) return $last > 0 ? 100 : 0;

        return round((($last - $first) / $first) * 100, 2);
    }

    private function calculateConfidence(int $dataPoints): string
    {
        return match(true) {
            $dataPoints >= 50 => 'high',
            $dataPoints >= 20 => 'medium',
            default => 'low',
        };
    }

    private function getCached(int $organizationId, string $type): ?array
    {
        $cache = AnalyticsCache::where('organization_id', $organizationId)
            ->where('type', $type)
            ->where('expires_at', '>', now())
            ->first();

        return $cache ? $cache->data : null;
    }

    private function cacheResult(int $organizationId, string $type, array $data): void
    {
        AnalyticsCache::updateOrCreate(
            ['organization_id' => $organizationId, 'type' => $type],
            [
                'data' => $data,
                'calculated_at' => now(),
                'expires_at' => now()->addHours(6),
            ]
        );
    }

    /**
     * Clear cached analytics for an organization
     */
    public function clearCache(int $organizationId): void
    {
        AnalyticsCache::where('organization_id', $organizationId)->delete();
    }
}
