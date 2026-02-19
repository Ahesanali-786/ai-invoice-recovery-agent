import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { CogIcon, BellIcon, ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
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

export default function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'email'>('general')
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application preferences</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'general'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <CogIcon className="h-5 w-5" />
          General
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'notifications'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <BellIcon className="h-5 w-5" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'security'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <ShieldCheckIcon className="h-5 w-5" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'email'
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <EnvelopeIcon className="h-5 w-5" />
          Email Templates
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
          <form onSubmit={handleGeneralSubmit} className="space-y-4 max-w-md">
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
              <p className="mt-1 text-xs text-gray-500">Used for scheduling reminders and displaying dates</p>
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
              <p className="mt-1 text-xs text-gray-500">Default currency for new invoices</p>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={settingsMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {settingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          <form onSubmit={handleNotificationSubmit} className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md">
              <input
                type="checkbox"
                name="whatsapp_enabled"
                id="whatsapp_enabled"
                defaultChecked={user?.whatsapp_enabled}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div>
                <label htmlFor="whatsapp_enabled" className="font-medium text-gray-900">
                  Enable WhatsApp Notifications
                </label>
                <p className="text-sm text-gray-500">Send payment reminders via WhatsApp in addition to email</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Reminder Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gentle Reminder (days before due)
                  </label>
                  <input
                    type="number"
                    name="gentle_days_before"
                    min="1"
                    max="30"
                    defaultValue={user?.reminder_settings?.gentle_days_before || 7}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Friendly first reminder</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Standard Reminder (days before due)
                  </label>
                  <input
                    type="number"
                    name="standard_days_before"
                    min="1"
                    max="30"
                    defaultValue={user?.reminder_settings?.standard_days_before || 3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Closer to due date</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Urgent Reminder (days after due)
                  </label>
                  <input
                    type="number"
                    name="urgent_days_after"
                    min="1"
                    max="30"
                    defaultValue={user?.reminder_settings?.urgent_days_after || 1}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">After due date</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Final Notice (days after due)
                  </label>
                  <input
                    type="number"
                    name="final_days_after"
                    min="1"
                    max="60"
                    defaultValue={user?.reminder_settings?.final_days_after || 7}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Last reminder before escalation</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={settingsMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {settingsMutation.isLoading ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.password_confirmation}
                onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={passwordMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {passwordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Email Templates Settings */}
      {activeTab === 'email' && <EmailTemplatesSection />}
    </div>
  )
}

interface EmailTemplate {
  id?: number
  template_type: string
  name: string
  subject: string
  body: string
  is_active: boolean
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const existingTemplate = templates?.find((t: EmailTemplate) => t.template_type === selectedType)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
            <p className="text-sm text-gray-500">
              Customize your email templates. If no custom template is set, the default will be used.
            </p>
          </div>
          {existingTemplate && (
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Custom template active
            </span>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Template Type</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              loadTemplate(e.target.value)
              setShowPreview(false)
            }}
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="organization_invitation">Organization Invitation</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="My Custom Invitation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject Line</label>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="You've been invited to join {{ organization_name }}"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Email Body (HTML)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUseDefault}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Reset to Default
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Preview
                </button>
              </div>
            </div>
            <textarea
              value={template.body}
              onChange={(e) => setTemplate({ ...template, body: e.target.value })}
              required
              rows={15}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
              placeholder="<!DOCTYPE html>..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Use {'{{ variable_name }}'} syntax for dynamic content. Available variables:
              {'{{ inviter_name }}'}, {'{{ inviter_email }}'}, {'{{ organization_name }}'},
              {'{{ invitation_role }}'}, {'{{ accept_url }}'}, {'{{ expires_at }}'}, {'{{ app_name }}'}, {'{{ year }}'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={template.is_active}
              onChange={(e) => setTemplate({ ...template, is_active: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Use this custom template (uncheck to use default)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saveMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saveMutation.isLoading ? 'Saving...' : 'Save Template'}
            </button>
            {existingTemplate?.id && (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(existingTemplate.id!)}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete Template'}
              </button>
            )}
          </div>
        </form>
      </div>

      {showPreview && preview && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">Subject: {preview.subject}</p>
            <iframe
              srcDoc={preview.body}
              title="Email Preview"
              className="w-full border rounded bg-white"
              sandbox="allow-same-origin"
              style={{ height: '600px', overflow: 'auto' }}
              scrolling="yes"
            />
          </div>
        </div>
      )}
    </div>
  )
}
