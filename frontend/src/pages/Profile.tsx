import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  UserCircleIcon,
  CameraIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  KeyIcon,
  BellIcon,
  TrashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
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

  const uploadAvatarMutation = useMutation(
    (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return axios.post('/api/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user')
        toast.success('Avatar uploaded successfully')
      },
      onError: () => {
        toast.error('Failed to upload avatar')
      },
    }
  )

  const removeAvatarMutation = useMutation(
    () => axios.delete('/api/avatar'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user')
        toast.success('Avatar removed')
      },
      onError: () => {
        toast.error('Failed to remove avatar')
      },
    }
  )

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size should be less than 2MB')
        return
      }
      uploadAvatarMutation.mutate(file)
    }
  }

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, security, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 sticky top-6">
            <nav className="space-y-1">
              <a href="#profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl bg-blue-50 text-blue-700">
                <UserCircleIcon className="h-5 w-5" />
                Profile
              </a>
              <a href="#security" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                <ShieldCheckIcon className="h-5 w-5" />
                Security
              </a>
              <a href="#notifications" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                <BellIcon className="h-5 w-5" />
                Notifications
              </a>
            </nav>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div id="profile" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
              <p className="text-sm text-slate-500 mt-1">Update your personal details and public profile</p>
            </div>

            {/* Avatar Section */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=0D8ABC&color=fff&size=128`}
                    alt={user?.name}
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-slate-100"
                  />
                  <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploadAvatarMutation.isLoading}
                    />
                    {uploadAvatarMutation.isLoading ? (
                      <ArrowPathIcon className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <CameraIcon className="h-6 w-6 text-white" />
                    )}
                  </label>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{user?.name}</h3>
                  <p className="text-slate-500 text-sm">{user?.email}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <label className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadAvatarMutation.isLoading}
                      />
                      {uploadAvatarMutation.isLoading ? 'Uploading...' : 'Change Avatar'}
                    </label>
                    {user?.avatar && (
                      <button
                        onClick={() => removeAvatarMutation.mutate()}
                        disabled={removeAvatarMutation.isLoading}
                        className="px-4 py-2 text-rose-600 text-sm font-medium hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removeAvatarMutation.isLoading ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">JPG, PNG, GIF up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={user?.name}
                        required
                        className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Company</label>
                      <div className="relative">
                        <BuildingOfficeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          name="company_name"
                          defaultValue={user?.company_name || ''}
                          className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={user?.phone || ''}
                          className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Timezone</label>
                      <div className="relative">
                        <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          name="timezone"
                          defaultValue={user?.timezone || 'UTC'}
                          className="block w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
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
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Currency</label>
                      <div className="relative">
                        <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          name="currency"
                          defaultValue={user?.currency || 'USD'}
                          className="block w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={updateMutation.isLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {updateMutation.isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Full Name</span>
                      <p className="text-slate-900 font-medium">{user?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</span>
                      <p className="text-slate-900 font-medium">{user?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Company</span>
                      <p className="text-slate-900 font-medium">{user?.company_name || 'Not set'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</span>
                      <p className="text-slate-900 font-medium">{user?.phone || 'Not set'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Timezone</span>
                      <p className="text-slate-900 font-medium">{user?.timezone || 'UTC'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Currency</span>
                      <p className="text-slate-900 font-medium">{user?.currency || 'USD ($)'}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Section */}
          <div id="security" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Security</h2>
              <p className="text-sm text-slate-500 mt-1">Manage your password and account security</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <KeyIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Password</p>
                    <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <LockClosedIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Not enabled</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div id="notifications" className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Email Notifications</h2>
              <p className="text-sm text-slate-500 mt-1">Choose what updates you want to receive</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Invoice Updates', desc: 'When invoices are paid or overdue', checked: true },
                { label: 'New Team Members', desc: 'When someone joins your organization', checked: true },
                { label: 'AI Insights', desc: 'Weekly summary of analytics and predictions', checked: false },
                { label: 'Product Updates', desc: 'New features and improvements', checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50 rounded-2xl border border-rose-200 overflow-hidden">
            <div className="p-6 border-b border-rose-100">
              <h2 className="text-lg font-semibold text-rose-900">Danger Zone</h2>
              <p className="text-sm text-rose-600 mt-1">Irreversible and destructive actions</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-rose-900">Delete Account</p>
                  <p className="text-sm text-rose-600">Once deleted, your account cannot be recovered</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
