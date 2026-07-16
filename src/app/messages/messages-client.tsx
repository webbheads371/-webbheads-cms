"use client"

import { useState, useEffect, useRef } from "react"
import { getStaffConversations, getProjectMessages, sendMessage } from "@/lib/supabase/message-actions"
import { createClient } from "@/lib/supabase/client"
import { 
  MessageSquare, Send, User, Laptop, FileSignature, 
  Landmark, ShieldAlert, Loader2, ArrowLeft 
} from "lucide-react"

interface MessagesClientProps {
  currentStaff: {
    id: string
    full_name: string
    email: string
    role: "admin" | "tech_lead" | "content_lead" | "sales"
  }
}

type ChatChannel = 'admin' | 'tech_lead' | 'content_lead' | 'sales'

export function MessagesClient({ currentStaff }: MessagesClientProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('admin')
  const [inputText, setInputText] = useState("")
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = currentStaff.role === 'admin'
  const supabase = createClient()

  // Load conversations list
  const loadConversations = async () => {
    const convs = await getStaffConversations()
    setConversations(convs)
    setLoadingConv(false)
  }

  // Load messages for selected conversation
  const loadMessages = async (projId: string) => {
    const msgs = await getProjectMessages(projId)
    setMessages(msgs)
    setLoadingMessages(false)
  }

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 6000)
    return () => clearInterval(interval)
  }, [])

  // Load and subscribe to messages (with real-time updates)
  useEffect(() => {
    if (!selectedConv) return
    loadMessages(selectedConv.projectId)

    // 1. Setup real-time channel
    const channel = supabase
      .channel(`staff-project-messages-${selectedConv.projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${selectedConv.projectId}`
        },
        () => {
          loadMessages(selectedConv.projectId)
          loadConversations()
        }
      )
      .subscribe()

    // 2. Setup backup polling (every 3 seconds)
    const interval = setInterval(() => {
      loadMessages(selectedConv.projectId)
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [selectedConv])

  // Set initial channel based on staff role
  useEffect(() => {
    if (selectedConv) {
      if (isAdmin) {
        setActiveChannel('admin')
      } else {
        setActiveChannel(currentStaff.role as ChatChannel)
      }
    }
  }, [selectedConv, currentStaff.role, isAdmin])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeChannel])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sending || !selectedConv) return

    const messageText = inputText.trim()
    setInputText("")
    setSending(true)

    // Optimistic message update
    const optimisticMsg = {
      id: Math.random().toString(),
      project_id: selectedConv.projectId,
      sender_id: currentStaff.id,
      sender_role: activeChannel, // staff replies in their active channel role
      recipient_role: 'client',
      recipient_id: selectedConv.clientUsers[0]?.id || null,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_name: `${currentStaff.full_name} (${activeChannel === 'admin' ? 'Admin' : activeChannel === 'tech_lead' ? 'Tech Lead' : activeChannel === 'content_lead' ? 'Content Lead' : 'Sales Lead'})`
    }
    setMessages(prev => [...prev, optimisticMsg])

    const res = await sendMessage({
      projectId: selectedConv.projectId,
      messageText,
      recipientRole: 'client', // always sending to client
      recipientId: selectedConv.clientUsers[0]?.id || null // target the first client user if possible
    })

    setSending(false)
    if (res.error) {
      alert("Failed to send message: " + res.error)
      if (selectedConv) loadMessages(selectedConv.projectId)
    } else {
      if (selectedConv) loadMessages(selectedConv.projectId)
      loadConversations()
    }
  }

  // Filter messages for current selected channel thread
  const filteredMessages = messages.filter(msg => {
    // Thread logic:
    // Client sent to ActiveChannel: (sender = client, recipient = activeChannel)
    // ActiveChannel sent to Client: (sender = activeChannel, recipient = client)
    return (
      (msg.sender_role === 'client' && msg.recipient_role === activeChannel) ||
      (msg.sender_role === activeChannel && msg.recipient_role === 'client')
    )
  })

  const channelsList = [
    { id: 'admin' as ChatChannel, label: 'Admin Chat', icon: ShieldAlert, allowed: isAdmin || currentStaff.role === 'admin' },
    { id: 'tech_lead' as ChatChannel, label: 'Tech Lead Chat', icon: Laptop, allowed: isAdmin || currentStaff.role === 'tech_lead' },
    { id: 'content_lead' as ChatChannel, label: 'Content Lead Chat', icon: FileSignature, allowed: isAdmin || currentStaff.role === 'content_lead' },
    { id: 'sales' as ChatChannel, label: 'Sales Chat', icon: Landmark, allowed: isAdmin || currentStaff.role === 'sales' },
  ]

  const activeChannelObj = channelsList.find(c => c.id === activeChannel)

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-stretch border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden h-[70vh] lg:h-[650px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
      
      {/* Left Column: Conversations List */}
      <div className={`border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            Support Conversations
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {loadingConv ? (
            <div className="flex flex-col items-center justify-center p-6 text-slate-400 text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 text-xs p-6 italic">
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const active = selectedConv?.projectId === conv.projectId
              return (
                <button
                  key={conv.projectId}
                  onClick={() => {
                    setSelectedConv(conv)
                    setLoadingMessages(true)
                  }}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-300 text-left border ${
                    active 
                      ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30 text-slate-800 dark:text-white shadow-xs' 
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-bold truncate max-w-[70%]">{conv.clientName}</span>
                    {conv.lastMessageAt && (
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate leading-none">
                    Project: {conv.projectName}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {conv.lastMessageSender === 'client' ? 'Client: ' : 'Staff: '}
                    {conv.lastMessage}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Thread */}
      <div className={`flex flex-col h-full overflow-hidden ${!selectedConv ? 'hidden lg:flex items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-950/10' : 'flex'}`}>
        
        {!selectedConv ? (
          <div className="text-center max-w-[280px] flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-[#D6A33C]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Chat Selected</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
              Select a client conversation from the left sidebar to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 text-[#D6A33C] flex items-center justify-center font-bold text-sm shrink-0">
                  {selectedConv.clientName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                    {selectedConv.clientName}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    Project: {selectedConv.projectName}
                  </p>
                </div>
              </div>

              {/* Channel Selector for Admins */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {channelsList.map((c) => {
                  if (!c.allowed) return null
                  const active = activeChannel === c.id
                  const Icon = c.icon
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChannel(c.id)
                        setLoadingMessages(true)
                        loadMessages(selectedConv.projectId)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {loadingMessages ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  Loading thread...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-slate-400" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">No messages in {activeChannelObj?.label}</h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                    This channel has no communication history. Send a message to the client to begin.
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.sender_id === currentStaff.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 px-1">
                        {isMe ? 'You' : msg.sender_name || 'Client'}
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/30 dark:border-slate-800'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a reply as ${activeChannelObj?.label.replace(' Chat', '')}...`}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-600 transition-all duration-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
