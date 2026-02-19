<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        try {
            $revenueForecast = $this->analyticsService->getRevenueForecast($organizationId);
            $atRisk = $this->analyticsService->getAtRiskInvoices($organizationId);
            $paymentBehavior = $this->analyticsService->getPaymentBehavior($organizationId);
            $cashFlow = $this->analyticsService->getCashFlowProjection($organizationId);

            return response()->json([
                'revenue_forecast' => $revenueForecast,
                'at_risk' => $atRisk,
                'payment_behavior' => $paymentBehavior,
                'cash_flow' => $cashFlow,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load analytics',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function revenueForecast(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        try {
            $forecast = $this->analyticsService->getRevenueForecast($organizationId);
            return response()->json($forecast);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to calculate forecast'], 500);
        }
    }

    public function atRiskInvoices(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        try {
            $atRisk = $this->analyticsService->getAtRiskInvoices($organizationId);
            return response()->json($atRisk);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to analyze at-risk invoices'], 500);
        }
    }

    public function paymentBehavior(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        try {
            $behavior = $this->analyticsService->getPaymentBehavior($organizationId);
            return response()->json($behavior);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to analyze payment behavior'], 500);
        }
    }

    public function cashFlow(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        try {
            $projection = $this->analyticsService->getCashFlowProjection($organizationId);
            return response()->json($projection);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to calculate cash flow'], 500);
        }
    }

    public function refresh(Request $request): JsonResponse
    {
        $organizationId = $request->attributes->get('organization_id');

        if (!$organizationId) {
            return response()->json(['error' => 'No organization context'], 400);
        }

        $this->analyticsService->clearCache($organizationId);

        return response()->json([
            'message' => 'Analytics cache cleared successfully',
        ]);
    }
}
