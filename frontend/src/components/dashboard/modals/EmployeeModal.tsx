import React from 'react'
import { X, UserCheck } from 'lucide-react'

interface EmployeeModalProps {
  employeeModalOpen: boolean
  setEmployeeModalOpen: (val: boolean) => void
  editingEmployee: any
  setEditingEmployee: (val: any) => void
  employeeForm: {
    name: string
    role: string
    workingHours: string
    phone: string
    email: string
    cpf: string
    rg: string
    admissionDate: string
    birthDate: string
    salary: string
    commission: string
  }
  setEmployeeForm: React.Dispatch<React.SetStateAction<any>>
  handleCreateOrUpdateEmployee: (e: React.FormEvent) => void
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employeeModalOpen,
  setEmployeeModalOpen,
  editingEmployee,
  setEditingEmployee,
  employeeForm,
  setEmployeeForm,
  handleCreateOrUpdateEmployee
}) => {
  if (!employeeModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-500" />
              {editingEmployee ? 'Editar Ficha do Colaborador' : 'Novo Cadastro de Colaborador'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Preencha os dados contratuais e pessoais</p>
          </div>
          <button
            onClick={() => {
              setEmployeeModalOpen(false)
              setEditingEmployee(null)
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateOrUpdateEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Nome Completo *</label>
            <input
              type="text"
              value={employeeForm.name}
              onChange={e => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              placeholder="Ex: Carlos Eduardo Silva"
              className="input-simple font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Cargo / Especialidade *</label>
              <input
                type="text"
                value={employeeForm.role}
                onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                placeholder="Ex: Barbeiro Senior, Esteticista..."
                className="input-simple font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Jornada / Horário</label>
              <input
                type="text"
                value={employeeForm.workingHours}
                onChange={e => setEmployeeForm({ ...employeeForm, workingHours: e.target.value })}
                placeholder="Ex: Seg a Sex 09h às 18h"
                className="input-simple font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={employeeForm.phone}
                onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
                className="input-simple font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={employeeForm.email}
                onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                placeholder="Ex: carlos@email.com"
                className="input-simple font-bold text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">CPF</label>
              <input
                type="text"
                value={employeeForm.cpf}
                onChange={e => setEmployeeForm({ ...employeeForm, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="input-simple font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">RG</label>
              <input
                type="text"
                value={employeeForm.rg}
                onChange={e => setEmployeeForm({ ...employeeForm, rg: e.target.value })}
                placeholder="00.000.000-0"
                className="input-simple font-bold text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data de Admissão</label>
              <input
                type="date"
                value={employeeForm.admissionDate}
                onChange={e => setEmployeeForm({ ...employeeForm, admissionDate: e.target.value })}
                className="input-simple font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={employeeForm.birthDate}
                onChange={e => setEmployeeForm({ ...employeeForm, birthDate: e.target.value })}
                className="input-simple font-bold text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Salário Base (R$)</label>
              <input
                type="number"
                step="0.01"
                value={employeeForm.salary}
                onChange={e => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                placeholder="0,00"
                className="input-simple font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Comissão (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={employeeForm.commission}
                onChange={e => setEmployeeForm({ ...employeeForm, commission: e.target.value })}
                placeholder="Ex: 10"
                className="input-simple font-bold"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:opacity-95 text-sm uppercase tracking-wider"
            >
              {editingEmployee ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmployeeModalOpen(false)
                setEditingEmployee(null)
              }}
              className="px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-xl transition-all text-sm uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
