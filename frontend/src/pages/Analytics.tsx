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
  ArrowPathIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  XMarkIcon,
  InformationCircleIcon,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No Analytics Data</h3>
        <p className="text-sm text-slate-500 mt-1">Analytics data will appear once you have invoices</p>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, label, value, subtext, color, trend }: { icon: any, label: string, value: string | number, subtext: string, color: string, trend?: { positive: boolean, value: string } }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.positive ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
              <span className="font-medium">{trend.value}</span>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )

  const ChartCard = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-slate-50 rounded-lg">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <PresentationChartLineIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Analytics & AI Insights</h1>
            <p className="text-sm text-slate-500">Data-driven insights for better decision making</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ChartBarIcon}
          label="Revenue Trend"
          value={`${revenue_forecast.trend_percentage >= 0 ? '+' : ''}${revenue_forecast.trend_percentage}%`}
          subtext="Based on last 6 months"
          color="bg-blue-50 text-blue-600"
          trend={{ positive: revenue_forecast.trend_percentage >= 0, value: `${revenue_forecast.confidence} confidence` }}
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          label="At Risk Amount"
          value={`$${at_risk.total_amount_at_risk.toLocaleString()}`}
          subtext={`${at_risk.count} invoices at risk`}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={BanknotesIcon}
          label="Expected (30d)"
          value={`$${cash_flow.total_expected_30d.toLocaleString()}`}
          subtext={`${cash_flow.invoices_count} pending invoices`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={UsersIcon}
          label="Fast Payers"
          value={payment_behavior.summary.fast_payers}
          subtext="Pay within 3 days"
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue Forecast" icon={DocumentChartBarIcon}>
          <Line
            data={revenueChartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { usePointStyle: true, padding: 15 }
                }
              },
              scales: {
                y: {
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                  ticks: { color: '#64748b' }
                },
                x: {
                  grid: { display: false },
                  ticks: { color: '#64748b' }
                }
              }
            }}
          />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Historical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Forecast
            </span>
          </div>
        </ChartCard>

        <ChartCard title="Cash Flow Projection (30 Days)" icon={BanknotesIcon}>
          <Bar
            data={cashFlowChartData}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                  ticks: { color: '#64748b' }
                },
                x: {
                  grid: { display: false },
                  ticks: { color: '#64748b' }
                }
              }
            }}
          />
        </ChartCard>
      </div>

      {/* At Risk Invoices */}
      {at_risk.invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 rounded-lg">
                <ExclamationTriangleIcon className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI Risk Assessment</h3>
                <p className="text-xs text-slate-500">Based on payment history, overdue days, and reminder responses</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reasons</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {at_risk.invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{invoice.invoice_number}</p>
                      <p className="text-xs text-slate-500">{invoice.days_overdue} days overdue</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{invoice.client_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">${invoice.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${invoice.risk_score >= 80 ? 'bg-rose-500' : invoice.risk_score >= 60 ? 'bg-orange-500' : 'bg-amber-500'}`}
                            style={{ width: `${invoice.risk_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{invoice.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${invoice.risk_level === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          invoice.risk_level === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {invoice.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-0.5">
                        {invoice.reasons.slice(0, 2).map((reason, idx) => (
                          <li key={idx} className="text-xs text-slate-500">• {reason}</li>
                        ))}
                        {invoice.reasons.length > 2 && (
                          <li className="text-xs text-slate-400">+{invoice.reasons.length - 2} more</li>
                        )}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Behavior & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Client Payment Behavior" icon={UsersIcon}>
          <div className="h-56">
            <Doughnut
              data={paymentBehaviorChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15 }
                  }
                },
                cutout: '65%'
              }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-600">{payment_behavior.summary.fast_payers}</p>
              <p className="text-xs text-slate-600 mt-0.5">Fast (&lt;3d)</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-2xl font-bold text-amber-600">{payment_behavior.summary.average_payers}</p>
              <p className="text-xs text-slate-600 mt-0.5">Average (3-7d)</p>
            </div>
            <div className="text-center p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-2xl font-bold text-rose-600">{payment_behavior.summary.slow_payers}</p>
              <p className="text-xs text-slate-600 mt-0.5">Slow (&gt;7d)</p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Top Clients by Payment Speed" icon={CurrencyDollarIcon}>
          <div className="space-y-3">
            {payment_behavior.clients.slice(0, 5).map((client) => (
              <div key={client.client_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold ${client.payment_category === 'fast' ? 'bg-emerald-500' :
                      client.payment_category === 'average' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}>
                    {client.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{client.client_name}</p>
                    <p className="text-xs text-slate-500">{client.total_invoices} invoices paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${client.payment_category === 'fast' ? 'text-emerald-600' :
                      client.payment_category === 'average' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                    {client.avg_payment_days} days
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${client.payment_category === 'fast' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      client.payment_category === 'average' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                    {client.payment_category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
