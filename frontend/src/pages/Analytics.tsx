import { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth'
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import toast from 'react-hot-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface AtRiskInvoice {
  invoice_id: number
  invoice_number: string
  client_name: string
  amount: number
  due_date: string
  days_overdue: number
  risk_score: number
  risk_level: string
  reasons: string[]
}

interface PaymentBehavior {
  client_id: number
  client_name: string
  total_invoices: number
  avg_payment_days: number
  payment_category: string
  total_paid: number
}

interface AnalyticsData {
  revenue_forecast: {
    historical: Record<string, number>
    forecast: Record<string, number>
    trend_percentage: number
    confidence: string
  }
  at_risk: {
    count: number
    total_amount_at_risk: number
    invoices: AtRiskInvoice[]
  }
  payment_behavior: {
    clients: PaymentBehavior[]
    summary: {
      fast_payers: number
      average_payers: number
      slow_payers: number
    }
  }
  cash_flow: {
    daily_projection: Array<{
      date: string
      day: string
      expected_amount: number
    }>
    total_expected_30d: number
    invoices_count: number
  }
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'risk' | 'clients'>('overview')
  const { currentOrgId } = useAuth()

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>(
    ['analytics', currentOrgId],
    () => axios.get('/api/analytics/dashboard').then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!currentOrgId, // Only fetch when org is selected
    }
  )

  const handleRefresh = async () => {
    try {
      await axios.post('/api/analytics/refresh')
      await refetch()
      toast.success('Analytics refreshed')
    } catch {
      toast.error('Failed to refresh analytics')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const { revenue_forecast, at_risk, payment_behavior, cash_flow } = analytics

  // Chart data preparation
  const revenueChartData = {
    labels: [...Object.keys(revenue_forecast.historical), ...Object.keys(revenue_forecast.forecast)],
    datasets: [
      {
        label: 'Historical Revenue',
        data: Object.values(revenue_forecast.historical),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Forecast',
        data: [...Array(Object.keys(revenue_forecast.historical).length).fill(null), ...Object.values(revenue_forecast.forecast)],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const cashFlowChartData = {
    labels: cash_flow.daily_projection.map(d => d.day),
    datasets: [
      {
        label: 'Expected Payments',
        data: cash_flow.daily_projection.map(d => d.expected_amount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
    ],
  }

  const paymentBehaviorChartData = {
    labels: ['Fast Payers', 'Average Payers', 'Slow Payers'],
    datasets: [
      {
        data: [
          payment_behavior.summary.fast_payers,
          payment_behavior.summary.average_payers,
          payment_behavior.summary.slow_payers,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & AI Insights</h1>
          <p className="text-gray-600">Data-driven insights for better decision making</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue Trend</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-2xl font-bold ${revenue_forecast.trend_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenue_forecast.trend_percentage >= 0 ? '+' : ''}{revenue_forecast.trend_percentage}%
                </span>
                {revenue_forecast.trend_percentage >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Based on last 6 months</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">At Risk Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ${at_risk.total_amount_at_risk.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{at_risk.count} invoices at risk</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expected (30d)</p>
              <p className="text-2xl font-bold text-green-600">
                ${cash_flow.total_expected_30d.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{cash_flow.invoices_count} pending invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Fast Payers</p>
              <p className="text-2xl font-bold text-blue-600">
                {payment_behavior.summary.fast_payers}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Pay within 3 days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h3>
          <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Historical
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Forecast ({revenue_forecast.confidence} confidence)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Projection (30 Days)</h3>
          <Bar data={cashFlowChartData} options={{ responsive: true, maintainAspectRatio: true }} />
        </div>
      </div>

      {/* At Risk Invoices */}
      {at_risk.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              AI Risk Assessment - At Risk Invoices
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Based on payment history, overdue days, and reminder responses
            </p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {at_risk.invoices.map((invoice) => (
                <tr key={invoice.invoice_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${invoice.risk_score >= 80 ? 'bg-red-600' :
                            invoice.risk_score >= 60 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                          style={{ width: `${invoice.risk_score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{invoice.risk_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${invoice.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                      invoice.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {invoice.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {invoice.reasons.map((reason, idx) => (
                        <li key={idx} className="text-xs">{reason}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Behavior Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Payment Behavior</h3>
          <div className="h-64">
            <Doughnut data={paymentBehaviorChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{payment_behavior.summary.fast_payers}</p>
              <p className="text-xs text-gray-600">Fast (&lt;3 days)</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{payment_behavior.summary.average_payers}</p>
              <p className="text-xs text-gray-600">Average (3-7 days)</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{payment_behavior.summary.slow_payers}</p>
              <p className="text-xs text-gray-600">Slow (&gt;7 days)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Payment Speed</h3>
          <div className="space-y-3">
            {payment_behavior.clients.slice(0, 5).map((client) => (
              <div key={client.client_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{client.client_name}</p>
                  <p className="text-xs text-gray-500">{client.total_invoices} invoices paid</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${client.payment_category === 'fast' ? 'text-green-600' :
                    client.payment_category === 'average' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                    {client.avg_payment_days} days
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${client.payment_category === 'fast' ? 'bg-green-100 text-green-800' :
                    client.payment_category === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {client.payment_category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
