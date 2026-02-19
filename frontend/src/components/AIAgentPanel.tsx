import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'react-query'
import axios from 'axios'
import {
  SparklesIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  BoltIcon,
  LightBulbIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: AIAction[]
}

interface AIAction {
  type: 'send_reminder' | 'schedule_followup' | 'mark_paid' | 'analyze' | 'create_invoice'
  label: string
  params: Record<string, any>
}

interface AIInsight {
  id: string
  type: 'warning' | 'success' | 'info' | 'action'
  title: string
  description: string
  action?: {
    label: string
    type: string
    params: Record<string, any>
  }
}

interface AgentStatus {
  is_online: boolean
  current_task: string | null
  last_activity: string
  tasks_completed: number
  insights_generated: number
}

export default function AIAgentPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: agentStatus } = useQuery<AgentStatus>(
    'agent-status',
    () => axios.get('/api/ai-agent/status').then(res => res.data),
    { refetchInterval: 30000 }
  )

  const { data: insights } = useQuery<AIInsight[]>(
    'ai-insights',
    () => axios.get('/api/ai-agent/insights').then(res => res.data),
    { refetchInterval: 60000 }
  )

  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>(
    'ai-messages',
    () => axios.get('/api/ai-agent/messages').then(res => res.data),
    { enabled: isOpen }
  )

  const sendMessageMutation = useMutation(
    (content: string) => axios.post('/api/ai-agent/chat', { message: content }),
    {
      onSuccess: () => {
        setInput('')
        refetchMessages()
      },
      onError: () => toast.error('Failed to send message'),
    }
  )

  const executeActionMutation = useMutation(
    (action: AIAction) => axios.post('/api/ai-agent/execute', action),
    {
      onSuccess: (response) => {
        toast.success(response.data.message || 'Action completed!')
        refetchMessages()
      },
      onError: () => toast.error('Failed to execute action'),
    }
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessageMutation.mutate(input)
  }

  const handleAction = (action: AIAction) => {
    executeActionMutation.mutate(action)
  }

  const quickActions = [
    { label: 'Send reminders to overdue', icon: BoltIcon, prompt: 'Send reminders to all overdue invoices' },
    { label: 'Analyze at-risk clients', icon: LightBulbIcon, prompt: 'Analyze my at-risk invoices' },
    { label: 'Revenue forecast', icon: ClockIcon, prompt: 'Show me revenue forecast for next month' },
    { label: 'Mark paid invoices', icon: CheckCircleIcon, prompt: 'Help me mark invoices as paid' },
  ]

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <SparklesIcon className="h-5 w-5 animate-pulse" />
        <span className="font-medium">AI Assistant</span>
        {agentStatus?.is_online && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </button>

      {/* AI Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[450px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI Recovery Agent</h3>
                <p className="text-xs text-violet-100">
                  {agentStatus?.is_online ? 'Online and ready to help' : 'Connecting...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Agent Status Bar */}
          {agentStatus?.current_task && (
            <div className="bg-violet-50 px-4 py-2 border-b border-violet-100">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                <span className="text-xs text-violet-700 font-medium">
                  Working: {agentStatus.current_task}
                </span>
              </div>
            </div>
          )}

          {/* Insights Section */}
          {insights && insights.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 max-h-40 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">AI Insights</h4>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-2 rounded-lg text-sm ${insight.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                      insight.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                        insight.type === 'action' ? 'bg-violet-50 border border-violet-200 text-violet-800' :
                          'bg-blue-50 border border-blue-200 text-blue-800'
                      }`}
                  >
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-xs opacity-90">{insight.description}</div>
                    {insight.action && (
                      <button
                        onClick={() => handleAction(insight.action as AIAction)}
                        className="mt-1 text-xs font-medium underline hover:no-underline"
                      >
                        {insight.action.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-violet-100 rounded-full inline-block mb-3">
                  <SparklesIcon className="h-8 w-8 text-violet-600" />
                </div>
                <p className="text-gray-600 mb-4">How can I help you today?</p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        setInput(action.prompt)
                        sendMessageMutation.mutate(action.prompt)
                      }}
                      className="flex items-center gap-2 p-2 text-left text-xs bg-gray-100 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition-colors"
                    >
                      <action.icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${message.role === 'user' ? 'bg-violet-600' : 'bg-gray-100'
                    }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-4 w-4 text-white" />
                    ) : (
                      <SparklesIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-lg max-w-[85%] text-sm ${message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>

                    {/* Message Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAction(action)}
                            className="px-3 py-1 bg-violet-100 text-violet-700 text-xs rounded-full hover:bg-violet-200 transition-colors flex items-center gap-1"
                          >
                            <BoltIcon className="h-3 w-3" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about your invoices..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isLoading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              AI can send reminders, analyze data, and help recover payments
            </p>
          </div>
        </div>
      )}
    </>
  )
}
