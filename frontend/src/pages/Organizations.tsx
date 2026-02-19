import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BuildingOfficeIcon,
  UsersIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
  { value: 'owner', label: 'Owner', description: 'Full access to everything' },
  { value: 'admin', label: 'Admin', description: 'Can manage team and settings' },
  { value: 'manager', label: 'Manager', description: 'Can create invoices and manage clients' },
  { value: 'accountant', label: 'Accountant', description: 'Can view reports and manage payments' },
  { value: 'viewer', label: 'Viewer', description: 'View only access' },
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage your companies and teams</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5" />
          New Organization
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations?.map((org: Organization) => (
          <div
            key={org.id}
            className={`bg-white rounded-lg shadow p-6 border-2 ${org.is_current ? 'border-primary-500' : 'border-transparent'
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="h-8 w-8 rounded" />
                  ) : (
                    <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{org.name}</h3>
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${org.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                      org.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {org.role}
                  </span>
                </div>
              </div>
              {org.is_current && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  <CheckIcon className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member since</span>
                <span className="text-gray-900">
                  {new Date(org.joined_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {!org.is_current && (
                <button
                  onClick={() => switchMutation.mutate(org.id)}
                  disabled={switchMutation.isLoading}
                  className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                >
                  Switch
                </button>
              )}
              {(org.role === 'owner' || org.role === 'admin') && (
                <button
                  onClick={() => {
                    setSelectedOrg(org)
                    setIsMembersModalOpen(true)
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Organization</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="contact@company.com"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>14-day free trial included.</strong> No credit card required.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedOrg.name} - Team Members
              </h2>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Invite Form */}
            {selectedOrg.role === 'owner' || selectedOrg.role === 'admin' ? (
              <form onSubmit={handleInvite} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Invite New Member</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    {ROLES.filter(r => r.value !== 'owner').map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={inviteMutation.isLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    Invite
                  </button>
                </div>
              </form>
            ) : null}

            {/* Members List */}
            <div className="space-y-3">
              {members?.map((member: Member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                      alt={member.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {member.role}
                    </span>
                    {member.last_accessed_at && (
                      <span className="text-xs text-gray-500">
                        Last active {new Date(member.last_accessed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {members?.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No members yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
