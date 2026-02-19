import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Conversation {
  id: number
  type: 'email' | 'whatsapp'
  client: {
    id: number
    name: string
    email: string
  }
  subject: string
  status: string
  last_reply_at: string
  reply_count: number
  unread_count: number
  latest_message: {
    direction: 'incoming' | 'outgoing'
    snippet: string
    sent_at: string
  } | null
  invoice: {
    id: number
    number: string
  } | null
}

interface Message {
  id: number
  direction: 'incoming' | 'outgoing'
  from_email: string
  to_email: string
  subject: string
  body: string
  body_html: string | null
  attachments: any[]
  sent_at: string
  is_read: boolean
}

interface ConversationDetail {
  id: number
  subject: string
  status: string
  client: {
    id: number
    name: string
    email: string
  }
  invoice: {
    id: number
    number: string
    amount: number
  } | null
  messages: Message[]
}

export default function ConversationPanel() {
  const queryClient = useQueryClient()
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)

  // Fetch all conversations
  const { data: conversationsData, isLoading } = useQuery(
    'conversations',
    () => axios.get('/api/communications').then(res => res.data),
    { refetchInterval: 30000 }
  )

  // Fetch unread count
  const { data: unreadData } = useQuery(
    'unread-count',
    () => axios.get('/api/communications/unread-count').then(res => res.data),
    { refetchInterval: 30000 }
  )

  // Send reply mutation
  const replyMutation = useMutation(
    ({ id, body }: { id: number; body: string }) =>
      axios.post(`/api/communications/${id}/reply`, { body }),
    {
      onSuccess: () => {
        toast.success('Reply sent successfully!')
        setReplyText('')
        setIsReplyModalOpen(false)
        queryClient.invalidateQueries('conversations')
        if (selectedConversation) {
          fetchConversation(selectedConversation.id)
        }
      },
      onError: () => {
        toast.error('Failed to send reply')
      },
    }
  )

  // Close conversation mutation
  const closeMutation = useMutation(
    (id: number) => axios.post(`/api/communications/${id}/close`),
    {
      onSuccess: () => {
        toast.success('Conversation closed')
        queryClient.invalidateQueries('conversations')
      },
      onError: () => {
        toast.error('Failed to close conversation')
      },
    }
  )

  const fetchConversation = async (id: number) => {
    try {
      const res = await axios.get(`/api/communications/${id}`)
      setSelectedConversation(res.data.conversation)
    } catch (error) {
      toast.error('Failed to load conversation')
    }
  }

  const conversations: Conversation[] = conversationsData?.conversations || []
  const unreadCount = unreadData?.count || 0

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversation) return
    replyMutation.mutate({ id: selectedConversation.id, body: replyText })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-violet-600" />
            Conversations
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Email and WhatsApp replies from clients
          </p>
        </div>
      </div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Conversations Yet</h3>
          <p className="text-gray-600 mt-1 max-w-md mx-auto">
            When clients reply to your emails or WhatsApp messages, they will appear here.
          </p>
          <div className="mt-6 p-4 bg-violet-50 rounded-lg border border-violet-200 max-w-2xl mx-auto text-left">
            <h4 className="font-medium text-violet-900 mb-2">How it works:</h4>
            <ol className="text-sm text-violet-800 space-y-2">
              <li>1. <strong>Send Email:</strong> Click reply button on any invoice</li>
              <li>2. <strong>Client Replies:</strong> Their email reply appears here automatically</li>
              <li>3. <strong>WhatsApp:</strong> Client WhatsApp replies also show here</li>
              <li>4. <strong>Respond:</strong> Reply back directly from this panel</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversation List */}
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => fetchConversation(conv.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedConversation?.id === conv.id
                    ? 'bg-violet-50 border-violet-500'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                  } ${conv.unread_count > 0 ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {conv.type === 'email' ? (
                      <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-500" />
                    )}
                    <span className="font-medium text-sm">{conv.client.name}</span>
                    {conv.unread_count > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {conv.last_reply_at ? new Date(conv.last_reply_at).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1 truncate">{conv.subject}</p>
                {conv.latest_message && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {conv.latest_message.direction === 'incoming' ? 'Client: ' : 'You: '}
                    {conv.latest_message.snippet}
                  </p>
                )}
                {conv.invoice && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {conv.invoice.number}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Conversation Detail */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-lg border shadow-sm h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedConversation.subject}</h3>
                    <p className="text-sm text-gray-600">
                      with {selectedConversation.client.name} ({selectedConversation.client.email})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReplyModalOpen(true)}
                      className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 flex items-center gap-1"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Reply
                    </button>
                    <button
                      onClick={() => closeMutation.mutate(selectedConversation.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.direction === 'outgoing' ? 'flex-row-reverse' : ''
                        }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${message.direction === 'outgoing'
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {message.direction === 'outgoing' ? (
                          <UserCircleIcon className="h-5 w-5" />
                        ) : (
                          <EnvelopeIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div
                        className={`flex-1 max-w-[80%] ${message.direction === 'outgoing' ? 'text-right' : ''
                          }`}
                      >
                        <div
                          className={`inline-block px-4 py-2 rounded-lg text-sm ${message.direction === 'outgoing'
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: message.body_html || message.body,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.sent_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {isReplyModalOpen && selectedConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">Reply to {selectedConversation.client.name}</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={5}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || replyMutation.isLoading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
