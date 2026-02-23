import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: number
  name: string
  email: string
  timezone?: string
  currency?: string
  reminder_settings?: {
    gentle_days_before?: number
    standard_days_before?: number
    urgent_days_after?: number
    final_days_after?: number
  }
  whatsapp_enabled?: boolean
}

interface PasswordForm {
  current_password: string
  password: string
  password_confirmation: string
}

interface EmailTemplate {
  id?: number
  template_type: string
  name: string
  subject: string
  body: string
  is_active: boolean
}

type TabType = 'general' | 'notifications' | 'security' | 'email'

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const { data: user, isLoading } = useQuery('user', () =>
    axios.get('/api/user').then(res => res.data)
  )

  const settingsMutation = useMutation(
    (data: Partial<User>) => axios.put('/api/settings', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('user')
        toast.success('Settings saved successfully')
      },
      onError: () => {
        toast.error('Failed to save settings')
      },
    }
  )

  const passwordMutation = useMutation(
    (data: PasswordForm) => axios.post('/api/change-password', data),
    {
      onSuccess: () => {
        setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
        toast.success('Password changed successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to change password')
      },
    }
  )

  const handleGeneralSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    settingsMutation.mutate({
      timezone: formData.get('timezone') as string,
      currency: formData.get('currency') as string,
    })
  }

  const handleNotificationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    settingsMutation.mutate({
      whatsapp_enabled: formData.get('whatsapp_enabled') === 'on',
      reminder_settings: {
        gentle_days_before: parseInt(formData.get('gentle_days_before') as string),
        standard_days_before: parseInt(formData.get('standard_days_before') as string),
        urgent_days_after: parseInt(formData.get('urgent_days_after') as string),
        final_days_after: parseInt(formData.get('final_days_after') as string),
      },
    })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('Passwords do not match')
      return
    }
    passwordMutation.mutate(passwordForm)
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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your application preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 sticky top-6">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Cog6ToothIcon className="h-5 w-5" />
                <span className="flex-1 text-left">General</span>
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${activeTab === 'general' ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BellIcon className="h-5 w-5" />
                <span className="flex-1 text-left">Notifications</span>
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${activeTab === 'notifications' ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5" />
                <span className="flex-1 text-left">Security</span>
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${activeTab === 'security' ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === 'email' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <EnvelopeIcon className="h-5 w-5" />
                <span className="flex-1 text-left">Email Templates</span>
                <ChevronRightIcon className={`h-4 w-4 transition-transform ${activeTab === 'email' ? 'rotate-90' : ''}`} />
              </button>
            </nav>
          </div>

          {/* Quick Info Card */}
          <div className="mt-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">Current Timezone</span>
            </div>
            <p className="text-sm font-semibold">{user?.timezone || 'UTC'}</p>
            <div className="flex items-center gap-2 mt-3 mb-2">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">Default Currency</span>
            </div>
            <p className="text-sm font-semibold">{user?.currency || 'USD'}</p>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">General Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Configure your timezone and default currency</p>
              </div>
              <form onSubmit={handleGeneralSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-slate-400" />
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      defaultValue={user?.timezone || 'UTC'}
                      className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">Eastern Time (ET) - New York</option>
                      <option value="America/Chicago">Central Time (CT) - Chicago</option>
                      <option value="America/Denver">Mountain Time (MT) - Denver</option>
                      <option value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT) - London</option>
                      <option value="Europe/Paris">Central European Time (CET) - Paris</option>
                      <option value="Asia/Dubai">Gulf Standard Time (GST) - Dubai</option>
                      <option value="Asia/Kolkata">Indian Standard Time (IST) - Mumbai</option>
                      <option value="Asia/Tokyo">Japan Standard Time (JST) - Tokyo</option>
                      <option value="Australia/Sydney">Australian Eastern Time (AEST) - Sydney</option>
                    </select>
                    <p className="text-xs text-slate-500">Used for scheduling reminders and displaying dates</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-slate-400" />
                      Default Currency
                    </label>
                    <select
                      name="currency"
                      defaultValue={user?.currency || 'USD'}
                      className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="CAD">CAD (C$) - Canadian Dollar</option>
                      <option value="AUD">AUD (A$) - Australian Dollar</option>
                      <option value="JPY">JPY (¥) - Japanese Yen</option>
                    </select>
                    <p className="text-xs text-slate-500">Default currency for new invoices</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={settingsMutation.isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {settingsMutation.isLoading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    {settingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">Configure how and when you receive payment reminders</p>
              </div>
              <form onSubmit={handleNotificationSubmit} className="p-6 space-y-6">
                {/* WhatsApp Toggle */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.35-8.413"/>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">WhatsApp Notifications</p>
                        <p className="text-sm text-slate-500">Send payment reminders via WhatsApp</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="whatsapp_enabled"
                        defaultChecked={user?.whatsapp_enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Reminder Schedule */}
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                    Reminder Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Gentle Reminder</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="gentle_days_before"
                          min="1"
                          max="30"
                          defaultValue={user?.reminder_settings?.gentle_days_before || 7}
                          className="block w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-500">days before due</span>
                      </div>
                      <p className="text-xs text-slate-500">Friendly first reminder</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Standard Reminder</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="standard_days_before"
                          min="1"
                          max="30"
                          defaultValue={user?.reminder_settings?.standard_days_before || 3}
                          className="block w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-500">days before due</span>
                      </div>
                      <p className="text-xs text-slate-500">Closer to due date</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Urgent Reminder</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="urgent_days_after"
                          min="1"
                          max="30"
                          defaultValue={user?.reminder_settings?.urgent_days_after || 1}
                          className="block w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-500">days after due</span>
                      </div>
                      <p className="text-xs text-slate-500">After due date</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Final Notice</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="final_days_after"
                          min="1"
                          max="60"
                          defaultValue={user?.reminder_settings?.final_days_after || 7}
                          className="block w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-500">days after due</span>
                      </div>
                      <p className="text-xs text-slate-500">Last reminder before escalation</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={settingsMutation.isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {settingsMutation.isLoading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    {settingsMutation.isLoading ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                <p className="text-sm text-slate-500 mt-1">Change your password and secure your account</p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <KeyIcon className="h-4 w-4 text-slate-400" />
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        required
                        className="block w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <LockClosedIcon className="h-4 w-4 text-slate-400" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                        required
                        minLength={8}
                        className="block w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Minimum 8 characters recommended</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.password_confirmation}
                        onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                        required
                        className="block w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={passwordMutation.isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {passwordMutation.isLoading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyIcon className="h-4 w-4" />
                    )}
                    {passwordMutation.isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Templates */}
          {activeTab === 'email' && <EmailTemplatesSection />}
        </div>
      </div>
    </div>
  )
}

function EmailTemplatesSection() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState('organization_invitation')
  const [template, setTemplate] = useState<EmailTemplate>({
    template_type: 'organization_invitation',
    name: '',
    subject: '',
    body: '',
    is_active: true,
  })
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { data: templates, isLoading } = useQuery('emailTemplates', () =>
    axios.get('/api/email-templates').then(res => res.data.templates)
  )

  const { data: defaultTemplate } = useQuery(['defaultTemplate', selectedType], () =>
    axios.get(`/api/email-templates/defaults/${selectedType}`).then(res => res.data.template)
  )

  const saveMutation = useMutation(
    (data: EmailTemplate) => axios.post('/api/email-templates', data).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('emailTemplates')
        toast.success('Template saved successfully')
      },
      onError: () => {
        toast.error('Failed to save template')
      },
    }
  )

  const deleteMutation = useMutation(
    (id: number) => axios.delete(`/api/email-templates/${id}`).then(res => res.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('emailTemplates')
        setTemplate({
          template_type: selectedType,
          name: '',
          subject: '',
          body: '',
          is_active: true,
        })
        toast.success('Template deleted. Default will be used.')
      },
      onError: () => {
        toast.error('Failed to delete template')
      },
    }
  )

  const previewMutation = useMutation(
    (data: { subject: string; body: string }) =>
      axios.post('/api/email-templates/preview', data).then(res => res.data),
    {
      onSuccess: (data) => {
        setPreview(data)
        setShowPreview(true)
      },
      onError: () => {
        toast.error('Failed to generate preview')
      },
    }
  )

  const loadTemplate = (type: string) => {
    const existing = templates?.find((t: EmailTemplate) => t.template_type === type)
    if (existing) {
      setTemplate(existing)
    } else if (defaultTemplate) {
      setTemplate({
        template_type: type,
        name: defaultTemplate.name,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        is_active: true,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(template)
  }

  const handlePreview = () => {
    previewMutation.mutate({ subject: template.subject, body: template.body })
  }

  const handleUseDefault = () => {
    if (defaultTemplate) {
      setTemplate({
        ...template,
        name: defaultTemplate.name,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
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

  const existingTemplate = templates?.find((t: EmailTemplate) => t.template_type === selectedType)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Email Templates</h2>
              <p className="text-sm text-slate-500 mt-1">Customize your email templates for various notifications</p>
            </div>
            {existingTemplate && (
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                Custom template active
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-slate-400" />
              Template Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value)
                loadTemplate(e.target.value)
                setShowPreview(false)
              }}
              className="block w-full max-w-md px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="organization_invitation">Organization Invitation</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Template Name</label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  required
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="My Custom Invitation"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Subject Line</label>
                <input
                  type="text"
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  required
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="You've been invited to join {{ organization_name }}"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Email Body (HTML)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUseDefault}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <textarea
                value={template.body}
                onChange={(e) => setTemplate({ ...template, body: e.target.value })}
                required
                rows={12}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="<!DOCTYPE html>..."
              />
              <p className="text-xs text-slate-500">
                Use {'{{ variable_name }}'} syntax for dynamic content. Available: {'{{ inviter_name }}'}, {'{{ inviter_email }}'}, {'{{ organization_name }}'}, {'{{ invitation_role }}'}, {'{{ accept_url }}'}, {'{{ expires_at }}'}, {'{{ app_name }}'}, {'{{ year }}'}
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <input
                type="checkbox"
                id="is_active"
                checked={template.is_active}
                onChange={(e) => setTemplate({ ...template, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Use this custom template (uncheck to use default)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saveMutation.isLoading ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {saveMutation.isLoading ? 'Saving...' : 'Save Template'}
              </button>
              {existingTemplate?.id && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(existingTemplate.id!)}
                  disabled={deleteMutation.isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 disabled:opacity-50 transition-all"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete Template'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showPreview && preview && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="border rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-4">Subject: {preview.subject}</p>
              <iframe
                srcDoc={preview.body}
                title="Email Preview"
                className="w-full border rounded-lg bg-white"
                sandbox="allow-same-origin"
                style={{ height: '500px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
