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
  LightBulbIcon,
  CpuChipIcon,
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
      onError: () => {
        toast.error('Failed to stop automation')
      },
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
      onError: () => {
        toast.error('Failed to analyze clients')
      },
    }
  )

  const automations: Automation[] = automationsData?.automations || []
  const clients: ClientBehavior[] = behaviorsData?.clients || []
  const riskSummary = behaviorsData?.risk_summary || { high: 0, medium: 0, low: 0 }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'gentle': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'standard': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'urgent': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'final': return 'bg-rose-50 text-rose-700 border-rose-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'gentle': return '👋'
      case 'standard': return '📋'
      case 'urgent': return '⚠️'
      case 'final': return '🚨'
      default: return '📄'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200'
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
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
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <CpuChipIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Smart Assistant</h1>
            <p className="text-sm text-slate-500">Automated invoice collection with AI-powered insights</p>
          </div>
        </div>
        <button
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-500/25 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${analyzeMutation.isLoading ? 'animate-spin' : ''}`} />
          Analyze All Clients
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BoltIcon}
          label="Active Automations"
          value={automations.filter(a => a.status === 'active').length}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={ExclamationTriangleIcon}
          label="High Risk Clients"
          value={riskSummary.high}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Medium Risk"
          value={riskSummary.medium}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Low Risk"
          value={riskSummary.low}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {[
            { id: 'automations', label: 'Active Automations', icon: BoltIcon },
            { id: 'insights', label: 'Client Insights', icon: ChartBarIcon },
            { id: 'chat', label: 'AI Chat', icon: ChatBubbleLeftRightIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${activeTab === tab.id
                ? 'bg-white text-violet-600 border-t-2 border-x border-b-0 border-violet-500 -mb-px'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Automations Tab */}
        {activeTab === 'automations' && (
          <div className="space-y-4">
            {automationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            ) : automations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BoltIcon className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Active Automations</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  Smart automation sends reminders at optimal times based on each client's payment behavior.
                </p>
                <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-100 max-w-2xl mx-auto text-left">
                  <h4 className="font-medium text-violet-900 mb-2 text-sm">How it works:</h4>
                  <ol className="text-sm text-violet-700 space-y-1.5">
                    <li className="flex gap-2"><span className="font-semibold">1.</span><span>AI learns when each client typically pays</span></li>
                    <li className="flex gap-2"><span className="font-semibold">2.</span><span>Reminders sent at best time (e.g., Tuesday 10 AM)</span></li>
                    <li className="flex gap-2"><span className="font-semibold">3.</span><span>Auto-escalation: Gentle → Standard → Urgent → Final</span></li>
                    <li className="flex gap-2"><span className="font-semibold">4.</span><span>Stops automatically when payment received</span></li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {automations.map((automation) => (
                  <div key={automation.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${getStageColor(automation.current_stage)}`}>
                          <span className="text-lg">{getStageIcon(automation.current_stage)}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{automation.invoice.number}</h4>
                          <p className="text-sm text-slate-500">{automation.client.name} • ${automation.invoice.amount} • {automation.reminder_count} reminders sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStageColor(automation.current_stage)}`}>
                            {automation.current_stage.charAt(0).toUpperCase() + automation.current_stage.slice(1)}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">Next: {automation.next_scheduled ? new Date(automation.next_scheduled).toLocaleString() : 'Not scheduled'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {automation.used_personalized_strategy && (
                            <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium border border-violet-200">AI Optimized</span>
                          )}
                          {(() => { const Icon = getChannelIcon(automation.channel); return <Icon className="h-4 w-4 text-slate-400" /> })()}
                          <button onClick={() => stopMutation.mutate(automation.id)} disabled={stopMutation.isLoading} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Stop Automation">
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Client Data</h3>
                <p className="text-sm text-slate-500 mt-1">Click "Analyze All Clients" to generate AI insights</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div key={client.client_id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-lg ${getRiskColor(client.risk_category)}`}>
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{client.client_name}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" />Avg: {client.avg_payment_days} days</span>
                              <span className="flex items-center gap-1"><CheckCircleIcon className="h-3.5 w-3.5" />{client.on_time_rate}% on-time</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${getRiskColor(client.risk_category)}`}>{client.risk_category.toUpperCase()} RISK</span>
                            <p className="text-slate-400 text-xs mt-1">Optimal: {client.optimal_time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => { const Icon = getChannelIcon(client.preferred_channel); return <Icon className="h-4 w-4 text-slate-400" /> })()}
                            <button onClick={() => { axios.get(`/api/smart-reminders/client-behavior/${client.client_id}`).then(res => setSelectedClient(res.data.analysis)) }} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stage Preview */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Reminder Stage Preview</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['gentle', 'standard', 'urgent', 'final'].map((stage) => (
                      <button key={stage} onClick={() => setPreviewStage(stage)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${previewStage === stage ? getStageColor(stage) : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        {getStageIcon(stage)} {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className={`p-4 rounded-xl border ${getStageColor(previewStage)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <LightBulbIcon className="h-5 w-5" />
                      <span className="font-medium">
                        {previewStage === 'gentle' && 'Friendly reminder tone - Soft approach for early stage'}
                        {previewStage === 'standard' && 'Professional reminder - Formal business tone'}
                        {previewStage === 'urgent' && 'Urgent tone - Emphasizes payment required'}
                        {previewStage === 'final' && 'Final notice - Before collections action'}
                      </span>
                    </div>
                    <p className="text-sm opacity-75">
                      {previewStage === 'gentle' && 'Sent immediately when invoice becomes overdue. Friendly, non-confrontational language.'}
                      {previewStage === 'standard' && 'Sent after 7 days. Professional but firm. Includes detailed invoice information.'}
                      {previewStage === 'urgent' && 'Sent after 14 days. Warning styling. Emphasizes immediate action required.'}
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
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[500px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && !isChatLoading && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="h-8 w-8 text-violet-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mb-2">Ask me anything!</p>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">I can help you find overdue invoices, check client payment patterns, send reminders, or analyze your revenue.</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {['Show overdue invoices', 'High risk clients?', 'Revenue forecast', 'Send reminders'].map((suggestion) => (
                      <button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, index) => (
                <div key={msg.id || index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-800'}`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.actions.map((action: any, idx: number) => (
                          <button key={idx} onClick={() => handleChatAction(action)} className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-medium hover:bg-white/30 transition-colors border border-white/30">
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
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-slate-500">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-200 p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }} className="flex gap-3">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your invoices, clients, or revenue..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm" disabled={isChatLoading} />
                <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-violet-500/25">
                  <PaperAirplaneIcon className="h-4 w-4" /> Send
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedClient.client.name}</h3>
                    <p className="text-sm text-slate-500">Client Analysis</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">✕</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Risk Category</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border mt-1 ${getRiskColor(selectedClient.risk_category)}`}>{selectedClient.risk_category.toUpperCase()}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Churn Risk</p>
                    <p className="font-semibold text-slate-900 mt-1">{(selectedClient.churn_risk_score * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Payment Time</p>
                    <p className="font-semibold text-slate-900 mt-1">{selectedClient.avg_payment_days} days</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">On-Time Rate</p>
                    <p className="font-semibold text-slate-900 mt-1">{selectedClient.on_time_payment_rate}%</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Optimal Contact Time</p>
                  <p className="font-semibold text-slate-900 mt-1">{selectedClient.optimal_send_day}s at {selectedClient.optimal_send_hour}:00</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Preferred Channel</p>
                  <p className="font-semibold text-slate-900 mt-1 capitalize">{selectedClient.preferred_channel}</p>
                </div>

                {selectedClient.responds_to_discounts && (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CurrencyDollarIcon className="h-5 w-5" />
                      <p className="font-semibold">Responds to Discounts</p>
                    </div>
                    <p className="text-sm text-emerald-700 mt-1">Effective discount rate: {selectedClient.effective_discount_rate}%</p>
                  </div>
                )}

                <p className="text-xs text-slate-400 text-right">Last analyzed: {new Date(selectedClient.last_analyzed).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
