import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Phone, Mail, User, Tag, FileText, Send, Mic, Square,
  Paperclip, Image as ImageIcon, File, Sparkles, CheckCheck, Check,
  Clock, X, Edit3, Trash2, ChevronRight, Play, Pause, Download,
  Volume2, FastForward, MessageSquare, Filter, UserCheck, ShieldAlert,
  Bot, RefreshCw, Zap
} from 'lucide-react';
import {
  api,
  CustomerContactItem,
  ClientChatMessageItem,
  QuickReplyTemplateItem,
} from '../services/api';

interface CRMChatProps {
  onShowToast?: (msg: string, type: 'success' | 'error') => void;
}

export function CRMChat({ onShowToast }: CRMChatProps) {
  // Contacts & Chat State
  const [contacts, setContacts] = useState<CustomerContactItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<CustomerContactItem | null>(null);
  const [messages, setMessages] = useState<ClientChatMessageItem[]>([]);
  const [templates, setTemplates] = useState<QuickReplyTemplateItem[]>([]);
  
  // UI & Loading States
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('TODOS');
  const [showCRMDrawer, setShowCRMDrawer] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState<string | null>(null);
  const [showQuickReplyPopover, setShowQuickReplyPopover] = useState(false);

  // Message Form State
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Media Recording State
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioElementsRef = useRef<{ [key: number]: HTMLAudioElement }>({});

  // Forms State
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'NOVO',
    notes: '',
    tagsStr: 'VIP, Novo Cliente',
  });

  const [templateForm, setTemplateForm] = useState({
    shortcut: '',
    title: '',
    content: '',
    category: 'GERAL',
  });
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  // ═══════════════════════════════════════════════════════════
  // Initial Data Fetching
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    fetchContacts();
    fetchTemplates();
  }, [selectedStatusFilter]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const data = await api.getCrmContacts({
        q: searchQuery,
        status: selectedStatusFilter,
      });
      setContacts(data);
      if (data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao carregar contatos', 'error');
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (contactId: number) => {
    setLoadingMessages(true);
    try {
      const data = await api.getCrmMessages(contactId);
      setMessages(data);
      // Update contact unread count locally
      setContacts(prev =>
        prev.map(c => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao carregar histórico de mensagens', 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.getCrmTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Erro ao carregar templates:', err);
    }
  };

  // Search filter
  const filteredContacts = contacts.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // ═══════════════════════════════════════════════════════════
  // Message Sending Handlers
  // ═══════════════════════════════════════════════════════════
  const handleSendMessage = async (
    type: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' = 'TEXT',
    mediaData?: { mediaUrl: string; mediaName?: string; mediaDuration?: number }
  ) => {
    if (!selectedContact) return;

    if (type === 'TEXT' && !textInput.trim()) return;

    setSending(true);
    try {
      const newMsg = await api.sendCrmMessage(selectedContact.id, {
        content: type === 'TEXT' ? textInput.trim() : (mediaData?.mediaName || type),
        messageType: type,
        mediaUrl: mediaData?.mediaUrl || '',
        mediaName: mediaData?.mediaName || '',
        mediaDuration: mediaData?.mediaDuration || 0,
      });

      setMessages(prev => [...prev, newMsg]);
      setTextInput('');
      setShowQuickReplyPopover(false);

      // If a WhatsApp link was generated (wa.me fallback when Cloud API is not set), open WhatsApp Web!
      if (newMsg.whatsappLink) {
        window.open(newMsg.whatsappLink, '_blank');
        onShowToast?.('Mensagem salva! Abrindo conversa no WhatsApp Web...', 'success');
      } else if (newMsg.whatsappMethod === 'api') {
        onShowToast?.('Mensagem enviada automaticamente para o WhatsApp via API Meta!', 'success');
      }

      // Update last interaction in contacts list
      setContacts(prev =>
        prev.map(c =>
          c.id === selectedContact.id
            ? { ...c, lastInteraction: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao enviar mensagem', 'error');
    } finally {
      setSending(false);
    }
  };

  // Simulate client reply
  const handleSimulateReply = async (type: 'TEXT' | 'AUDIO' | 'IMAGE' = 'TEXT') => {
    if (!selectedContact) return;
    setSimulating(true);

    let content = 'Perfeito! Muito obrigado pela atenção e pelo excelente suporte!';
    let mediaUrl = '';
    let mediaDuration = 0;

    if (type === 'AUDIO') {
      content = 'Áudio enviado pelo cliente';
      mediaDuration = 8;
      // Demo audio data
      mediaUrl = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//5AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    } else if (type === 'IMAGE') {
      content = 'Segue foto do comprovante de pagamento';
      mediaUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';
    }

    try {
      const replyMsg = await api.simulateClientReply(selectedContact.id, {
        content,
        messageType: type,
        mediaUrl,
        mediaDuration,
      });

      setMessages(prev => [...prev, replyMsg]);
      onShowToast?.(`Resposta simulada de ${selectedContact.name} recebida!`, 'success');
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao simular resposta', 'error');
    } finally {
      setSimulating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // Audio Recording (Browser MediaRecorder)
  // ═══════════════════════════════════════════════════════════
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await handleSendMessage('AUDIO', {
            mediaUrl: base64Audio,
            mediaName: 'Voz_Gravada.webm',
            mediaDuration: recordingTime || 5,
          });
        };
        // Stop stream tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      // Fallback: If microphone access denied or not supported in environment
      console.warn('Microfone não disponível, gerando gravação simulada...');
      setIsRecordingAudio(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopAndSendAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Simulated audio sending fallback
      const duration = recordingTime || 6;
      handleSendMessage('AUDIO', {
        mediaUrl: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//5AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        mediaName: 'Áudio_Voz.mp3',
        mediaDuration: duration,
      });
    }
    setRecordingTime(0);
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    setRecordingTime(0);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
  };

  // ═══════════════════════════════════════════════════════════
  // File Upload Handlers (Images & Documents)
  // ═══════════════════════════════════════════════════════════
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleSendMessage(isImage ? 'IMAGE' : 'DOCUMENT', {
        mediaUrl: base64,
        mediaName: file.name,
      });
    };
  };

  // Audio Playback Handler
  const toggleAudioPlayback = (msgId: number, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioElementsRef.current[msgId]?.pause();
      setPlayingAudioId(null);
      return;
    }

    // Stop current audio if playing
    if (playingAudioId && audioElementsRef.current[playingAudioId]) {
      audioElementsRef.current[playingAudioId].pause();
    }

    if (!audioElementsRef.current[msgId]) {
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackRate;
      audio.onended = () => setPlayingAudioId(null);
      audioElementsRef.current[msgId] = audio;
    } else {
      audioElementsRef.current[msgId].playbackRate = playbackRate;
    }

    audioElementsRef.current[msgId].play();
    setPlayingAudioId(msgId);
  };

  // ═══════════════════════════════════════════════════════════
  // Contact & Template Modals Handlers
  // ═══════════════════════════════════════════════════════════
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = contactForm.tagsStr
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (selectedContact && showCRMDrawer) {
        // Edit contact
        const updated = await api.updateCrmContact(selectedContact.id, {
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email,
          status: contactForm.status,
          notes: contactForm.notes,
          tags: tagsArray,
        });
        setSelectedContact(updated);
        setContacts(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        onShowToast?.('Contato atualizado com sucesso!', 'success');
      } else {
        // New contact
        const created = await api.createCrmContact({
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email,
          status: contactForm.status,
          notes: contactForm.notes,
          tags: tagsArray,
        });
        setContacts(prev => [created, ...prev]);
        setSelectedContact(created);
        setShowNewContactModal(false);
        onShowToast?.('Contato cadastrado com sucesso!', 'success');
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao salvar contato', 'error');
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplateId) {
        const updated = await api.updateCrmTemplate(editingTemplateId, templateForm);
        setTemplates(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        onShowToast?.('Modelo atualizado com sucesso!', 'success');
      } else {
        const created = await api.createCrmTemplate(templateForm);
        setTemplates(prev => [...prev, created]);
        onShowToast?.('Modelo cadastrado com sucesso!', 'success');
      }
      setTemplateForm({ shortcut: '', title: '', content: '', category: 'GERAL' });
      setEditingTemplateId(null);
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao salvar modelo', 'error');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este modelo?')) return;
    try {
      await api.deleteCrmTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      onShowToast?.('Modelo excluído!', 'success');
    } catch (err: any) {
      onShowToast?.(err.message || 'Erro ao excluir modelo', 'error');
    }
  };

  const handleSelectTemplate = (tmpl: QuickReplyTemplateItem) => {
    if (!selectedContact) return;
    let content = tmpl.content.replace('{nome}', selectedContact.name);
    setTextInput(content);
    setShowQuickReplyPopover(false);
  };

  // Helper badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'VIP':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'EM_ATENDIMENTO':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'CONCLUIDO':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT SIDEBAR — CONTACTS LIST */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="w-80 sm:w-96 border-r border-slate-800 flex flex-col bg-slate-950/60 shrink-0">
        
        {/* Header & Actions */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Central de Atendimento
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowTemplateModal(true)}
                title="Modelos de Respostas Rápidas"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={() => {
                  setContactForm({ name: '', phone: '', email: '', status: 'NOVO', notes: '', tagsStr: 'VIP' });
                  setShowNewContactModal(true);
                }}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Contato
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar cliente, número ou nota..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['TODOS', 'NOVO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'VIP'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Contacts Feed List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {loadingContacts ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              Carregando contatos...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum contato encontrado.
            </div>
          ) : (
            filteredContacts.map(c => {
              const isSelected = selectedContact?.id === c.id;
              const lastMsg = c.messages?.[0];
              const parsedTags: string[] = JSON.parse(c.tags || '[]');

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-800/40 ${
                    isSelected ? 'bg-slate-800/80 border-l-4 border-emerald-400' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-black text-white truncate">{c.name}</h4>
                      <span className="text-[9px] font-semibold text-slate-500">
                        {new Date(c.lastInteraction).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mb-1">
                      {lastMsg ? (
                        lastMsg.messageType === 'AUDIO' ? 'Áudio de voz' :
                        lastMsg.messageType === 'IMAGE' ? 'Foto recebida' :
                        lastMsg.messageType === 'DOCUMENT' ? 'Documento em anexo' :
                        lastMsg.content
                      ) : (
                        c.phone
                      )}
                    </p>

                    {/* Status & Tags */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${getStatusBadgeClass(c.status)}`}>
                        {c.status.replace('_', ' ')}
                      </span>

                      {c.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white font-black text-[9px] flex items-center justify-center animate-pulse">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CENTER CHAT ROOM */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedContact ? (
        <div className="flex-1 flex flex-col bg-slate-900 relative min-w-0">
          
          {/* Active Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                {selectedContact.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  {selectedContact.name}
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border uppercase ${getStatusBadgeClass(selectedContact.status)}`}>
                    {selectedContact.status.replace('_', ' ')}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">{selectedContact.phone}</p>
              </div>
            </div>

            {/* Actions: Direct WhatsApp link, Simulator & CRM Panel */}
            <div className="flex items-center gap-2">
              {/* Direct WhatsApp wa.me Button */}
              <button
                onClick={() => {
                  const clean = selectedContact.phone.replace(/\D/g, '');
                  const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
                  const waUrl = `https://wa.me/${fullPhone}`;
                  window.open(waUrl, '_blank');
                  onShowToast?.(`Abrindo WhatsApp para ${selectedContact.name}...`, 'success');
                }}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                title="Abrir conversa diretamente no WhatsApp Web do cliente"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp Real</span>
              </button>

              {/* Simulator Dropdown Button */}
              <div className="relative group">
                <button
                  disabled={simulating}
                  className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-4 h-4 text-emerald-300" />
                  Simular Cliente
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-slate-850 border border-slate-750 rounded-xl p-1.5 shadow-2xl z-30 w-44">
                  <button
                    onClick={() => handleSimulateReply('TEXT')}
                    className="p-2 hover:bg-slate-700 text-left text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    Texto do cliente
                  </button>
                  <button
                    onClick={() => handleSimulateReply('AUDIO')}
                    className="p-2 hover:bg-slate-700 text-left text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    Áudio do cliente
                  </button>
                  <button
                    onClick={() => handleSimulateReply('IMAGE')}
                    className="p-2 hover:bg-slate-700 text-left text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    Foto do cliente
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setContactForm({
                    name: selectedContact.name,
                    phone: selectedContact.phone,
                    email: selectedContact.email || '',
                    status: selectedContact.status,
                    notes: selectedContact.notes || '',
                    tagsStr: JSON.parse(selectedContact.tags || '[]').join(', '),
                  });
                  setShowCRMDrawer(!showCRMDrawer);
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showCRMDrawer ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Abrir Perfil CRM do Cliente"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
            {loadingMessages ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                Carregando conversa...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma mensagem gravada. Digite uma mensagem ou use o microfone para iniciar a conversa!
              </div>
            ) : (
              messages.map(m => {
                const isStaff = m.senderType === 'STAFF';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] ${
                      isStaff ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-slate-500 mb-1 px-1">
                      {m.senderName} • {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-lg relative break-words ${
                        isStaff
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 border border-slate-700/60 rounded-tl-none'
                      }`}
                    >
                      {/* TEXT MESSAGE */}
                      {m.messageType === 'TEXT' && (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}

                      {/* AUDIO MESSAGE */}
                      {m.messageType === 'AUDIO' && (
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <button
                            onClick={() => toggleAudioPlayback(m.id, m.mediaUrl)}
                            className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer shrink-0"
                          >
                            {playingAudioId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                          </button>

                          <div className="flex-1">
                            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden mb-1">
                              <div
                                className={`h-full ${playingAudioId === m.id ? 'bg-white animate-pulse' : 'bg-white/60'}`}
                                style={{ width: playingAudioId === m.id ? '60%' : '100%' }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold opacity-80">
                              <span>00:{String(m.mediaDuration || 8).padStart(2, '0')}</span>
                              <span className="uppercase">Voz</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* IMAGE MESSAGE */}
                      {m.messageType === 'IMAGE' && (
                        <div className="space-y-1.5">
                          <img
                            src={m.mediaUrl}
                            alt="Foto enviada"
                            onClick={() => setShowImageZoom(m.mediaUrl)}
                            className="rounded-xl max-h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                          />
                          {m.content && <p className="text-[11px]">{m.content}</p>}
                        </div>
                      )}

                      {/* DOCUMENT MESSAGE */}
                      {m.messageType === 'DOCUMENT' && (
                        <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-xl border border-white/10">
                          <FileText className="w-7 h-7 text-emerald-300 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{m.mediaName || 'Documento.pdf'}</p>
                            <span className="text-[9px] opacity-75">Documento Anexo</span>
                          </div>
                          {m.mediaUrl && (
                            <a
                              href={m.mediaUrl}
                              download={m.mediaName || 'Documento'}
                              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Read status & WhatsApp send trigger */}
                      {isStaff && (
                        <div className="flex items-center gap-1.5 justify-end mt-1 opacity-75">
                          {m.content && (
                            <button
                              onClick={() => {
                                const clean = selectedContact.phone.replace(/\D/g, '');
                                const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
                                const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(m.content)}`;
                                window.open(waUrl, '_blank');
                              }}
                              className="text-[9px] hover:underline flex items-center gap-0.5 text-emerald-200"
                              title="Abrir esta mensagem diretamente no WhatsApp do cliente"
                            >
                              WhatsApp
                            </button>
                          )}
                          <CheckCheck className="w-3 h-3 inline" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md relative">
            
            {/* Quick Replies Popover Modal */}
            {showQuickReplyPopover && (
              <div className="absolute bottom-full left-4 mb-2 bg-slate-850 border border-slate-750 rounded-2xl p-2 shadow-2xl z-40 max-w-sm w-full animate-slide-up max-h-60 overflow-y-auto">
                <div className="flex items-center justify-between p-2 border-b border-slate-750">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Respostas Rápidas (Atalho /)
                  </span>
                  <button onClick={() => setShowQuickReplyPopover(false)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className="w-full p-2.5 text-left hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-black text-amber-400">{tmpl.shortcut}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{tmpl.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium line-clamp-1">{tmpl.content}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AUDIO RECORDING ACTIVE BAR */}
            {isRecordingAudio ? (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-2.5 rounded-2xl animate-pulse">
                <div className="flex items-center gap-3 text-red-400 font-bold text-xs">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  Gravando áudio... 00:{String(recordingTime).padStart(2, '0')}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelAudioRecording}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={stopAndSendAudioRecording}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all flex items-center gap-1 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Áudio
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD INPUT BAR */
              <div className="flex items-center gap-2">
                {/* Quick replies trigger button */}
                <button
                  onClick={() => setShowQuickReplyPopover(!showQuickReplyPopover)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                  title="Inserir modelo de resposta rápida (/)"
                >
                  <Zap className="w-4 h-4" />
                </button>

                {/* Attachments buttons */}
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={e => handleFileUpload(e, true)}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => handleFileUpload(e, false)}
                  className="hidden"
                />

                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Enviar Foto / Imagem"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Enviar Documento / Anexo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Main Text Input */}
                <input
                  type="text"
                  placeholder="Digite uma mensagem ou digite / para atalhos..."
                  value={textInput}
                  onChange={e => {
                    setTextInput(e.target.value);
                    if (e.target.value.startsWith('/')) {
                      setShowQuickReplyPopover(true);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage('TEXT');
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                />

                {/* Microphone Record Button */}
                <button
                  onClick={startAudioRecording}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                  title="Gravar Mensagem de Voz"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send Text Button */}
                <button
                  onClick={() => handleSendMessage('TEXT')}
                  disabled={sending || !textInput.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
          <MessageSquare className="w-16 h-16 text-slate-700 mb-4" />
          <h3 className="text-lg font-black text-white mb-2">Central de Atendimento Interativa</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Selecione um contato na lista lateral para iniciar o atendimento, enviar áudios, anexar documentos ou responder rapidamente com modelos!
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT SIDEBAR — CRM CONTACT DETAILS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showCRMDrawer && selectedContact && (
        <div className="w-80 border-l border-slate-800 bg-slate-950 p-5 overflow-y-auto space-y-5 shrink-0 animate-slide-left">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Perfil CRM do Cliente
            </h3>
            <button onClick={() => setShowCRMDrawer(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status do Atendimento</label>
              <select
                value={contactForm.status}
                onChange={e => setContactForm({ ...contactForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="NOVO">Novo Cliente</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="VIP">Cliente VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                placeholder="VIP, Corte, Sábado"
                value={contactForm.tagsStr}
                onChange={e => setContactForm({ ...contactForm, tagsStr: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Notas Internas & Preferências</label>
              <textarea
                rows={4}
                placeholder="Ex: Prefere atendimento aos sábados, gosta de café sem açúcar..."
                value={contactForm.notes}
                onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              Salvar Alterações CRM
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: NOVO CONTATO */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Cadastrar Novo Contato
              </h3>
              <button onClick={() => setShowNewContactModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Souza"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={contactForm.phone}
                  onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status Inicial</label>
                <select
                  value={contactForm.status}
                  onChange={e => setContactForm({ ...contactForm, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="NOVO">Novo Cliente</option>
                  <option value="EM_ATENDIMENTO">Em Atendimento</option>
                  <option value="VIP">Cliente VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tags (Vírgula)</label>
                <input
                  type="text"
                  placeholder="VIP, Corte"
                  value={contactForm.tagsStr}
                  onChange={e => setContactForm({ ...contactForm, tagsStr: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  Criar Contato
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-[11px] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: MODELOS DE RESPOSTAS RÁPIDAS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Modelos de Respostas Rápidas (Templates)
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 overflow-y-auto min-h-0">
              {/* Form Create/Edit */}
              <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-black text-white text-xs mb-2">
                  {editingTemplateId ? 'Editar Modelo' : 'Cadastrar Novo Modelo'}
                </h4>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Atalho (/nome) *</label>
                  <input
                    type="text"
                    required
                    placeholder="/boas-vindas"
                    value={templateForm.shortcut}
                    onChange={e => setTemplateForm({ ...templateForm, shortcut: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Título do Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mensagem de Boas-vindas"
                    value={templateForm.title}
                    onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Conteúdo da Mensagem *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Olá {nome}, como podemos te ajudar?"
                    value={templateForm.content}
                    onChange={e => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <span className="text-[9px] text-slate-500 font-semibold mt-1 block">
                    Dica: use <span className="text-amber-400 font-bold font-mono">&#123;nome&#125;</span> para inserir o nome do cliente automaticamente.
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider text-[10px] shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {editingTemplateId ? 'Salvar Modelo' : 'Cadastrar Modelo'}
                  </button>
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTemplateForm({ shortcut: '', title: '', content: '', category: 'GERAL' });
                      }}
                      className="px-3 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-[10px]"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* Templates List */}
              <div className="space-y-2 overflow-y-auto pr-1">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 font-mono">{tmpl.shortcut}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTemplateId(tmpl.id);
                            setTemplateForm({
                              shortcut: tmpl.shortcut,
                              title: tmpl.title,
                              content: tmpl.content,
                              category: tmpl.category,
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(tmpl.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h5 className="text-xs font-bold text-white">{tmpl.title}</h5>
                    <p className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-xl border border-slate-800 font-medium">
                      {tmpl.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: IMAGE ZOOM LIGHTBOX */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showImageZoom && (
        <div
          onClick={() => setShowImageZoom(null)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={showImageZoom} alt="Zoom" className="max-w-4xl max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

    </div>
  );
}
