import React, { useState, useEffect, useRef } from 'react'
import {
  LifeBuoy, MessageSquare, X, Send, Plus, ChevronLeft,
  CheckCircle2, Clock, Loader2, Sparkles, HelpCircle, Star, Paperclip, AlertTriangle, Bot
} from 'lucide-react'
import { api, SupportTicketItem, SupportMessageItem, SupportReplyTemplateItem } from '../services/api'

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [tickets, setTickets] = useState<SupportTicketItem[]>([])
  const [activeTicket, setActiveTicket] = useState<SupportTicketItem | null>(null)
  const [messages, setMessages] = useState<SupportMessageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [viewMode, setViewMode] = useState<'LIST' | 'CHAT' | 'NEW'>('LIST')

  // Form states
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('DUVIDA')
  const [newMessage, setNewMessage] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentName, setAttachmentName] = useState('')

  // Rating & Satisfaction Modal State
  const [ratingModalTicketId, setRatingModalTicketId] = useState<number | null>(null)
  const [starRating, setStarRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  // Templates State
  const [templates, setTemplates] = useState<SupportReplyTemplateItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchTickets()
      fetchTemplates()
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

  const fetchTemplates = async () => {
    try {
      const data = await api.getSupportTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Erro ao carregar templates de resposta:', err)
    }
  }

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const data = await api.getSupportTicket(ticketId)
      setActiveTicket(data)
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Erro ao carregar conversa:', err)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachmentUrl(event.target.result as string)
        setAttachmentName(file.name)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
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
        attachmentUrl,
        attachmentName,
      })
      setNewSubject('')
      setNewMessage('')
      setAttachmentUrl('')
      setAttachmentName('')
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
    const url = attachmentUrl
    const name = attachmentName

    setChatInput('')
    setAttachmentUrl('')
    setAttachmentName('')

    try {
      setSending(true)
      const sent = await api.sendSupportMessage(activeTicket.id, {
        message: msg,
        attachmentUrl: url,
        attachmentName: name,
      })
      setMessages((prev: SupportMessageItem[]) => [...prev, sent])
      // Atualiza o chat para buscar a resposta automática imediata do Assistente IA
      setTimeout(() => {
        fetchTicketDetails(activeTicket.id)
      }, 400)
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
      await api.updateSupportStatus(activeTicket.id, 'RESOLVED')
      setRatingModalTicketId(activeTicket.id)
      fetchTicketDetails(activeTicket.id)
      fetchTickets()
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status.')
    }
  }

  const handleSubmitRating = async () => {
    if (!ratingModalTicketId) return
    try {
      setSubmittingRating(true)
      await api.submitSupportSatisfaction(ratingModalTicketId, starRating, ratingComment)
      setRatingModalTicketId(null)
      setRatingComment('')
      fetchTickets()
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar avaliação.')
    } finally {
      setSubmittingRating(false)
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
              Helpdesk & Suporte
            </span>
          </div>
        )}
      </button>

      {/* Satisfaction Rating Modal */}
      {ratingModalTicketId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto font-bold">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Como foi seu atendimento?</h3>
              <p className="text-xs text-slate-400 font-medium">Sua avaliação melhora nosso suporte técnico</p>
            </div>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setStarRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star className={`w-7 h-7 ${star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Deixe um comentário opcional..."
              className="input-simple text-xs font-medium w-full bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-800 rounded-xl p-3"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setRatingModalTicketId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400"
              >
                Pular
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[390px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] bg-white/95 dark:bg-[#0D111E]/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          
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
                <h4 className="text-sm font-black tracking-wide leading-tight">Helpdesk BoraMarka</h4>
                <p className="text-[10px] text-white/80 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  SLA Ativo & Resposta Rápida
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
                    <p className="text-[11px] text-slate-400">Abra um chamado diretamente com nossa equipe técnica.</p>
                    <button
                      onClick={() => setViewMode('NEW')}
                      className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-pink-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Criar Primeiro Chamado
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tickets.map((ticket: SupportTicketItem) => (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setActiveTicket(ticket)
                          setViewMode('CHAT')
                        }}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-slate-800 hover:border-pink-500/40 transition-all cursor-pointer shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                              #{ticket.id} • {ticket.category}
                            </span>
                            {ticket.priority === 'HIGH' && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                Alta
                              </span>
                            )}
                          </div>
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
                          {ticket.isOverdue && (
                            <span className="text-red-500 font-extrabold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> SLA Estourado
                            </span>
                          )}
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
                    <option value="DUVIDA" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Dúvida de Uso (SLA 48h)</option>
                    <option value="FINANCEIRO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Financeiro / Planos (Prioridade Alta 24h)</option>
                    <option value="TECNICO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Problema Técnico (Prioridade Alta 24h)</option>
                    <option value="SUGESTAO" className="bg-white text-slate-900 dark:bg-[#0D111E] dark:text-white">Sugestão de Melhoria (SLA 48h)</option>
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

                {/* Attachment options */}
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{attachmentName ? attachmentName.slice(0, 15) + '...' : 'Anexar Print'}</span>
                  </button>
                  {attachmentName && (
                    <button type="button" onClick={() => { setAttachmentUrl(''); setAttachmentName('') }} className="text-red-500 text-xs font-bold">Limpar</button>
                  )}
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
                  {messages.map((msg: SupportMessageItem) => {
                    const isUser = msg.senderRole === 'USER'
                    const isBot = msg.senderName.includes('IA') || msg.senderName.includes('Assistente')
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider px-1 mb-1">
                          {isBot && (
                            <span className="inline-flex items-center gap-1 text-pink-500 font-extrabold bg-pink-500/10 px-1.5 py-0.5 rounded-md">
                              <Bot className="w-3 h-3" /> IA
                            </span>
                          )}
                          <span>{msg.senderName} • {formatTime(msg.createdAt)}</span>
                        </div>
                        <div className={`p-3.5 rounded-2xl text-xs font-medium max-w-[88%] leading-relaxed shadow-sm whitespace-pre-line ${
                          isUser
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-[#1A2235] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                        }`}>
                          {msg.message}
                          {msg.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-white/20">
                              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold underline flex items-center gap-1">
                                <Paperclip className="w-3 h-3" /> {msg.attachmentName || 'Ver anexo'}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Send Input Form */}
                {activeTicket.status === 'RESOLVED' ? (
                  <div className="p-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                     Este chamado foi marcado como concluído.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-2 shrink-0 pt-2 border-t border-slate-200 dark:border-slate-800">
                    {/* Quick Template Selector */}
                    {templates.length > 0 && (
                      <select
                        onChange={e => {
                          if (e.target.value) setChatInput(e.target.value)
                        }}
                        className="w-full text-[11px] font-medium bg-slate-50 dark:bg-[#131826] border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1"
                      >
                        <option value="">Respostas Rápidas de Exemplo...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.content}>{t.title}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-2">
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
                    </div>
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
