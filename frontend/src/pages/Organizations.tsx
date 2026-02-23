import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BuildingOfficeIcon,
  UsersIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  EyeIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Organization {
  id: number
  name: string
  slug: string
  logo: string | null
  role: string
  status: string
  is_current: boolean
  joined_at: string
}

interface Member {
  id: number
  name: string
  email: string
  avatar: string | null
  role: string
  joined_at: string
  last_accessed_at: string | null
}

const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access to everything', icon: ShieldCheckIcon, color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { value: 'admin', label: 'Admin', description: 'Can manage team and settings', icon: ShieldCheckIcon, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'manager', label: 'Manager', description: 'Can create invoices and manage clients', icon: BriefcaseIcon, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'accountant', label: 'Accountant', description: 'Can view reports and manage payments', icon: ChartPieIcon, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'viewer', label: 'Viewer', description: 'View only access', icon: EyeIcon, color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

export default function Organizations() {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')

  const { data: organizations, isLoading } = useQuery('organizations', () =>
    axios.get('/api/organizations').then(res => res.data)
  )

  const createMutation = useMutation(
    (data: { name: string; email?: string }) => axios.post('/api/organizations', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('organizations')
        setIsCreateModalOpen(false)
        toast.success('Organization created successfully')
      },
      onError: () => {
        toast.error('Failed to create organization')
      },
    }
  )

  const switchMutation = useMutation(
    (orgId: number) => axios.post(`/api/organizations/${orgId}/switch`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('organizations')
        queryClient.invalidateQueries('user')
        toast.success('Switched organization')
      },
      onError: () => {
        toast.error('Failed to switch organization')
      },
    }
  )

  const inviteMutation = useMutation(
    ({ orgId, email, role }: { orgId: number; email: string; role: string }) =>
      axios.post(`/api/organizations/${orgId}/invite`, { email, role }),
    {
      onSuccess: () => {
        setInviteEmail('')
        queryClient.invalidateQueries(['members', selectedOrg?.id])
        toast.success('Invitation sent')
      },
      onError: () => {
        toast.error('Failed to send invitation')
      },
    }
  )

  const { data: members } = useQuery(
    ['members', selectedOrg?.id],
    () => axios.get(`/api/organizations/${selectedOrg?.id}/members`).then(res => res.data),
    { enabled: !!selectedOrg }
  )

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    })
  }

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedOrg && inviteEmail) {
      inviteMutation.mutate({
        orgId: selectedOrg.id,
        email: inviteEmail,
        role: inviteRole,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getRoleStyle = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role)
    return roleConfig?.color || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const getRoleLabel = (role: string) => {
    const roleConfig = ROLES.find(r => r.value === role)
    return roleConfig?.label || role
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Organizations</h1>
            <p className="text-sm text-slate-500">Manage your companies and teams</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          New Organization
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations?.map((org: Organization) => (
          <div
            key={org.id}
            className={`bg-white rounded-xl border p-5 transition-all hover:shadow-md ${org.is_current
                ? 'border-blue-500 shadow-md shadow-blue-500/10'
                : 'border-slate-200'
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${org.is_current ? 'bg-blue-50' : 'bg-slate-50'
                  }`}>
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <BuildingOfficeIcon className={`h-6 w-6 ${org.is_current ? 'text-blue-600' : 'text-slate-500'}`} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{org.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${getRoleStyle(org.role)}`}>
                    {getRoleLabel(org.role)}
                  </span>
                </div>
              </div>
              {org.is_current && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                  <CheckIcon className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Member since</span>
                <span className="text-slate-900 font-medium">
                  {format(new Date(org.joined_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {!org.is_current && (
                <button
                  onClick={() => switchMutation.mutate(org.id)}
                  disabled={switchMutation.isLoading}
                  className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                >
                  {switchMutation.isLoading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    'Switch'
                  )}
                </button>
              )}
              {(org.role === 'owner' || org.role === 'admin') && (
                <button
                  onClick={() => {
                    setSelectedOrg(org)
                    setIsMembersModalOpen(true)
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <UsersIcon className="h-4 w-4" />
                  Members
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Organization Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Create New Organization</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>14-day free trial included.</strong> No credit card required.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {isMembersModalOpen && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedOrg.name}</h2>
                  <p className="text-xs text-slate-500">Team Members</p>
                </div>
              </div>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {/* Invite Form */}
              {(selectedOrg.role === 'owner' || selectedOrg.role === 'admin') && (
                <form onSubmit={handleInvite} className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-sm font-medium text-slate-900 mb-3">Invite New Member</h3>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      {ROLES.filter(r => r.value !== 'owner').map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={inviteMutation.isLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {inviteMutation.isLoading ? '...' : 'Invite'}
                    </button>
                  </div>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {members?.map((member: Member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}&background=0D8ABC&color=fff`}
                        alt={member.name}
                        className="h-10 w-10 rounded-full ring-2 ring-white"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getRoleStyle(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                      {member.last_accessed_at && (
                        <span className="text-xs text-slate-400 hidden sm:block">
                          Last active {format(new Date(member.last_accessed_at), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {members?.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No members yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Invite team members to collaborate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
