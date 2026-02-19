<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientBehaviorAnalysis;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SmartReminderService
{
    /**
     * Analyze client behavior and update analysis record
     */
    public function analyzeClient(int $clientId, int $organizationId): ClientBehaviorAnalysis
    {
        $analysis = ClientBehaviorAnalysis::firstOrNew([
            'client_id' => $clientId,
            'organization_id' => $organizationId,
        ]);

        // Get all paid invoices for this client
        $paidInvoices = Invoice::where('client_id', $clientId)
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->whereNotNull('due_date')
            ->get();

        $totalInvoices = Invoice::where('client_id', $clientId)->count();

        if ($paidInvoices->count() > 0) {
            // Calculate average payment days
            $avgPaymentDays = $paidInvoices->avg(function ($invoice) {
                return $invoice->paid_at->diffInDays($invoice->due_date);
            });

            // Count on-time vs late payments
            $onTimeCount = $paidInvoices->filter(function ($invoice) {
                return $invoice->paid_at->lte($invoice->due_date);
            })->count();

            $lateCount = $paidInvoices->count() - $onTimeCount;
            $onTimeRate = ($onTimeCount / $paidInvoices->count()) * 100;

            $analysis->avg_payment_days = round(max(0, $avgPaymentDays));
            $analysis->paid_on_time_count = $onTimeCount;
            $analysis->late_payment_count = $lateCount;
            $analysis->on_time_payment_rate = round($onTimeRate, 2);
        }

        $analysis->total_invoices = $totalInvoices;

        // Calculate optimal send time based on historical response data
        $this->calculateOptimalSendTime($analysis, $clientId);

        // Calculate risk score
        $this->calculateRiskScore($analysis, $clientId);

        // Determine if client responds to discounts
        $this->analyzeDiscountResponsiveness($analysis, $clientId);

        $analysis->last_analyzed_at = now();
        $analysis->save();

        Log::info('Client behavior analyzed', [
            'client_id' => $clientId,
            'risk_category' => $analysis->risk_category,
            'optimal_hour' => $analysis->optimal_send_hour,
        ]);

        return $analysis;
    }

    /**
     * Calculate optimal send time based on invoice activity patterns
     */
    private function calculateOptimalSendTime(ClientBehaviorAnalysis $analysis, int $clientId): void
    {
        // Analyze when client typically pays invoices (hour of day)
        $paymentHours = Invoice::where('client_id', $clientId)
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->select(DB::raw('HOUR(paid_at) as hour'), DB::raw('COUNT(*) as count'))
            ->groupBy('hour')
            ->orderByDesc('count')
            ->first();

        if ($paymentHours) {
            // Set optimal time 2-4 hours before they typically pay
            $optimalHour = ($paymentHours->hour - 3 + 24) % 24;
            $analysis->optimal_send_hour = max(9, min(17, $optimalHour));  // Business hours
        } else {
            $analysis->optimal_send_hour = 10;  // Default: 10 AM
        }

        // Day of week analysis
        $paymentDays = Invoice::where('client_id', $clientId)
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->select(DB::raw('DAYOFWEEK(paid_at) as day'), DB::raw('COUNT(*) as count'))
            ->groupBy('day')
            ->orderByDesc('count')
            ->first();

        $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        $analysis->optimal_send_day = $paymentDays ? $days[$paymentDays->day - 1] : 'Tuesday';

        // Channel preference based on whatsapp_enabled
        $client = Client::find($clientId);
        if ($client && $client->whatsapp_enabled) {
            $whatsappResponses = DB::table('whatsapp_messages')
                ->where('client_id', $clientId)
                ->where('direction', 'incoming')
                ->count();

            $analysis->preferred_channel = $whatsappResponses > 5 ? 'whatsapp' : 'email';
        } else {
            $analysis->preferred_channel = 'email';
        }
    }

    /**
     * Calculate churn risk score
     */
    private function calculateRiskScore(ClientBehaviorAnalysis $analysis, int $clientId): void
    {
        $score = 0;
        $factors = 0;

        // Factor 1: On-time payment rate (inverse)
        if ($analysis->total_invoices > 0) {
            $score += (100 - $analysis->on_time_payment_rate) / 100;
            $factors++;
        }

        // Factor 2: Late payment ratio
        $lateRatio = $analysis->total_invoices > 0
            ? $analysis->late_payment_count / $analysis->total_invoices
            : 0;
        $score += min($lateRatio, 1);
        $factors++;

        // Factor 3: Overdue invoices count
        $overdueCount = Invoice::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->count();
        $score += min($overdueCount / 3, 1);  // Max 3 overdue = 100% risk
        $factors++;

        // Factor 4: Days since last payment
        $lastPayment = Invoice::where('client_id', $clientId)
            ->where('status', 'paid')
            ->latest('paid_at')
            ->first();

        if ($lastPayment) {
            $daysSincePayment = $lastPayment->paid_at->diffInDays(now());
            $score += min($daysSincePayment / 90, 1);  // Max 90 days
            $factors++;
        } else {
            $score += 0.5;  // No payment history
            $factors++;
        }

        // Calculate final score
        $finalScore = $factors > 0 ? round($score / $factors, 2) : 0.0;
        $analysis->churn_risk_score = (float) $finalScore;

        // Categorize risk
        if ($finalScore < 0.3) {
            $analysis->risk_category = 'low';
        } elseif ($finalScore < 0.6) {
            $analysis->risk_category = 'medium';
        } else {
            $analysis->risk_category = 'high';
        }
    }

    /**
     * Analyze if client responds to early payment discounts
     */
    private function analyzeDiscountResponsiveness(ClientBehaviorAnalysis $analysis, int $clientId): void
    {
        // Analyze if client pays faster when given discounts
        $invoicesWithDiscount = Invoice::where('client_id', $clientId)
            ->where('status', 'paid')
            ->where('early_payment_discount', '>', 0)
            ->get();

        if ($invoicesWithDiscount->count() >= 2) {
            $avgDaysWithDiscount = $invoicesWithDiscount->avg(function ($invoice) {
                return $invoice->paid_at->diffInDays($invoice->created_at);
            });

            $invoicesWithoutDiscount = Invoice::where('client_id', $clientId)
                ->where('status', 'paid')
                ->where(function ($q) {
                    $q
                        ->where('early_payment_discount', 0)
                        ->orWhereNull('early_payment_discount');
                })
                ->get();

            if ($invoicesWithoutDiscount->count() > 0) {
                $avgDaysWithoutDiscount = $invoicesWithoutDiscount->avg(function ($invoice) {
                    return $invoice->paid_at->diffInDays($invoice->created_at);
                });

                // If pays significantly faster with discount
                if ($avgDaysWithDiscount < $avgDaysWithoutDiscount * 0.7) {
                    $analysis->responds_to_discounts = true;
                    $analysis->effective_discount_rate = $invoicesWithDiscount->avg('early_payment_discount');
                }
            }
        }
    }

    /**
     * Get smart reminder strategy for an invoice
     */
    public function getSmartStrategy(int $invoiceId, int $clientId, int $organizationId): array
    {
        $analysis = ClientBehaviorAnalysis::where('client_id', $clientId)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$analysis) {
            // Create analysis if not exists
            $analysis = $this->analyzeClient($clientId, $organizationId);
        }

        $strategy = [
            'send_hour' => $analysis->optimal_send_hour,
            'send_day' => $analysis->optimal_send_day,
            'channel' => $analysis->preferred_channel,
            'risk_category' => $analysis->risk_category,
            'use_personalized_strategy' => true,
        ];

        // Add discount recommendation for high-risk or discount-responsive clients
        if ($analysis->qualifiesForDiscount()) {
            $strategy['offer_discount'] = true;
            $strategy['discount_rate'] = $analysis->getRecommendedDiscount();
        } else {
            $strategy['offer_discount'] = false;
        }

        // Adjust tone based on risk
        if ($analysis->risk_category === 'high') {
            $strategy['recommended_tone'] = 'urgent';
        } elseif ($analysis->risk_category === 'medium') {
            $strategy['recommended_tone'] = 'standard';
        } else {
            $strategy['recommended_tone'] = 'gentle';
        }

        return $strategy;
    }

    /**
     * Schedule next reminder based on strategy
     */
    public function scheduleNextReminder(array $strategy): ?Carbon
    {
        $now = now();
        $targetHour = $strategy['send_hour'] ?? 10;
        $targetDay = $strategy['send_day'] ?? 'Tuesday';

        // Get next occurrence of target day
        $days = ['Sunday' => 0, 'Monday' => 1, 'Tuesday' => 2, 'Wednesday' => 3, 'Thursday' => 4, 'Friday' => 5, 'Saturday' => 6];
        $targetDayNum = $days[$targetDay] ?? 2;
        $currentDayNum = $now->dayOfWeek;

        $daysUntilTarget = ($targetDayNum - $currentDayNum + 7) % 7;
        if ($daysUntilTarget === 0 && $now->hour >= $targetHour) {
            $daysUntilTarget = 7;  // Next week
        }

        $nextDate = $now->copy()->addDays($daysUntilTarget);
        $nextDate->hour = $targetHour;
        $nextDate->minute = 0;
        $nextDate->second = 0;

        // If scheduled time is within next 4 hours, add buffer
        if ($nextDate->diffInHours($now) < 4) {
            $nextDate->addHours(4);
        }

        return $nextDate;
    }

    /**
     * Batch analyze all clients in an organization
     */
    public function batchAnalyzeOrganization(int $organizationId): array
    {
        $clients = Client::where('organization_id', $organizationId)->get();
        $analyzed = 0;
        $highRisk = 0;

        foreach ($clients as $client) {
            $analysis = $this->analyzeClient($client->id, $organizationId);
            $analyzed++;

            if ($analysis->risk_category === 'high') {
                $highRisk++;
            }
        }

        return [
            'analyzed' => $analyzed,
            'high_risk_count' => $highRisk,
        ];
    }
}
