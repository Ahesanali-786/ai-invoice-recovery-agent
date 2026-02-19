import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  BoltIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  StopIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import ConversationPanel from '../components/ConversationPanel'

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

export default function AIAssistant() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'automations' | 'insights' | 'conversations' | 'chat'>('automations')
  const [previewStage, setPreviewStage] = useState<string>('gentle')
  const [selectedClient, setSelectedClient] = useState<ClientBehaviorDetail | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: number | string, role: string, content: string, actions?: any[], timestamp?: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  // Fetch chat history when tab is active
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatHistory()
    }
  }, [activeTab])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isChatLoading])

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get('/api/ai-agent/messages')
      setChatMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
    }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const response = await axios.post('/api/ai-agent/chat', { message })

      // Add AI response
      const aiMessage = {
        id: response.data.id,
        role: 'assistant',
        content: response.data.content,
        actions: response.data.actions,
      }
      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      toast.error('Failed to get response from AI')
      console.error('Chat error:', error)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleChatAction = async (action: any) => {
    try {
      const response = await axios.post('/api/ai-agent/execute', {
        type: action.type,
        params: action.params,
      })

      if (response.data.success) {
        toast.success(response.data.message)

        // Handle redirect if provided
        if (response.data.redirect) {
          window.location.href = response.data.redirect
        }
      } else {
        toast.error(response.data.message || 'Action failed')
      }
    } catch (error) {
      toast.error('Failed to execute action')
      console.error('Action error:', error)
    }
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Smart Automation</h1>
              <p className="text-sm text-violet-100">
                Fully automated invoice collection with AI-powered insights
              </p>
            </div>
          </div>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-violet-600 rounded-lg hover:bg-violet-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${analyzeMutation.isLoading ? 'animate-spin' : ''}`} />
            Analyze All Clients
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50">
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
      <div className="bg-gray-50 px-4 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'automations'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <BoltIcon className="h-5 w-5" />
            Active Automations
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'insights'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Client Insights
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'chat'
              ? 'border-violet-500 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            AI Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Automations Tab */}
        {activeTab === 'automations' && (
          <div className="space-y-4">
            {automationsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : automations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Active Automations</h3>
                <p className="text-gray-600 mt-1 max-w-md mx-auto">
                  Smart automation automatically sends reminders at optimal times based on each client&apos;s payment behavior.
                  Start automation from the Invoices page for overdue invoices.
                </p>
                <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-200 max-w-2xl mx-auto text-left">
                  <h4 className="font-medium text-violet-900 mb-2">How it works:</h4>
                  <ol className="text-sm text-violet-800 space-y-2">
                    <li>1. <strong>AI Analysis:</strong> System learns when each client typically pays</li>
                    <li>2. <strong>Optimal Timing:</strong> Reminders sent at best time (e.g., Tuesday 10 AM)</li>
                    <li>3. <strong>Auto-Escalation:</strong> Tone increases: Gentle → Standard → Urgent → Final</li>
                    <li>4. <strong>Payment Detection:</strong> Stops automatically when payment received</li>
                    <li>5. <strong>Receipt:</strong> Sends thank-you email automatically</li>
                  </ol>
                </div>
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
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Client Data</h3>
                <p className="text-gray-600 mt-1">Click &quot;Analyze All Clients&quot; to generate AI insights</p>
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
                        className={`px-3 py-1 rounded text-sm font-medium ${previewStage === stage
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

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.length === 0 && !isChatLoading && (
                <div className="text-center py-12 text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Ask me anything about your invoices!</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    I can help you find overdue invoices, check client payment patterns,
                    send reminders, or analyze your revenue forecast based on your real data.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {['Show overdue invoices', 'Who are my high risk clients?', 'Revenue forecast', 'Send reminders to all'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSendMessage(suggestion)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-violet-300 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>

                    {/* Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.actions.map((action: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleChatAction(action)}
                            className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded text-xs font-medium hover:bg-violet-200 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(chatInput)
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your invoices, clients, or revenue..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

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
