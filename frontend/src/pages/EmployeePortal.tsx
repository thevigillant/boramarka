import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Clock,
  FileText,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  Download,
  LogOut,
  Sparkles,
  ShieldCheck,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  FileX,
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
  Check,
  Lock,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function EmployeePortal() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const navigate = useNavigate();

  // State
  const [token, setToken] = useState<string | null>(localStorage.getItem('portal_token') || tokenParam || null);
  const [employee, setEmployee] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Active Tab: 'announcements' | 'ponto' | 'holerites' | 'documents' | 'vacations' | 'profile'
  const [activeTab, setActiveTab] = useState<'announcements' | 'ponto' | 'holerites' | 'documents' | 'vacations' | 'profile'>('announcements');

  // Tab Data
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [timeRegistersData, setTimeRegistersData] = useState<{ timeRegisters: any[]; summary: any } | null>(null);
  const [paystubs, setPaystubs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);

  // Modals & Forms
  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [vacationForm, setVacationForm] = useState({ type: 'VACATION', startDate: '', endDate: '', reason: '' });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', email: '', address: '' });

  const [rejectModalDocId, setRejectModalDocId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Toast Helper
  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Login Handler
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.portalLogin({
        token: tokenParam || undefined,
        login: loginInput || undefined,
        password: passwordInput || undefined,
      });

      localStorage.setItem('portal_token', res.token);
      setToken(res.token);
      setEmployee(res.employee);
      showNotification(`Bem-vindo ao Portal, ${res.employee.name}!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-login with URL token if present
  useEffect(() => {
    if (tokenParam && !employee) {
      handleLogin();
    }
  }, [tokenParam]);

  // Fetch Portal Me & Data
  const fetchPortalData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const empData = await api.getPortalMe();
      setEmployee(empData);

      const [annData, timeData, payData, docData, vacData] = await Promise.all([
        api.getPortalAnnouncements().catch(() => []),
        api.getPortalTimeRegisters().catch(() => null),
        api.getPortalPaystubs().catch(() => []),
        api.getPortalDocuments().catch(() => []),
        api.getPortalVacations().catch(() => []),
      ]);

      setAnnouncements(annData || []);
      setTimeRegistersData(timeData);
      setPaystubs(payData || []);
      setDocuments(docData || []);
      setVacations(vacData || []);
    } catch (err: any) {
      if (err.message?.includes('expirada') || err.message?.includes('401')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    setToken(null);
    setEmployee(null);
  };

  // 1. Batida de Ponto Direta
  const handlePunchTime = async () => {
    setLoading(true);
    try {
      const res = await api.punchPortalTimeRegister();
      showNotification(res.message);
      fetchPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao registrar ponto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Assinar Holerite Eletronicamente
  const handleSignPaystub = async (id: number) => {
    if (!window.confirm('Confirma a assinatura eletrônica deste holerite? Seu IP e timestamp serão registrados.')) return;
    try {
      const res = await api.signPortalPaystub(id);
      showNotification(res.message);
      fetchPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao assinar holerite.', 'error');
    }
  };

  // 3. Assinar ou Recusar Documento
  const handleSignDocument = async (id: number, action: 'SIGN' | 'REJECT') => {
    if (action === 'SIGN' && !window.confirm('Confirma a assinatura eletrônica deste documento?')) return;
    try {
      const res = await api.signPortalDocument(id, action, action === 'REJECT' ? rejectionReason : undefined);
      showNotification(res.message);
      setRejectModalDocId(null);
      setRejectionReason('');
      fetchPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao processar documento.', 'error');
    }
  };

  // 4. Solicitar Férias
  const handleRequestVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationForm.startDate || !vacationForm.endDate) {
      showNotification('Preencha as datas de início e fim.', 'error');
      return;
    }
    try {
      const res = await api.requestPortalVacation(vacationForm);
      showNotification(res.message);
      setVacationModalOpen(false);
      setVacationForm({ type: 'VACATION', startDate: '', endDate: '', reason: '' });
      fetchPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao solicitar férias.', 'error');
    }
  };

  // 5. Solicitar Alteração Cadastral
  const handleRequestProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.requestPortalProfileUpdate(profileForm);
      showNotification(res.message);
      setProfileModalOpen(false);
      setProfileForm({ phone: '', email: '', address: '' });
      fetchPortalData();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao enviar solicitação.', 'error');
    }
  };

  // UNAUTHENTICATED LOGIN SCREEN
  if (!token || !employee) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />

        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Portal do Funcionário</h1>
            <p className="text-xs text-slate-400 font-medium">Acesse holerites, registros de ponto, documentos e solicitações</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">CPF, E-mail ou Nome</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Digite seu CPF ou E-mail"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Entrar no Portal <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500">
              Esqueceu sua senha? Entre em contato com a equipe de **Recursos Humanos (RH)** para redefinir.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MAIN EMPLOYEE PORTAL APP VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {employee.admin?.photoUrl ? (
              <img src={employee.admin.photoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                <Building className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-black text-white leading-tight">{employee.name}</h2>
              <p className="text-[11px] text-slate-400 font-semibold">{employee.role} • {employee.admin?.businessName || 'BoraMarka Enterprise'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePunchTime}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Clock className="w-3.5 h-3.5" /> Bater Ponto
            </button>
            <button
              onClick={handleLogout}
              title="Sair do Portal"
              className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD METRICS SUMMARY */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Horas Trabalhadas</span>
              <Clock className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xl font-black text-white">{timeRegistersData?.summary?.totalWorkedHours || 0}h</p>
            <p className="text-[10px] text-slate-500">Neste mês</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Holerites a Assinar</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-black text-white">
              {paystubs.filter((p) => !p.signed).length}
            </p>
            <p className="text-[10px] text-amber-400 font-bold">Pendentes</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Documentos</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-white">{documents.length}</p>
            <p className="text-[10px] text-slate-500">Cadastrados no RH</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider">Férias & Licenças</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white">{vacations.length}</p>
            <p className="text-[10px] text-slate-500">Solicitações registradas</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
          {[
            { id: 'announcements', label: 'Mural & Comunicados', icon: Bell, badge: announcements.length },
            { id: 'ponto', label: 'Ponto & Jornada', icon: Clock },
            { id: 'holerites', label: 'Holerites', icon: FileText, badge: paystubs.filter((p) => !p.signed).length },
            { id: 'documents', label: 'Documentos & Contratos', icon: ShieldCheck },
            { id: 'vacations', label: 'Férias & Solicitacões', icon: Calendar },
            { id: 'profile', label: 'Meu Cadastral', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MURAL DE COMUNICADOS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" /> Comunicados & Avisos do RH
            </h3>
            {announcements.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
                Nenhum comunicado no mural no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {announcements.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] font-black rounded-lg uppercase">
                        {item.priority || 'COMUNICADO'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white">{item.title}</h4>
                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PONTO & JORNADA */}
        {activeTab === 'ponto' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" /> Espelho de Ponto & Registros
              </h3>
              <button
                onClick={handlePunchTime}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Clock className="w-4 h-4" /> Bater Ponto Agora
              </button>
            </div>

            {timeRegistersData?.timeRegisters?.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
                Nenhum registro de ponto lançado recentemente.
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 font-black uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Data</th>
                        <th className="p-3">Entrada 1</th>
                        <th className="p-3">Saída 1</th>
                        <th className="p-3">Entrada 2</th>
                        <th className="p-3">Saída 2</th>
                        <th className="p-3">Horas Extras</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200 font-semibold">
                      {timeRegistersData?.timeRegisters?.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{tr.date}</td>
                          <td className="p-3">{tr.entry1 || '--:--'}</td>
                          <td className="p-3">{tr.exit1 || '--:--'}</td>
                          <td className="p-3">{tr.entry2 || '--:--'}</td>
                          <td className="p-3">{tr.exit2 || '--:--'}</td>
                          <td className="p-3 text-emerald-400 font-bold">{tr.extraHours > 0 ? `+${tr.extraHours}h` : '-'}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-md">
                              {tr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HOLERITES & ASSINATURA */}
        {activeTab === 'holerites' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Holerites & Recibos de Pagamento
            </h3>

            {paystubs.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
                Nenhum holerite disponível para visualização.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paystubs.map((stub) => (
                  <div key={stub.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Holerite Mensal</span>
                        <h4 className="text-base font-black text-white">Mês de Referência: {stub.referenceMonth}</h4>
                      </div>
                      {stub.signed ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Assinado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Assinatura Pendente
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Salário Líquido</span>
                        <span className="text-sm font-black text-emerald-400">R$ {stub.netSalary.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Descontos</span>
                        <span className="text-sm font-black text-red-400">R$ {stub.discounts.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {stub.fileUrl && (
                        <a
                          href={stub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" /> Baixar PDF
                        </a>
                      )}
                      {!stub.signed && (
                        <button
                          onClick={() => handleSignPaystub(stub.id)}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <FileCheck className="w-4 h-4" /> Assinar Eletronicamente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTOS & CONTRATOS */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Documentos, Contratos & Advertências
            </h3>

            {documents.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
                Nenhum documento disponível no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">{doc.category || 'DOCUMENTO'}</span>
                        <h4 className="text-base font-black text-white">{doc.title}</h4>
                      </div>
                      {doc.signed || doc.signatureStatus === 'SIGNED' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-lg">
                          Assinado
                        </span>
                      ) : doc.signatureStatus === 'REJECTED' ? (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black rounded-lg">
                          Recusado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg">
                          Pendente
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> Visualizar Documento
                      </a>
                      {doc.requiresSignature && !doc.signed && doc.signatureStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleSignDocument(doc.id, 'SIGN')}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <FileCheck className="w-4 h-4" /> Assinar Digitalmente
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: FÉRIAS & LICENÇAS */}
        {activeTab === 'vacations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" /> Solicitações de Férias & Afastamentos
              </h3>
              <button
                onClick={() => setVacationModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" /> Solicitar Férias
              </button>
            </div>

            {vacations.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs font-semibold">
                Nenhuma solicitação de férias registrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vacations.map((v) => (
                  <div key={v.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400">{v.type === 'VACATION' ? 'Férias Regulamentares' : 'Afastamento / Licença'}</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                          v.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : v.status === 'REJECTED'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {v.status === 'APPROVED' ? 'Aprovado' : v.status === 'REJECTED' ? 'Rejeitado' : 'Aguardando Aprovação RH'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-white">
                      <span>Início: {v.startDate}</span>
                      <span>Fim: {v.endDate}</span>
                      <span className="text-violet-400">({v.daysCount} dias)</span>
                    </div>

                    {v.reason && <p className="text-xs text-slate-400 leading-relaxed font-medium">Motivo: {v.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MEU PERFIL & DADOS */}
        {activeTab === 'profile' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-violet-400" /> Meus Dados Cadastrais
              </h3>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2"
              >
                Solicitar Atualização de Dados
              </button>
            </div>

            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Nome Completo</span>
                  <span className="font-black text-white">{employee.name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cargo</span>
                  <span className="font-black text-white">{employee.role}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">CPF</span>
                  <span className="font-black text-slate-300">{employee.cpf || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">RG</span>
                  <span className="font-black text-slate-300">{employee.rg || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Telefone</span>
                  <span className="font-black text-slate-300">{employee.phone || 'Não informado'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">E-mail</span>
                  <span className="font-black text-slate-300">{employee.email || 'Não informado'}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Endereço Residencial</span>
                  <span className="font-black text-slate-300">{employee.address || 'Não informado'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL SOLICITAR FÉRIAS */}
      {vacationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" /> Nova Solicitação de Férias
            </h3>

            <form onSubmit={handleRequestVacation} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Afastamento</label>
                <select
                  value={vacationForm.type}
                  onChange={(e) => setVacationForm({ ...vacationForm, type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-white"
                >
                  <option value="VACATION">Férias Regulamentares</option>
                  <option value="MEDICAL_LEAVE">Licença Médica / Atestado</option>
                  <option value="MATERNITY">Licença Maternidade/Paternidade</option>
                  <option value="OTHER">Outros Motivos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={vacationForm.startDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={vacationForm.endDate}
                    onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Motivo / Observações</label>
                <textarea
                  rows={3}
                  value={vacationForm.reason}
                  onChange={(e) => setVacationForm({ ...vacationForm, reason: e.target.value })}
                  placeholder="Escreva alguma observação para o RH..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white placeholder:text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVacationModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs"
                >
                  Enviar ao RH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SOLICITAR ALTERAÇÃO CADASTRAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <User className="w-5 h-5 text-violet-400" /> Solicitar Alteração Cadastral
            </h3>

            <form onSubmit={handleRequestProfileUpdate} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Novo Telefone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder={employee.phone || 'Digite o novo telefone'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Novo E-mail</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder={employee.email || 'Digite o novo e-mail'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Novo Endereço Residencial</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder={employee.address || 'Digite o endereço completo'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-xs"
                >
                  Enviar ao RH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
