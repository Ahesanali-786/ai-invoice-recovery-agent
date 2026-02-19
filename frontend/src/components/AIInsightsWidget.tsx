import { useQuery } from 'react-query'
import axios from 'axios'
import {
  SparklesIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useMutation } from 'react-query'

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

export default function AIInsightsWidget() {
  const { data: insights = [], isLoading, refetch } = useQuery<AIInsight[]>(
    'ai-insights-widget',
    () => axios.get('/api/ai-agent/insights').then(res => res.data),
    { refetchInterval: 60000 }
  )

  const executeActionMutation = useMutation(
    (action: { type: string; params: Record<string, any> }) =>
      axios.post('/api/ai-agent/execute', action),
    {
      onSuccess: (response) => {
        toast.success(response.data.message || 'Action completed!')
        refetch()
      },
      onError: () => { toast.error('Failed to execute action') },
    }
  )

  const handleAction = (action: { type: string; params: Record<string, any> }) => {
    executeActionMutation.mutate(action)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return ExclamationTriangleIcon
      case 'success': return CheckCircleIcon
      case 'action': return BoltIcon
      default: return LightBulbIcon
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'action': return 'bg-violet-50 border-violet-200 text-violet-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-5 w-5 text-violet-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="h-5 w-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">Everything looks good!</p>
          <p className="text-sm text-gray-500">No issues detected at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
            {insights.length}
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          <SparklesIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = getIcon(insight.type)
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getColors(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/50 rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm opacity-90 mt-1">{insight.description}</p>

                  {insight.action && (
                    <button
                      onClick={() => handleAction(insight.action!)}
                      disabled={executeActionMutation.isLoading}
                      className="mt-3 text-sm font-medium underline hover:no-underline flex items-center gap-1 opacity-80 hover:opacity-100"
                    >
                      {insight.action.label}
                      <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
