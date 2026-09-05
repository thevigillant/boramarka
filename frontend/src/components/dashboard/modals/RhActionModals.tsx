import React from 'react'
import { X, Link, Lock, FileText, Bell } from 'lucide-react'
import { api } from '../../../services/api'

interface RhActionModalsProps {
  portalLinkModal: { open: boolean; name: string; link: string } | null
  setPortalLinkModal: (val: any) => void
  employees: any[]
  showToast: (msg: string, type?: 'success' | 'error') => void

  rhPaystubModalOpen: boolean
  setRhPaystubModalOpen: (val: boolean) => void
  paystubForm: {
    employeeId: string
    referenceMonth: string
    grossSalary: string
    netSalary: string
    discounts: string
    fileUrl: string
    notes: string
  }
  setPaystubForm: React.Dispatch<React.SetStateAction<any>>
  fetchRhData: () => void

  rhAnnouncementModalOpen: boolean
  setRhAnnouncementModalOpen: (val: boolean) => void
  announcementForm: {
    title: string
    content: string
    targetGroup: string
    priority: string
  }
  setAnnouncementForm: React.Dispatch<React.SetStateAction<any>>
}

export const RhActionModals: React.FC<RhActionModalsProps> = ({
  portalLinkModal,
  setPortalLinkModal,
  employees,
  showToast,
  rhPaystubModalOpen,
  setRhPaystubModalOpen,
  paystubForm,
  setPaystubForm,
  fetchRhData,
  rhAnnouncementModalOpen,
  setRhAnnouncementModalOpen,
  announcementForm,
  setAnnouncementForm
}) => {
  return (
    <>
      {/* RH Modal: Link do Portal do Funcionário */}
      {portalLinkModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Link className="w-5 h-5 text-violet-400" /> Acesso ao Portal: {portalLinkModal.name}
              </h3>
              <button onClick={() => setPortalLinkModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-400">Link de Acesso Direto do Funcionário</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={portalLinkModal.link}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-violet-300 select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(portalLinkModal.link);
                    showToast('Link do portal copiado!');
                  }}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl shrink-0"
                >
                  Copiar Link
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400">Redefinir Senha de Acesso</label>
                <button
                  onClick={async () => {
                    const newPass = window.prompt('Digite a nova senha para este funcionário:');
                    if (newPass) {
                      const emp = employees.find(e => e.name === portalLinkModal.name);
                      if (emp) {
                        await api.resetEmployeePassword(emp.id, newPass);
                        showToast('Senha redefinida com sucesso!');
                      }
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" /> Definir Nova Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RH Modal: Lançar Holerite */}
      {rhPaystubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Lançar Novo Holerite
              </h3>
              <button onClick={() => setRhPaystubModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!paystubForm.employeeId || !paystubForm.referenceMonth) {
                  showToast('Selecione o colaborador e mês de referência.', 'error');
                  return;
                }
                try {
                  await api.createEmployeePaystub({
                    employeeId: parseInt(paystubForm.employeeId),
                    referenceMonth: paystubForm.referenceMonth,
                    grossSalary: parseFloat(paystubForm.grossSalary || '0'),
                    netSalary: parseFloat(paystubForm.netSalary || '0'),
                    discounts: parseFloat(paystubForm.discounts || '0'),
                    fileUrl: paystubForm.fileUrl || undefined,
                    notes: paystubForm.notes || undefined,
                  });
                  showToast('Holerite lançado com sucesso!');
                  setRhPaystubModalOpen(false);
                  setPaystubForm({ employeeId: '', referenceMonth: '', grossSalary: '', netSalary: '', discounts: '', fileUrl: '', notes: '' });
                  fetchRhData();
                } catch (err: any) {
                  showToast(err.message || 'Erro ao criar holerite.', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Colaborador</label>
                <select
                  value={paystubForm.employeeId}
                  onChange={(e) => setPaystubForm({ ...paystubForm, employeeId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  required
                >
                  <option value="">Selecione um funcionário</option>
                  {employees.filter(e => e.status === 'ACTIVE' || !e.status).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mês Ref. (Ex: 07/2026)</label>
                  <input
                    type="text"
                    value={paystubForm.referenceMonth}
                    onChange={(e) => setPaystubForm({ ...paystubForm, referenceMonth: e.target.value })}
                    placeholder="MM/AAAA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Salário Líquido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paystubForm.netSalary}
                    onChange={(e) => setPaystubForm({ ...paystubForm, netSalary: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Link / PDF do Holerite (Opcional)</label>
                <input
                  type="text"
                  value={paystubForm.fileUrl}
                  onChange={(e) => setPaystubForm({ ...paystubForm, fileUrl: e.target.value })}
                  placeholder="URL do arquivo PDF ou imagem"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRhPaystubModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black">
                  Lançar Holerite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RH Modal: Novo Comunicado */}
      {rhAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" /> Publicar Comunicado
              </h3>
              <button onClick={() => setRhAnnouncementModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.createEmployeeAnnouncement(announcementForm);
                  showToast('Comunicado publicado no mural!');
                  setRhAnnouncementModalOpen(false);
                  setAnnouncementForm({ title: '', content: '', targetGroup: 'ALL', priority: 'NORMAL' });
                  fetchRhData();
                } catch (err: any) {
                  showToast(err.message || 'Erro ao publicar comunicado.', 'error');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título do Comunicado</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Ex: Reunião Geral de Alinhamento"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Conteúdo da Mensagem</label>
                <textarea
                  rows={4}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Escreva os detalhes do aviso..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRhAnnouncementModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black">
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
