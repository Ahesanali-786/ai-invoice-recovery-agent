import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BoltIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Automation {
  id: number
  invoice: {
    id: number
    number: string
    amount: number
    status: string
  }
  client: {
    id: number
    name: string
    email: string
  }
  current_stage: string
  reminder_count: number
  status: string
  next_scheduled: string
  channel: string
  used_personalized_strategy: boolean
}

interface ClientBehavior {
  client_id: number
  client_name: string
  risk_category: 'low' | 'medium' | 'high'
  churn_risk_score: number
  avg_payment_days: number
  on_time_rate: number
  preferred_channel: string
  optimal_time: string
}

interface ClientBehaviorDetail {
  client: {
    id: number
    name: string
  }
  avg_payment_days: number
  on_time_payment_rate: number
  risk_category: string
  churn_risk_score: number
  optimal_send_hour: number
  optimal_send_day: string
  preferred_channel: string
  responds_to_discounts: boolean
  effective_discount_rate: number | null
  last_analyzed: string
}

export default function SmartAutomationPanel() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'automations' | 'insights'>('automations')
  const [previewStage, setPreviewStage] = useState<string>('gentle')
  const [selectedClient, setSelectedClient] = useState<ClientBehaviorDetail | null>(null)

  // Fetch active automations
  const { data: automationsData, isLoading: automationsLoading } = useQuery(
    'smart-automations',
    () => axios.get('/api/smart-reminders').then(res => res.data),
    { refetchInterval: 30000 }
  )

  // Fetch client behaviors
  const { data: behaviorsData, isLoading: behaviorsLoading } = useQuery(
    'client-behaviors',
    () => axios.get('/api/smart-reminders/client-behaviors').then(res => res.data),
    { enabled: activeTab === 'insights' }
  )

  // Start automation mutation
  const startMutation = useMutation(
    (invoiceId: number) => axios.post('/api/smart-reminders/start', {
      invoice_id: invoiceId,
      use_smart_strategy: true,
    }),
    {
      onSuccess: () => {
        toast.success('Smart automation started!')
        queryClient.invalidateQueries('smart-automations')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to start automation')
      },
    }
  )

  // Stop automation mutation
  const stopMutation = useMutation(
    (id: number) => axios.post(`/api/smart-reminders/stop/${id}`),
    {
      onSuccess: () => {
        toast.success('Automation stopped')
        queryClient.invalidateQueries('smart-automations')
      },
      onError: () => toast.error('Failed to stop automation'),
    }
  )

  // Batch analyze mutation
  const analyzeMutation = useMutation(
    () => axios.post('/api/smart-reminders/batch-analyze'),
    {
      onSuccess: (res) => {
        toast.success(`Analyzed ${res.data.results.analyzed} clients!`)
        queryClient.invalidateQueries('client-behaviors')
      },
      onError: () => toast.error('Failed to analyze clients'),
    }
  )

  const automations: Automation[] = automationsData?.automations || []
  const clients: ClientBehavior[] = behaviorsData?.clients || []
  const riskSummary = behaviorsData?.risk_summary || { high: 0, medium: 0, low: 0 }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'gentle': return 'bg-blue-100 text-blue-700'
      case 'standard': return 'bg-yellow-100 text-yellow-700'
      case 'urgent': return 'bg-orange-100 text-orange-700'
      case 'final': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return EnvelopeIcon
      case 'whatsapp': return DevicePhoneMobileIcon
      default: return EnvelopeIcon
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BoltIcon className="h-6 w-6 text-violet-600" />
            AI-Powered Smart Automation
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Automatically send reminders at optimal times with personalized escalation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${analyzeMutation.isLoading ? 'animate-spin' : ''}`} />
            Analyze All Clients
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BoltIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Automations</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.filter(a => a.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Risk Clients</p>
              <p className="text-2xl font-bold text-red-600">{riskSummary.high}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-yellow-600">{riskSummary.medium}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{riskSummary.low}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'automations'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BoltIcon className="h-5 w-5" />
            Active Automations
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'insights'
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Client Insights
          </button>
        </div>
      </div>

      {/* Automations Tab */}
      {activeTab === 'automations' && (
        <div className="space-y-4">
          {automationsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : automations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Active Automations</h3>
              <p className="text-gray-600 mt-1">Start smart automation from the invoices page</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStageColor(automation.current_stage)}`}>
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {automation.invoice.number} - ${automation.invoice.amount}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {automation.client.name} • {automation.reminder_count} reminders sent
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStageColor(automation.current_stage)}`}>
                          {automation.current_stage.charAt(0).toUpperCase() + automation.current_stage.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Next: {automation.next_scheduled ? new Date(automation.next_scheduled).toLocaleString() : 'Not scheduled'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {automation.used_personalized_strategy && (
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">
                            AI Optimized
                          </span>
                        )}
                        {(() => {
                          const Icon = getChannelIcon(automation.channel)
                          return <Icon className="h-4 w-4 text-gray-400" />
                        })()}
                        <button
                          onClick={() => stopMutation.mutate(automation.id)}
                          disabled={stopMutation.isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Stop Automation"
                        >
                          <StopIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {behaviorsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Client Data</h3>
              <p className="text-gray-600 mt-1">Click "Analyze All Clients" to generate insights</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {clients.map((client) => (
                  <div
                    key={client.client_id}
                    className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getRiskColor(client.risk_category)}`}>
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{client.client_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              Avg: {client.avg_payment_days} days
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              {client.on_time_rate}% on-time
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRiskColor(client.risk_category)}`}>
                            {client.risk_category.toUpperCase()} RISK
                          </span>
                          <p className="text-gray-500 mt-1">
                            Optimal: {client.optimal_time}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = getChannelIcon(client.preferred_channel)
                            return <Icon className="h-4 w-4 text-gray-400" />
                          })()}
                          <button
                            onClick={() => {
                              axios.get(`/api/smart-reminders/client-behavior/${client.client_id}`)
                                .then(res => setSelectedClient(res.data.analysis))
                            }}
                            className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stage Preview */}
              <div className="bg-white p-4 rounded-lg shadow-sm border mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Reminder Stage Preview</h4>
                <div className="flex gap-2 mb-4">
                  {['gentle', 'standard', 'urgent', 'final'].map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setPreviewStage(stage)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        previewStage === stage
                          ? getStageColor(stage)
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </button>
                  ))}
                </div>
                <div className={`p-4 rounded-lg ${getStageColor(previewStage)} bg-opacity-30`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span className="font-medium">
                      {previewStage === 'gentle' && '👋 Friendly reminder tone - Soft approach for early stage'}
                      {previewStage === 'standard' && '📋 Professional reminder - Formal business tone'}
                      {previewStage === 'urgent' && '⚠️ Urgent tone - Emphasizes payment required'}
                      {previewStage === 'final' && '🚨 Final notice - Before collections action'}
                    </span>
                  </div>
                  <p className="text-sm opacity-75">
                    {previewStage === 'gentle' && 'Sent immediately when invoice becomes overdue. Friendly, non-confrontational language.'}
                    {previewStage === 'standard' && 'Sent after 7 days. Professional but firm. Includes detailed invoice information.'}
                    {previewStage === 'urgent' && 'Sent after 14 days. Warning box styling. Emphasizes immediate action required.'}
                    {previewStage === 'final' && 'Sent after 30 days. Dark red styling. Collections warning included.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{selectedClient.client.name} - Analysis</h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Risk Category</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedClient.risk_category)}`}>
                      {selectedClient.risk_category.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Churn Risk Score</p>
                    <p className="font-medium">{(selectedClient.churn_risk_score * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Avg Payment Time</p>
                    <p className="font-medium">{selectedClient.avg_payment_days} days</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                    <p className="font-medium">{selectedClient.on_time_payment_rate}%</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Optimal Contact Time</p>
                  <p className="font-medium">{selectedClient.optimal_send_day}s at {selectedClient.optimal_send_hour}:00</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Preferred Channel</p>
                  <p className="font-medium capitalize">{selectedClient.preferred_channel}</p>
                </div>

                {selectedClient.responds_to_discounts && (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CurrencyDollarIcon className="h-5 w-5" />
                      <p className="font-medium">Responds to Discounts</p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Effective discount rate: {selectedClient.effective_discount_rate}%
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-right">
                  Last analyzed: {new Date(selectedClient.last_analyzed).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
