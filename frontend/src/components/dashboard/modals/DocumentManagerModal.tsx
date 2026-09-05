import React from 'react'
import { X, Paperclip, Upload, Loader2, FileText, Download, Trash2 } from 'lucide-react'
import { formatDate } from '../../../utils/dashboardHelpers'

interface DocumentManagerModalProps {
  docModalOpen: boolean
  setDocModalOpen: (val: boolean) => void
  selectedEmployeeForDocs: any
  setSelectedEmployeeForDocs: (val: any) => void
  docForm: {
    title: string
    category: string
    expiryDate: string
    fileUrl: string
    fileName: string
    fileSize: string
  }
  setDocForm: React.Dispatch<React.SetStateAction<any>>
  handleAddDocument: (e: React.FormEvent) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
  loadingDocs: boolean
  docList: Array<{
    id: number
    title: string
    category: string
    expiryDate?: string
    fileName?: string
    fileSize?: string
    fileUrl: string
    createdAt: string
  }>
  handleDeleteDocument: (id: number) => void
}

export const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({
  docModalOpen,
  setDocModalOpen,
  selectedEmployeeForDocs,
  setSelectedEmployeeForDocs,
  docForm,
  setDocForm,
  handleAddDocument,
  showToast,
  loadingDocs,
  docList,
  handleDeleteDocument
}) => {
  if (!docModalOpen || !selectedEmployeeForDocs) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scale-in border border-violet-500/20 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-500 flex items-center justify-center font-black">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Gestão de Documentos</h3>
              <p className="text-xs text-violet-500 font-bold">{selectedEmployeeForDocs.name} ({selectedEmployeeForDocs.role})</p>
            </div>
          </div>
          <button
            onClick={() => {
              setDocModalOpen(false)
              setSelectedEmployeeForDocs(null)
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form for Uploading / Attaching New Document */}
        <form onSubmit={handleAddDocument} className="p-5 bg-violet-50/5 border border-violet-500/20 rounded-2xl space-y-4 mb-6">
          <h4 className="text-xs font-black uppercase tracking-wider text-violet-500 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Anexar Novo Documento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Título do Documento *</label>
              <input
                type="text"
                value={docForm.title}
                onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="Ex: ASO Admissional, Contrato de Trabalho..."
                className="input-simple font-bold text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Categoria *</label>
              <select
                value={docForm.category}
                onChange={e => setDocForm({ ...docForm, category: e.target.value })}
                className="input-simple font-bold text-xs"
                required
              >
                <option value="CONTRATO">Contrato de Trabalho</option>
                <option value="ASO">Exame ASO / Atestado</option>
                <option value="IDENTIFICACAO">Documento Pessoal (RG/CPF/CNH)</option>
                <option value="HOLERITE">Holerite / Comprovante</option>
                <option value="GERAL">Outros Documentos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Data de Vencimento / Validade</label>
              <input
                type="date"
                value={docForm.expiryDate}
                onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                className="input-simple font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Arquivo *</label>
              <input
                type="file"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 25 * 1024 * 1024) {
                      showToast('O arquivo não pode ser maior que 25MB', 'error')
                      e.target.value = ''
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = (uploadEvent) => {
                      const base64 = uploadEvent.target?.result as string
                      setDocForm({
                        ...docForm,
                        fileUrl: base64,
                        fileName: file.name,
                        fileSize: file.size >= 1024 * 1024
                          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                          : `${(file.size / 1024).toFixed(1)} KB`
                      })
                    }
                    reader.onerror = () => {
                      showToast('Erro ao ler arquivo selecionado', 'error')
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer"
                required={!docForm.fileUrl}
              />
              {docForm.fileName && (
                <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                  {docForm.fileName} ({docForm.fileSize})
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-95 shadow-md"
          >
            Anexar Documento ao Colaborador
          </button>
        </form>

        {/* Document List */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Documentos Arquivados ({docList.length})</span>
          </h4>

          {loadingDocs ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold">Carregando arquivos...</p>
            </div>
          ) : docList.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
              <p className="text-xs text-slate-400 font-bold">Nenhum documento anexado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {docList.map(doc => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
                return (
                  <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">{doc.title}</h5>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">
                            {doc.category}
                          </span>
                          {isExpired && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-500 text-white animate-pulse">
                              Vencido ({formatDate(doc.expiryDate || '')})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {doc.fileName || 'Arquivo'} {doc.fileSize && `(${doc.fileSize})`} — Enviado em {formatDate(doc.createdAt.split('T')[0])}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.fileName || doc.title}
                        className="p-2 bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white rounded-xl transition-all"
                        title="Baixar / Visualizar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        title="Excluir Documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
