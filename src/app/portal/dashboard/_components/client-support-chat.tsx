"use client"

import { useState, useEffect, useRef } from "react"
import { getProjectMessages, sendMessage } from "@/lib/supabase/message-actions"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Send, User, ShieldAlert, Laptop, FileSignature, Landmark, Loader2 } from "lucide-react"
import { usePortalTab } from "../../portal-tab-context"

interface ClientSupportChatProps {
  projectId: string
  project: any
  onBack: () => void
}

type ChatChannel = 'admin' | 'tech_lead' | 'content_lead' | 'sales'

export function ClientSupportChat({ projectId, project, onBack }: ClientSupportChatProps) {
  const { setHideMobileNav } = usePortalTab()
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('admin')
  const [viewMode, setViewMode] = useState<'list' | 'chat'>('list')
  const [messages, setMessages] = useState<any[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (viewMode === 'chat') {
      setHideMobileNav(true)
      if (isMobile) {
        const scrollY = window.scrollY
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'
        document.body.style.height = '100%'

        return () => {
          setHideMobileNav(false)
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.width = ''
          document.body.style.height = ''
          window.scrollTo(0, scrollY)
        }
      }
    } else {
      setHideMobileNav(false)
    }
  }, [viewMode, setHideMobileNav])

  useEffect(() => {
    return () => {
      setHideMobileNav(false)
    }
  }, [setHideMobileNav])

  const fetchMessages = async () => {
    const msgs = await getProjectMessages(projectId)
    setMessages(msgs)
    setLoading(false)
  }

  // Load and subscribe to messages (with real-time updates)
  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`client-project-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    const interval = setInterval(fetchMessages, 8000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [projectId])

  // Scroll to bottom when channel changes or messages load
  useEffect(() => {
    // Small timeout ensures DOM has painted new messages before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    }, 10)
  }, [messages, activeChannel])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return

    const messageText = inputText.trim()
    setInputText("")
    setSending(true)
    inputRef.current?.focus({ preventScroll: true })

    // Optimistic UI update
    const optimisticMsg = {
      id: Math.random().toString(),
      project_id: projectId,
      sender_role: 'client',
      recipient_role: activeChannel,
      message: messageText,
      created_at: new Date().toISOString(),
      sender_name: "You (Client)"
    }
    setMessages(prev => [...prev, optimisticMsg])

    // Get assigned staff id if channel is lead
    let recipientId = null
    if (activeChannel === 'tech_lead') recipientId = project.tech_lead_id
    else if (activeChannel === 'content_lead') recipientId = project.content_lead_id
    else if (activeChannel === 'sales') recipientId = project.sales_lead_id

    const res = await sendMessage({
      projectId,
      messageText,
      recipientRole: activeChannel,
      recipientId
    })

    setSending(false)
    if (res.error) {
      alert("Failed to send message: " + res.error)
      // Rollback optimistic update
      fetchMessages()
    } else {
      fetchMessages()
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

  // Channel details helper
  const channels = [
    {
      id: 'admin' as ChatChannel,
      label: 'Admin',
      sub: 'Company Support',
      icon: ShieldAlert,
      available: true,
      roleName: 'Admin'
    },
    {
      id: 'tech_lead' as ChatChannel,
      label: 'Tech Lead',
      sub: project.tech_lead?.full_name || 'Not Assigned',
      icon: Laptop,
      available: !!project.tech_lead_id,
      roleName: 'Tech Lead'
    },
    {
      id: 'content_lead' as ChatChannel,
      label: 'Content Lead',
      sub: project.content_lead?.full_name || 'Not Assigned',
      icon: FileSignature,
      available: !!project.content_lead_id,
      roleName: 'Content Lead'
    },
    {
      id: 'sales' as ChatChannel,
      label: 'Sales Lead',
      sub: project.sales_lead?.full_name || 'Not Assigned',
      icon: Landmark,
      available: !!project.sales_lead_id,
      roleName: 'Sales Lead'
    }
  ]

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 h-[100dvh] z-50 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col gap-4 md:relative md:inset-auto md:z-auto md:bg-transparent md:p-0 md:w-full md:flex md:flex-col md:gap-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to contact info
        </button>
        <span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 rounded-full">
          Live Chat Support
        </span>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden flex-1 min-h-0 md:h-[550px] bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-slate-900/40 backdrop-blur-md">
        
        {/* Left Side: Channel Selector */}
        <div className={`border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20 md:bg-slate-50/50 md:dark:bg-slate-950/20 p-4 flex flex-col gap-2 h-full overflow-y-auto ${viewMode === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 block">
            Select Chat Channel
          </span>
          <div className="flex flex-col gap-1.5">
            {channels.map((chan) => {
              const Icon = chan.icon
              const active = activeChannel === chan.id
              return (
                <button
                  key={chan.id}
                  disabled={!chan.available}
                  onClick={() => {
                    setActiveChannel(chan.id)
                    setViewMode('chat')
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                    !chan.available 
                      ? 'opacity-40 cursor-not-allowed' 
                      : active
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/10'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${active ? 'bg-white/20 text-white' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate leading-tight">{chan.label}</div>
                    <div className={`text-[10px] truncate leading-none mt-1 ${active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {chan.sub}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Side: Message Thread */}
        <div className={`flex flex-col h-full overflow-hidden ${viewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {/* Active Chat Header */}
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('list')}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-[#D6A33C] flex items-center justify-center font-bold text-sm shrink-0">
              {activeChannel === 'admin' ? 'A' : activeChannel === 'tech_lead' ? 'TL' : activeChannel === 'content_lead' ? 'CL' : 'SL'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                {activeChannel === 'admin' ? 'General Admin / Support' : activeChannel === 'tech_lead' ? `Tech Lead: ${project.tech_lead?.full_name}` : activeChannel === 'content_lead' ? `Content Lead: ${project.content_lead?.full_name}` : `Sales Lead: ${project.sales_lead?.full_name}`}
              </h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected to secure portal chat
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 p-4 overflow-y-auto flex flex-col gap-3 transition-all duration-300 ${isKeyboardOpen ? 'max-h-[160px] md:max-h-none' : ''}`}>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                Loading messages...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Start the conversation</h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  Send a message below. Our team members will reply directly in this portal chat.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.sender_role === 'client'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 px-1">
                      {isMe ? 'You' : msg.sender_name || 'Team member'}
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
          <form onSubmit={handleSend} className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20">
            <input
              type="text"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsKeyboardOpen(true)}
              onBlur={() => setIsKeyboardOpen(false)}
              placeholder="Type your message..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              disabled={!inputText.trim() || sending}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-600 hover:to-amber-700 disabled:opacity-40 disabled:hover:from-amber-500 disabled:hover:to-amber-600 transition-all duration-300"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
