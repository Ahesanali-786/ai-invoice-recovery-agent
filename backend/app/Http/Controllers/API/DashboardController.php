<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $recentInvoices = $user->invoices()
            ->with('client')
            ->latest()
            ->take(5)
            ->get();

        $overdueInvoices = $user->invoices()
            ->with('client')
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->orderBy('due_date')
            ->take(5)
            ->get();

        $topClients = $user->clients()
            ->withSum(['invoices as total_revenue' => fn($q) => $q->where('status', 'paid')], 'amount')
            ->withSum(['invoices as outstanding' => fn($q) => $q->where('status', '!=', 'paid')], 'amount')
            ->orderByDesc('total_revenue')
            ->take(5)
            ->get();

        $monthlyStats = $user->invoices()
            ->selectRaw('
                DATE_FORMAT(due_date, "%Y-%m") as month,
                COUNT(*) as total_invoices,
                SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END) as collected,
                SUM(CASE WHEN status != "paid" THEN amount ELSE 0 END) as outstanding
            ')
            ->where('due_date', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'stats' => [
                'total_revenue' => $user->getTotalRevenue(),
                'outstanding_amount' => $user->getOutstandingAmount(),
                'overdue_amount' => $user->getOverdueAmount(),
                'total_clients' => $user->clients()->count(),
                'total_invoices' => $user->invoices()->count(),
                'paid_invoices' => $user->invoices()->where('status', 'paid')->count(),
                'overdue_count' => $user->invoices()->where('status', '!=', 'paid')->where('due_date', '<', now())->count(),
            ],
            'recent_invoices' => $recentInvoices,
            'overdue_invoices' => $overdueInvoices,
            'top_clients' => $topClients,
            'monthly_stats' => $monthlyStats,
        ]);
    }
}
