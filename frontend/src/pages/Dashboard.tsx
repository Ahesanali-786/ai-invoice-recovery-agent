import { useQuery } from 'react-query'
import axios from 'axios'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  SparklesIcon,
  ArrowRightIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import AIInsightsWidget from '../components/AIInsightsWidget'
import { Link } from 'react-router-dom'

interface DashboardStats {
  stats: {
    total_revenue: number
    outstanding_amount: number
    overdue_amount: number
    overdue_count: number
    total_clients: number
    total_invoices: number
    paid_invoices: number
    pending_invoices: number
  }
  recent_invoices: Array<{
    id: number
    invoice_number: string
    amount: number
    currency: string
    status: string
    due_date: string
    client: { name: string; email: string }
  }>
  monthly_stats: Array<{
    month: string
    collected: number
    outstanding: number
    overdue: number
  }>
  recovery_rate: number
}

const COLORS = {
  green: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  indigo: '#6366f1',
  purple: '#8b5cf6',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid':
      return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
    case 'overdue':
      return <XCircleIcon className="h-4 w-4 text-rose-500" />
    default:
      return <PendingIcon className="h-4 w-4 text-amber-500" />
  }
}

function getStatusBadge(status: string) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {getStatusIcon(status)}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function getDaysUntilDue(dueDate: string): string {
  const due = parseISO(dueDate)
  const today = new Date()
  const days = differenceInDays(due, today)

  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  return `${days} days left`
}

function StatCard({
  name,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  trend,
}: {
  name: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo'
  trend?: number
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-600',
      text: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      text: 'text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: 'bg-rose-100 text-rose-600',
      text: 'text-rose-700',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'bg-indigo-100 text-indigo-600',
      text: 'text-indigo-700',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className={`relative overflow-hidden rounded-xl border ${colors.bg} ${colors.border} p-5 hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend >= 0 ? <ArrowUpRightIcon className="h-3 w-3" /> : <ArrowDownRightIcon className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-600">{name}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {change && (
          <p className={`mt-1 text-sm ${changeType === 'negative' ? 'text-rose-600' : changeType === 'positive' ? 'text-emerald-600' : 'text-slate-500'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardStats>('dashboard', () =>
    axios.get('/api/dashboard').then(res => res.data)
  )

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary-600"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-primary-600/20"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500 animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  const stats = data?.stats
  const recentInvoices = data?.recent_invoices || []
  const monthlyStats = data?.monthly_stats || []

  const pieData = [
    { name: 'Paid', value: stats?.paid_invoices || 0, color: COLORS.green },
    { name: 'Pending', value: stats?.pending_invoices || 0, color: COLORS.amber },
    { name: 'Overdue', value: stats?.overdue_count || 0, color: COLORS.rose },
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/invoices/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
          >
            <PlusIcon className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          name="Total Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          change="Lifetime earnings"
          changeType="neutral"
          icon={BanknotesIcon}
          color="emerald"
          trend={12.5}
        />
        <StatCard
          name="Outstanding"
          value={formatCurrency(stats?.outstanding_amount || 0)}
          change={`${stats?.total_invoices || 0} total invoices`}
          changeType="neutral"
          icon={DocumentTextIcon}
          color="amber"
        />
        <StatCard
          name="Overdue Amount"
          value={formatCurrency(stats?.overdue_amount || 0)}
          change={`${stats?.overdue_count || 0} invoices overdue`}
          changeType="negative"
          icon={ExclamationTriangleIcon}
          color="rose"
        />
        <StatCard
          name="Total Clients"
          value={stats?.total_clients || 0}
          change="Active customers"
          changeType="positive"
          icon={UsersIcon}
          color="blue"
          trend={8.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Overview"
            subtitle="Monthly collection vs outstanding"
            action={
              <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="Collected"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    fill="url(#collectedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outstanding"
                    name="Outstanding"
                    stroke={COLORS.amber}
                    strokeWidth={2}
                    fill="url(#outstandingGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Invoice Status Distribution */}
        <ChartCard title="Invoice Status" subtitle="Distribution by status">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-3 flex-wrap">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">{item.name}</span>
                <span className="text-xs font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Insights */}
        <AIInsightsWidget />

        {/* Recent Invoices */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Invoices</h3>
                <p className="text-xs text-slate-500">Latest invoice activity</p>
              </div>
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">No invoices yet</p>
                      <Link to="/invoices/create" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                        Create your first invoice
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                            <DocumentTextIcon className="h-3.5 w-3.5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{invoice.invoice_number}</p>
                            <p className="text-xs text-slate-500">{invoice.currency}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{invoice.client.name}</p>
                        <p className="text-xs text-slate-500">{invoice.client.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <ClockIcon className="h-3.5 w-3.5 text-slate-400" />
                          {getDaysUntilDue(invoice.due_date)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/invoices/create"
            className="group flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">Create Invoice</span>
          </Link>
          <Link
            to="/clients"
            className="group flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">Add Client</span>
          </Link>
          <Link
            to="/ai-assistant"
            className="group flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">AI Assistant</span>
          </Link>
          <Link
            to="/analytics"
            className="group flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <ChartBarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">View Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
