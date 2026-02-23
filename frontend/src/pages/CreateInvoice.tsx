import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  CalculatorIcon,
  HashtagIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('')

  const { data: clients } = useQuery('clients', () =>
    axios.get('/api/clients').then(res => res.data.data)
  )

  useEffect(() => {
    axios.get('/api/invoices/next-number').then(res => {
      setNextInvoiceNumber(res.data.invoice_number)
    })
  }, [])

  const createMutation = useMutation(
    (data: FormData) => axios.post('/api/invoices', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        toast.success('Invoice created successfully')
        navigate('/invoices')
      },
      onError: () => {
        toast.error('Failed to create invoice')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate(formData)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/invoices')}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Create New Invoice</h1>
          <p className="text-sm text-slate-500">Generate a professional invoice for your client</p>
        </div>
      </div>

      {/* Invoice Number Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/25">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <HashtagIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-blue-100 font-medium">Invoice Number</p>
              <p className="text-2xl font-bold tracking-wider">{nextInvoiceNumber || 'Loading...'}</p>
            </div>
          </div>
          <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
            Auto-Generated
          </span>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Client Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <UserGroupIcon className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Client Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Client <span className="text-rose-500">*</span>
              </label>
              <select
                name="client_id"
                required
                className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 px-3 transition-all"
              >
                <option value="">Choose a client...</option>
                {clients?.map((client: any) => (
                  <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                ))}
              </select>
              {clients?.length === 0 && (
                <p className="text-xs text-slate-500 mt-1.5">
                  No clients found. <button type="button" onClick={() => navigate('/clients')} className="text-blue-600 hover:underline">Add a client first</button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <CalculatorIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Invoice Amount</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Amount <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 pl-8 pr-3 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
              <select
                name="currency"
                defaultValue="USD"
                className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 px-3 transition-all"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
                <option value="CAD">CAD (C$) - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Invoice Dates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="issue_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 pl-10 pr-3 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="due_date"
                  required
                  className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 pl-10 pr-3 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-50 rounded-lg">
              <DocumentTextIcon className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Description & Notes</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Invoice Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Enter invoice description, payment terms, or any notes for the client..."
                className="block w-full rounded-xl border-slate-200 border bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 py-2.5 px-3 resize-none transition-all"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Attach File (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="invoice_file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-colors"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
            </div>
          </div>
        </div>

        {/* Hidden invoice number */}
        <input type="hidden" name="invoice_number" value={nextInvoiceNumber} />

        {/* Actions */}
        <div className="p-6 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading || !nextInvoiceNumber}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/25"
          >
            {createMutation.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
