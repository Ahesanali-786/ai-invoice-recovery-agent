import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { format, parseISO } from 'date-fns'
import {
  PlusIcon,
  EyeIcon,
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  BoltIcon,
  EnvelopeIcon,
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'schedule'>('all')
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
      onError: () => toast.error('Failed to create invoice'),
    }
  )

  const markPaidMutation = useMutation(
    (id: number) => axios.post(`/api/invoices/${id}/mark-paid`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        toast.success('Invoice marked as paid')
      },
      onError: () => toast.error('Failed to mark as paid'),
    }
  )

  const sendReminderMutation = useMutation(
    ({ id, type }: { id: number; type: string }) =>
      axios.post(`/api/invoices/${id}/reminders`, { type }),
    {
      onSuccess: () => toast.success('Reminder sent successfully'),
      onError: () => toast.error('Failed to send reminder'),
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
    () => axios.post('/api/communications/start-from-invoice', {
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
      onError: () => toast.error('Failed to send email'),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage and track your invoices</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Invoice
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            All ({invoices?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <ClockIcon className="h-4 w-4 inline mr-1" />
            Pending ({pendingInvoices?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'paid'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <BanknotesIcon className="h-4 w-4 inline mr-1" />
            Paid ({paidInvoices?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'schedule'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Schedule
          </button>
        </nav>
      </div>

      {/* All/Pending Tab Content */}
      {(activeTab === 'all' || activeTab === 'pending') && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingInvoices?.map((invoice: Invoice) => (
                <tr key={invoice.id} className={invoice.is_overdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.currency} {Number(invoice.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {invoice.is_overdue && <ClockIcon className="h-4 w-4 text-red-500" />}
                      {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'pending' && invoice.is_overdue ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {invoice.status === 'pending' && invoice.is_overdue ? 'Overdue' : invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.reminder_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEmailInvoice(invoice)
                        setEmailSubject(`Re: Invoice ${invoice.invoice_number}`)
                        setIsEmailModalOpen(true)
                      }}
                      className="text-orange-600 hover:text-orange-900 mr-3"
                      title="Send Email"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </button>
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => startAutomationMutation.mutate(invoice.id)}
                        disabled={startAutomationMutation.isLoading}
                        className="text-violet-600 hover:text-violet-900 mr-3"
                        title="Start Smart Automation"
                      >
                        <BoltIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => sendReminderMutation.mutate({ id: invoice.id, type: 'gentle' })}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Send reminder"
                    >
                      <BellIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => markPaidMutation.mutate(invoice.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Mark as paid"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => downloadPdf(invoice.id, invoice.invoice_number)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-gray-600 hover:text-gray-900"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paid Invoices Tab */}
      {activeTab === 'paid' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckBadgeIcon className="h-5 w-5 text-green-600" />
              Paid Invoices ({paidInvoices?.length || 0})
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paidInvoices?.length > 0 ? (
                paidInvoices.map((invoice: Invoice) => (
                  <tr key={invoice.id} className="bg-green-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                      {invoice.currency} {Number(invoice.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                        {invoice.reminder_count} sent
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => downloadPdf(invoice.id, invoice.invoice_number)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="View details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No paid invoices yet. Mark invoices as paid to see them here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              Reminder Schedule ({pendingInvoices?.length || 0})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pending invoices and their scheduled reminder status
            </p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reminder Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingInvoices?.length > 0 ? (
                pendingInvoices.map((invoice: Invoice) => {
                  const daysLeft = Math.ceil((new Date(invoice.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const reminderType = daysLeft < 0 ? 'urgent' : daysLeft < 3 ? 'standard' : 'gentle'

                  return (
                    <tr key={invoice.id} className={invoice.is_overdue ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft < 3 ? 'text-orange-600' : 'text-green-600'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reminderType === 'urgent' ? 'bg-red-100 text-red-800' :
                          reminderType === 'standard' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                          {reminderType === 'gentle' ? 'Gentle' : reminderType === 'standard' ? 'Standard' : 'Urgent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${invoice.reminder_count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {invoice.reminder_count > 0 ? `${invoice.reminder_count} sent` : 'Not sent'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No pending invoices scheduled for reminders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  name="client_id"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Select client</option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                <input
                  type="text"
                  name="invoice_number"
                  required
                  placeholder="INV-001"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    name="currency"
                    defaultValue="USD"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                  <input
                    type="date"
                    name="issue_date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice File (PDF/Image)</label>
                <input
                  type="file"
                  name="invoice_file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-medium">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Client:</span>
                <span className="font-medium">{selectedInvoice.client.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{selectedInvoice.client.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium">{selectedInvoice.currency} {Number(selectedInvoice.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Issue Date:</span>
                <span>{format(parseISO(selectedInvoice.issue_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date:</span>
                <span>{format(parseISO(selectedInvoice.due_date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`capitalize ${selectedInvoice.status === 'paid' ? 'text-green-600' :
                  selectedInvoice.is_overdue ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                  {selectedInvoice.status === 'pending' && selectedInvoice.is_overdue ? 'Overdue' : selectedInvoice.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reminders Sent:</span>
                <span>{selectedInvoice.reminder_count}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
