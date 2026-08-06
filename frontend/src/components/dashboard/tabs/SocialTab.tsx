import { Search, Loader2, Globe, MapPin, ExternalLink, MessageCircle, X } from 'lucide-react'

interface SocialTabProps {
  socialSearch: string
  setSocialSearch: (val: string) => void
  loadingExplore: boolean
  exploreList: any[]
  activeChatPartner: any
  setActiveChatPartner: (partner: any) => void
  setChatMessages: (msgs: any[]) => void
  chatMessages: any[]
  loadInboxList: () => void
  handleSendChatMessage: (e: any) => void
  newMessage: string
  setNewMessage: (msg: string) => void
  inboxList: any[]
}

export function SocialTab({
  socialSearch,
  setSocialSearch,
  loadingExplore,
  exploreList,
  activeChatPartner,
  setActiveChatPartner,
  setChatMessages,
  chatMessages,
  loadInboxList,
  handleSendChatMessage,
  newMessage,
  setNewMessage,
  inboxList,
}: SocialTabProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Rede de Profissionais</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Descubra novos parceiros, faça networking e troque parcerias no BoraMarka.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Explorer Directory (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 bg-white dark:bg-[#131826] p-3 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={socialSearch}
              onChange={e => setSocialSearch(e.target.value)}
              placeholder="Buscar profissionais por especialidade, cidade, nome..."
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 font-bold"
            />
          </div>

          {loadingExplore ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white dark:bg-[#131826] rounded-3xl border border-slate-150 dark:border-slate-800">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              <p className="text-xs font-bold text-slate-400">Vasculhando a rede de profissionais...</p>
            </div>
          ) : exploreList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#131826] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <Globe className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Nenhum profissional encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exploreList.map(prof => (
                <div key={prof.id} className="bg-white dark:bg-[#131826] p-5 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-205 dark:hover:border-slate-700 transition-all group">
                  <div>
                    <div className="flex gap-4 items-start">
                      {prof.photoUrl ? (
                        <img src={prof.photoUrl} alt={prof.businessName} className="w-14 h-14 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800" />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-xl shrink-0">
                          {prof.businessName?.[0]?.toUpperCase() || prof.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="space-y-1 text-left min-w-0">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate leading-tight group-hover:text-pink-500 transition-colors">
                          {prof.businessName || prof.username}
                        </h4>
                        <p className="text-[10px] text-pink-500 font-black tracking-widest uppercase">@{prof.username.toLowerCase()}</p>
                        {prof.address && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" /> {prof.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 leading-relaxed line-clamp-3 text-left">
                      {prof.description || 'Nenhuma biografia informada ainda.'}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <a
                      href={`/p/${prof.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 text-center bg-slate-50 dark:bg-[#0f131f] hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-black text-[10px] rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Página
                    </a>
                    <button
                      onClick={() => {
                        setActiveChatPartner(prof)
                        setChatMessages([])
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-black text-[10px] rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-pink-500/10"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Chat / Inbox (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131826] rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px]">
          {activeChatPartner ? (
            // Chat Box
            <div className="flex flex-col h-full justify-between">
              {/* Header */}
              <div className="p-4 border-b border-slate-150 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-[#1A2235]/20">
                <div className="flex gap-3 items-center">
                  {activeChatPartner.photoUrl ? (
                    <img src={activeChatPartner.photoUrl} alt={activeChatPartner.businessName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {activeChatPartner.businessName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white leading-none">{activeChatPartner.businessName || activeChatPartner.username}</h4>
                    <span className="text-[9px] font-black text-slate-400 tracking-wider">Online no BoraMarka</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveChatPartner(null)
                    setChatMessages([])
                    loadInboxList()
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  title="Fechar Conversa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-end bg-slate-50/20 dark:bg-[#0f131f]/10">
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-center">
                      <p className="text-[10px] text-slate-400 font-semibold italic">Nenhuma mensagem nesta conversa. Diga olá e inicie seu networking!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isMe = msg.senderId !== activeChatPartner.id
                      const messageTime = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                            isMe 
                              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-tr-none' 
                              : 'bg-white dark:bg-[#1A2235] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/80'
                          } text-left`}>
                            <p className="font-semibold whitespace-pre-line break-words">{msg.content}</p>
                            <span className={`text-[8px] font-bold block mt-1.5 text-right ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                              {messageTime}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-150 dark:border-slate-800/80 flex gap-2 bg-white dark:bg-[#131826]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-pink-500 text-xs font-bold bg-slate-50 dark:bg-[#0f131f] text-slate-900 dark:text-white"
                  required
                />
                <button type="submit" className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all">
                  Enviar
                </button>
              </form>
            </div>
          ) : (
            // Inbox List
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2235]/20 flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Suas Conversas</span>
                <MessageCircle className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
                {inboxList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                    <MessageCircle className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                    <p className="text-xs font-bold">Nenhum chat ativo</p>
                    <p className="text-[10px] mt-1 font-semibold">Clique no botão "Chat" em um profissional ao lado para iniciar conversas!</p>
                  </div>
                ) : (
                  inboxList.map((item: any) => {
                    const conversationTime = new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    return (
                      <button
                        key={item.partner.id}
                        onClick={() => setActiveChatPartner(item.partner)}
                        className="w-full p-4 flex gap-3 items-center hover:bg-slate-50 dark:hover:bg-[#1A2235]/30 text-left transition-colors"
                      >
                        {item.partner.photoUrl ? (
                          <img src={item.partner.photoUrl} alt={item.partner.businessName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-655 dark:text-slate-300 shrink-0 uppercase">
                            {item.partner.businessName?.[0] || item.partner.username?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.partner.businessName}</h5>
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">{conversationTime}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{item.lastMessage}</p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
