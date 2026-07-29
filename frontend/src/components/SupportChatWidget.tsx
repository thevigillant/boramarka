import React, { useState, useEffect, useRef } from 'react'
import {
  LifeBuoy, MessageSquare, X, Send, Plus, ChevronLeft,
  CheckCircle2, Clock, Loader2, Sparkles, HelpCircle
} from 'lucide-react'
import { api } from '../services/api'

interface TicketMessage {
  id: number
  ticketId: number
  senderRole: 'USER' | 'SUPERADMIN'
  senderName: string
  message: string
  createdAt: string
}

interface SupportTicket {
  id: number
  subject: string
  category: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  priority: string
  createdAt: string
  updatedAt: string
  messages?: TicketMessage[]
}

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [viewMode, setViewMode] = useState<'LIST' | 'CHAT' | 'NEW'>('LIST')

  // Form states
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('DUVIDA')
  const [newMessage, setNewMessage] = useState('')
  const [chatInput, setChatInput] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTickets()
    }
  }, [isOpen])

  useEffect(() => {
    if (activeTicket && viewMode === 'CHAT') {
      fetchTicketDetails(activeTicket.id)
      const interval = setInterval(() => fetchTicketDetails(activeTicket.id), 8000)
      return () => clearInterval(interval)
    }
  }, [activeTicket?.id, viewMode])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const data = await api.getSupportTickets()
      setTickets(data)
    } catch (err) {
      console.error('Erro ao buscar chamados de suporte:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const data = await api.getTicketDetails(ticketId)
      setActiveTicket(data)
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Erro ao carregar conversa:', err)
    }
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim()) return

    try {
      setSending(true)
      const created = await api.createSupportTicket({
        subject: newSubject,
        category: newCategory,
        message: newMessage,
      })
      setNewSubject('')
      setNewMessage('')
      await fetchTickets()
      fetchTicketDetails(created.id)
      setViewMode('CHAT')
    } catch (err: any) {
      alert(err.message || 'Erro ao abrir chamado.')
    } finally {
      setSending(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !activeTicket) return

    const msg = chatInput
    setChatInput('')

    try {
      setSending(true)
      const sent = await api.sendTicketMessage(activeTicket.id, msg)
      setMessages((prev: TicketMessage[]) => [...prev, sent])
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.')
      setChatInput(msg)
    } finally {
      setSending(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!activeTicket) return
    try {
      await api.updateTicketStatus(activeTicket.id, 'RESOLVED')
      fetchTicketDetails(activeTicket.id)
      fetchTickets()
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status.')
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Floating Widget Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 text-white shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer group"
        title="Ajuda & Suporte BoraMarka"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 animate-pulse" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap text-xs font-black uppercase tracking-wider pl-1">
              Chat de Ajuda
            </span>
          </div>
        )}
      </button>

      {/* Floating Chat Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white/95 dark:bg-[#0D111E]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              {viewMode !== 'LIST' && (
                <button
                  onClick={() => setViewMode('LIST')}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-wide leading-tight">Suporte BoraMarka</h4>
                <p className="text-[10px] text-white/80 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Atendimento em tempo real
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            
            {/* VIEW MODE: LIST OF TICKETS */}
            {viewMode === 'LIST' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Seus Chamados
                  </span>
                  <button
                    onClick={() => setViewMode('NEW')}
                    className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo Chamado
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">Carregando conversas...</p>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                    <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Precisa de ajuda ou tem dúvidas?</p>
                    <p className="text-[11px] text-slate-400">Abra um chamado diretamente com a nossa equipe de suporte.</p>
                    <button
                      onClick={() => setViewMode('NEW')}
                      className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-pink-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Criar Primeiro Chamado
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tickets.map((ticket: SupportTicket) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setActiveTicket(ticket)
                          setViewMode('CHAT')
                        }}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 hover:border-pink-500/40 transition-all cursor-pointer shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            #{ticket.id} • {ticket.category}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            ticket.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : ticket.status === 'IN_PROGRESS'
                              ? 'bg-pink-500/10 text-pink-600 border-pink-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {ticket.status === 'RESOLVED' ? 'Concluído' : ticket.status === 'IN_PROGRESS' ? 'Respondido' : 'Aberto'}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{ticket.subject}</h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(ticket.updatedAt)}</span>
                          <span className="text-pink-500 font-bold hover:underline">Ver conversa &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE: NEW TICKET FORM */}
            {viewMode === 'NEW' && (
              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoria da Ajuda</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="input-simple text-xs font-bold w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                  >
                    <option value="DUVIDA" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Dúvida de Uso</option>
                    <option value="FINANCEIRO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Financeiro / Planos</option>
                    <option value="TECNICO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Problema Técnico</option>
                    <option value="SUGESTAO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Sugestão de Melhoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Assunto Curto</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Ex: Como alterar meu número do WhatsApp?"
                    className="input-simple text-xs font-bold w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Descreva o que precisa</label>
                  <textarea
                    rows={4}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Descreva detalhadamente sua dúvida ou o problema que encontrou..."
                    className="input-simple text-xs font-medium w-full bg-white text-slate-900 dark:bg-[#131826] dark:text-white resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-black shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Enviar Chamado</span>
                </button>
              </form>
            )}

            {/* VIEW MODE: CHAT CONVERSATION */}
            {viewMode === 'CHAT' && activeTicket && (
              <div className="flex flex-col h-full space-y-3">
                {/* Ticket Banner Info */}
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-pink-500">#{activeTicket.id} • {activeTicket.category}</span>
                    {activeTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={handleResolveTicket}
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Marcar Resolvido
                      </button>
                    )}
                  </div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white leading-snug">{activeTicket.subject}</h5>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[220px]">
                  {messages.map((msg: TicketMessage) => {
                    const isUser = msg.senderRole === 'USER'
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1">
                          {msg.senderName} • {formatTime(msg.createdAt)}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-[#1A2235] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Send Input Form */}
                {activeTicket.status === 'RESOLVED' ? (
                  <div className="p-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    ✓ Este chamado foi marcado como concluído.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 shrink-0 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      className="input-simple text-xs py-2 px-3 flex-1 bg-white text-slate-900 dark:bg-[#131826] dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={sending || !chatInput.trim()}
                      className="p-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
