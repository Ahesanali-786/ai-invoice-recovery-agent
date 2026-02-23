import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface Client {
  id: number
  name: string
  email: string
  phone?: string
  whatsapp_number?: string
  company?: string
  invoices_count: number
  outstanding_amount: number
  preferred_contact_method?: string
}

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery('clients', () =>
    axios.get('/api/clients').then(res => res.data.data)
  )

  const createMutation = useMutation(
    (data: Partial<Client>) => axios.post('/api/clients', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients')
        setIsModalOpen(false)
        toast.success('Client created successfully')
      },
      onError: () => {
        toast.error('Failed to create client')
      },
    }
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<Client> }) => axios.put(`/api/clients/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients')
        setIsModalOpen(false)
        setEditingClient(null)
        toast.success('Client updated successfully')
      },
      onError: () => {
        toast.error('Failed to update client')
      },
    }
  )

  const deleteMutation = useMutation(
    (id: number) => axios.delete(`/api/clients/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('clients')
        setDeleteConfirm(null)
        toast.success('Client deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete client')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp_number: formData.get('whatsapp_number') as string,
      company: formData.get('company') as string,
      preferred_contact_method: formData.get('preferred_contact_method') as string,
    }

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const filteredClients = clients?.filter((client: Client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalOutstanding = clients?.reduce((sum: number, client: Client) => sum + Number(client.outstanding_amount || 0), 0) || 0
  const totalInvoices = clients?.reduce((sum: number, client: Client) => sum + client.invoices_count, 0) || 0

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Clients</h1>
            <p className="text-sm text-slate-500">Manage your customer contacts and track invoices</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25"
        >
          <PlusIcon className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={UserGroupIcon}
          label="Total Clients"
          value={clients?.length || 0}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={DocumentTextIcon}
          label="Total Invoices"
          value={totalInvoices}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          label="Outstanding Amount"
          value={`$${totalOutstanding.toLocaleString()}`}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search clients by name, email, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Clients Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Add your first client to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients?.map((client: Client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <BuildingOfficeIcon className="h-3.5 w-3.5" />
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(client.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <PhoneIcon className="h-4 w-4 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <Link
                  to={`/invoices?client=${client.id}`}
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span className="font-semibold text-slate-900">{client.invoices_count}</span> invoices
                </Link>
                {client.outstanding_amount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <CurrencyDollarIcon className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-amber-600">
                      ${Number(client.outstanding_amount).toLocaleString()}
                    </span>
                    <span className="text-slate-500">outstanding</span>
                  </div>
                )}
              </div>

              {/* Preferred Contact */}
              {client.preferred_contact_method && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                    Preferred: {client.preferred_contact_method}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </h2>
                </div>
                <button
                  onClick={() => { setIsModalOpen(false); setEditingClient(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingClient?.name}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingClient?.email}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingClient?.phone}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp_number"
                      defaultValue={editingClient?.whatsapp_number}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    defaultValue={editingClient?.company}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Contact Method</label>
                  <select
                    name="preferred_contact_method"
                    defaultValue={editingClient?.preferred_contact_method || 'email'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingClient(null); }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {editingClient ? 'Update Client' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Client?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete this client? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
