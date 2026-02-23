import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  EyeIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  BanknotesIcon,
  BoltIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TrashIcon,
  FunnelIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Invoice {
  id: number
  invoice_number: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled'
  due_date: string
  issue_date: string
  client: { name: string; email: string }
  reminder_count: number
  is_overdue: boolean
}

export default function Invoices() {
  const navigate = useNavigate()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null)
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery('invoices', () =>
    axios.get('/api/invoices').then(res => res.data.data)
  )

  const { data: clients } = useQuery('clients', () =>
    axios.get('/api/clients').then(res => res.data.data)
  )

  // Separate invoices by status
  const pendingInvoices = invoices?.filter((inv: Invoice) => inv.status !== 'paid') || []
  const paidInvoices = invoices?.filter((inv: Invoice) => inv.status === 'paid') || []

  const createMutation = useMutation(
    (data: FormData) => axios.post('/api/invoices', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        setIsModalOpen(false)
        toast.success('Invoice created successfully')
      },
      onError: () => {
        toast.error('Failed to create invoice')
      },
    }
  )

  const markPaidMutation = useMutation(
    (id: number) => axios.post(`/api/invoices/${id}/mark-paid`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        toast.success('Invoice marked as paid')
      },
      onError: () => {
        toast.error('Failed to mark as paid')
      },
    }
  )

  const sendReminderMutation = useMutation(
    ({ id, type }: { id: number; type: string }) =>
      axios.post(`/api/invoices/${id}/reminders`, { type }),
    {
      onSuccess: () => {
        toast.success('Reminder sent successfully')
      },
      onError: () => {
        toast.error('Failed to send reminder')
      },
    }
  )

  const startAutomationMutation = useMutation(
    (invoiceId: number) => axios.post('/api/smart-reminders/start', {
      invoice_id: invoiceId,
      use_smart_strategy: true,
    }),
    {
      onSuccess: () => {
        toast.success('Smart automation started! AI will now handle reminders automatically.')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to start automation')
      },
    }
  )
  const sendEmailMutation = useMutation(
    (_: void) => axios.post('/api/communications/start-from-invoice', {
      invoice_id: emailInvoice?.id,
      subject: emailSubject,
      body: emailBody,
    }),
    {
      onSuccess: () => {
        toast.success('Email sent successfully!')
        setIsEmailModalOpen(false)
        setEmailSubject('')
        setEmailBody('')
        setEmailInvoice(null)
      },
      onError: () => {
        toast.error('Failed to send email')
      },
    }
  )

  const downloadPdf = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/pdf/download`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('PDF downloaded successfully')
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    if (status === 'paid') {
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' }
    }
    if (isOverdue) {
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Overdue' }
    }
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending' }
  }

  const filteredInvoices = invoices?.filter((invoice: Invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'pending') return matchesSearch && invoice.status !== 'paid' && !invoice.is_overdue
    if (activeTab === 'paid') return matchesSearch && invoice.status === 'paid'
    if (activeTab === 'overdue') return matchesSearch && invoice.is_overdue
    return matchesSearch
  })

  const totalAmount = invoices?.reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0) || 0
  const overdueAmount = invoices?.filter((inv: Invoice) => inv.is_overdue).reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500">Manage and track your invoices</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/invoices/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
        >
          <PlusIcon className="h-4 w-4" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon={DocumentTextIcon}
          label="Total Invoices"
          value={invoices?.length || 0}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={ClockIcon}
          label="Pending"
          value={pendingInvoices?.length || 0}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={BanknotesIcon}
          label="Paid"
          value={paidInvoices?.length || 0}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={ChartPieIcon}
          label="Total Value"
          value={`$${totalAmount.toLocaleString()}`}
          color="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices by number, client name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All Invoices', count: invoices?.length || 0 },
            { id: 'pending', label: 'Pending', count: pendingInvoices?.filter((i: Invoice) => !i.is_overdue).length || 0 },
            { id: 'overdue', label: 'Overdue', count: invoices?.filter((i: Invoice) => i.is_overdue).length || 0 },
            { id: 'paid', label: 'Paid', count: paidInvoices?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab.id
                  ? 'bg-white text-blue-600 border-t-2 border-x border-b-0 border-blue-500 -mb-px'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Reminders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <DocumentTextIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No Invoices Found</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {searchQuery ? 'Try adjusting your search' : 'Create your first invoice to get started'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => navigate('/invoices/create')}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Create Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices?.map((invoice: Invoice) => {
                  const status = getStatusBadge(invoice.status, invoice.is_overdue)
                  const daysLeft = differenceInDays(parseISO(invoice.due_date), new Date())

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{invoice.invoice_number}</p>
                            <p className="text-xs text-slate-500">{invoice.currency}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{invoice.client.name}</p>
                        <p className="text-xs text-slate-500">{invoice.client.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">
                          ${Number(invoice.amount).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600">
                          {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                        </div>
                        <p className={`text-xs mt-0.5 ${daysLeft < 0 ? 'text-rose-500' : daysLeft < 3 ? 'text-amber-500' : 'text-slate-400'
                          }`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
                          {invoice.status === 'paid' ? <CheckCircleIcon className="h-3.5 w-3.5" /> : invoice.is_overdue ? <ClockIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${invoice.reminder_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'
                          }`}>
                          {invoice.reminder_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {invoice.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => {
                                  setEmailInvoice(invoice)
                                  setEmailSubject(`Re: Invoice ${invoice.invoice_number}`)
                                  setIsEmailModalOpen(true)
                                }}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Send Email"
                              >
                                <EnvelopeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startAutomationMutation.mutate(invoice.id)}
                                disabled={startAutomationMutation.isLoading}
                                className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                title="Start Smart Automation"
                              >
                                <BoltIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => sendReminderMutation.mutate({ id: invoice.id, type: 'gentle' })}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Send Reminder"
                              >
                                <BellIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => markPaidMutation.mutate(invoice.id)}
                                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark as Paid"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => downloadPdf(invoice.id, invoice.invoice_number)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedInvoice.invoice_number}</h3>
                    <p className="text-sm text-slate-500">Invoice Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client</p>
                  <p className="font-semibold text-slate-900">{selectedInvoice.client.name}</p>
                  <p className="text-sm text-slate-500">{selectedInvoice.client.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Amount</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      ${Number(selectedInvoice.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">{selectedInvoice.currency}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border mt-1 ${getStatusBadge(selectedInvoice.status, selectedInvoice.is_overdue).bg
                      } ${getStatusBadge(selectedInvoice.status, selectedInvoice.is_overdue).text} ${getStatusBadge(selectedInvoice.status, selectedInvoice.is_overdue).border
                      }`}>
                      {getStatusBadge(selectedInvoice.status, selectedInvoice.is_overdue).label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Issue Date</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {format(parseISO(selectedInvoice.issue_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Due Date</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {format(parseISO(selectedInvoice.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Reminders Sent</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-slate-900">{selectedInvoice.reminder_count}</span>
                    <span className="text-sm text-slate-500">
                      {selectedInvoice.reminder_count === 1 ? 'reminder' : 'reminders'} sent
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { downloadPdf(selectedInvoice.id, selectedInvoice.invoice_number); setSelectedInvoice(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => { markPaidMutation.mutate(selectedInvoice.id); setSelectedInvoice(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && emailInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <EnvelopeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Send Email</h3>
                    <p className="text-sm text-slate-500">Invoice: {emailInvoice.invoice_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">To</p>
                  <p className="font-medium text-slate-900">{emailInvoice.client.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    rows={4}
                    placeholder="Enter your message..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendEmailMutation.mutate()}
                  disabled={sendEmailMutation.isLoading || !emailSubject.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  {sendEmailMutation.isLoading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
