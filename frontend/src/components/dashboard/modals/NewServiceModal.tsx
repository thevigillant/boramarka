import { X, Camera, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ServiceData } from '../../../types/dashboard'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface NewServiceModalProps {
  showNewService: boolean
  setShowNewService: (show: boolean) => void
  editingService: ServiceData | null
  serviceForm: {
    name: string
    description: string
    price: string
    duration: string
    photoUrl: string
  }
  setServiceForm: (form: any) => void
  handleCreateService: (e: React.FormEvent) => void
}

export function NewServiceModal({
  showNewService,
  setShowNewService,
  editingService,
  serviceForm,
  setServiceForm,
  handleCreateService,
}: NewServiceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  if (!showNewService) return null

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem (JPG, PNG ou WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'services')

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) throw new Error('Erro no upload')
      const { url } = await res.json()
      setServiceForm({ ...serviceForm, photoUrl: url })
    } catch (err) {
      console.error(err)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handlePhotoUpload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handlePhotoUpload(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
          </h3>
          <button onClick={() => setShowNewService(false)} className="p-2 text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateService} className="space-y-5">
          {/* ── Foto do Serviço ── */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">
              Foto do Serviço (Opcional)
            </label>

            {serviceForm.photoUrl ? (
              /* Preview da foto */
              <div className="relative rounded-2xl overflow-hidden h-44 bg-slate-100 dark:bg-slate-800 group">
                <img
                  src={serviceForm.photoUrl}
                  alt="Foto do serviço"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white rounded-xl text-slate-800 hover:bg-orange-50"
                    title="Trocar foto"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, photoUrl: '' })}
                    className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-50"
                    title="Remover foto"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Área de drop */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`cursor-pointer border-2 border-dashed rounded-2xl h-36 flex flex-col items-center justify-center gap-2 transition-all ${
                  dragOver
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-pink-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Enviando foto...</p>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-400 text-center px-4">
                      Clique ou arraste uma foto aqui
                      <br />
                      <span className="font-normal text-slate-300">JPG, PNG ou WebP · Máx. 5MB</span>
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ── Nome ── */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Serviço</label>
            <input
              type="text"
              value={serviceForm.name}
              onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
              placeholder="Ex: Corte Masculino, Manicure, etc."
              className="input-simple font-bold"
              required
            />
          </div>

          {/* ── Descrição ── */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição (Opcional)</label>
            <textarea
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder="Explique o que inclui o serviço..."
              className="input-simple font-medium text-sm min-h-[80px]"
            />
          </div>

          {/* ── Preço + Duração ── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={serviceForm.price}
                onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                placeholder="0,00"
                className="input-simple font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Duração (Minutos)</label>
              <select
                value={serviceForm.duration}
                onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                className="input-simple font-bold"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hora</option>
                <option value="90">1h 30min</option>
                <option value="120">2 horas</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadingPhoto}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-lg transition-all shadow-xl shadow-pink-500/20 mt-4 disabled:opacity-60"
          >
            {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
          </button>
        </form>
      </div>
    </div>
  )
}
