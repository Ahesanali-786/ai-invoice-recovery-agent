import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  company_name?: string
  phone?: string
  timezone?: string
  currency?: string
}

export default function Profile() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: user, isLoading } = useQuery('user', () =>
    axios.get('/api/user').then(res => res.data)
  )

  const updateMutation = useMutation(
    (data: Partial<User>) => axios.put('/api/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user')
        setIsEditing(false)
        toast.success('Profile updated successfully')
      },
      onError: () => {
        toast.error('Failed to update profile')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    updateMutation.mutate({
      name: formData.get('name') as string,
      company_name: formData.get('company_name') as string,
      phone: formData.get('phone') as string,
      timezone: formData.get('timezone') as string,
      currency: formData.get('currency') as string,
    })
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&size=128`}
                alt={user?.name}
                className="h-24 w-24 rounded-full object-cover"
              />
              <button className="absolute bottom-0 right-0 rounded-full bg-primary-600 p-2 text-white hover:bg-primary-700">
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              {user?.company_name && (
                <p className="text-sm text-gray-400 mt-1">{user?.company_name}</p>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={user?.name}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    defaultValue={user?.company_name || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={user?.phone || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    name="timezone"
                    defaultValue={user?.timezone || 'UTC'}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                  <select
                    name="currency"
                    defaultValue={user?.currency || 'USD'}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{user?.name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium text-gray-900">{user?.company_name || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{user?.phone || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Timezone</p>
                  <p className="font-medium text-gray-900">{user?.timezone || 'UTC'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Default Currency</p>
                  <p className="font-medium text-gray-900">{user?.currency || 'USD'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
