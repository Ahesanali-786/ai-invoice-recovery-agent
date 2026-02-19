import { useQuery } from 'react-query'
import axios from 'axios'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CurrencyDollarIcon,
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
  delay = 0,
}: {
  name: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple'
  trend?: number
  delay?: number
}) {
  const colorClasses = {
    emerald: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200/50',
    blue: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-200/50',
    amber: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/50',
    rose: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200/50',
    purple: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-200/50',
  }

  const iconColors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 card-hover ${colorClasses[color]}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Icon className="h-24 w-24" />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center justify-center rounded-xl p-2.5 ${iconColors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend >= 0 ? <ArrowUpRightIcon className="h-3.5 w-3.5" /> : <ArrowDownRightIcon className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${changeType === 'negative' ? 'text-rose-600' : changeType === 'positive' ? 'text-emerald-600' : 'text-gray-500'}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back! Here's what's happening with your invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary inline-flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">This Month</span>
          </button>
          <Link to="/invoices/new" className="btn-primary inline-flex items-center gap-2">
            <DocumentTextIcon className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          name="Total Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          change="Lifetime earnings"
          changeType="neutral"
          icon={BanknotesIcon}
          color="emerald"
          trend={12.5}
          delay={0}
        />
        <StatCard
          name="Outstanding"
          value={formatCurrency(stats?.outstanding_amount || 0)}
          change={`${stats?.total_invoices || 0} total invoices`}
          changeType="neutral"
          icon={DocumentTextIcon}
          color="amber"
          delay={100}
        />
        <StatCard
          name="Overdue Amount"
          value={formatCurrency(stats?.overdue_amount || 0)}
          change={`${stats?.overdue_count || 0} invoices overdue`}
          changeType="negative"
          icon={ExclamationTriangleIcon}
          color="rose"
          delay={200}
        />
        <StatCard
          name="Total Clients"
          value={stats?.total_clients || 0}
          change="Active customers"
          changeType="positive"
          icon={UsersIcon}
          color="blue"
          trend={8.2}
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly collection vs outstanding"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outstandingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => format(parseISO(value + '-01'), 'MMM')}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
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
                <Legend iconType="circle" />
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

        {/* Invoice Status Distribution */}
        <ChartCard title="Invoice Status" subtitle="Distribution by status">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
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
          <div className="mt-4 flex justify-center gap-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <AIInsightsWidget />

        {/* Recent Invoices */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                <p className="text-sm text-gray-500">Latest invoice activity</p>
              </div>
              <Link
                to="/invoices"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-2 text-sm text-gray-500">No invoices yet</p>
                      <Link to="/invoices/new" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                        Create your first invoice
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                            <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                            <p className="text-xs text-gray-500">{invoice.currency}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{invoice.client.name}</p>
                        <p className="text-xs text-gray-500">{invoice.client.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
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
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/invoices/new"
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors">
              <DocumentTextIcon className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Create Invoice</span>
          </Link>
          <Link
            to="/clients/new"
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Add Client</span>
          </Link>
          <Link
            to="/ai-assistant"
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">AI Assistant</span>
          </Link>
          <Link
            to="/analytics"
            className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <ChartBarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
