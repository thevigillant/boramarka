import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Camera, Loader2, ImagePlus } from 'lucide-react'
import type { ProductData, ProductCategoryData, ProductCustomFieldData } from '../../../types/dashboard'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface NewProductModalProps {
  show: boolean
  onClose: () => void
  editingProduct: ProductData | null
  categories: ProductCategoryData[]
  onSave: (data: any) => Promise<void>
}

export function NewProductModal({
  show,
  onClose,
  editingProduct,
  categories,
  onSave,
}: NewProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [minDaysNotice, setMinDaysNotice] = useState('2')
  const [maxQuantityPerOrder, setMaxQuantityPerOrder] = useState('99')
  const [unitLabel, setUnitLabel] = useState('unidade')
  const [available, setAvailable] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [photos, setPhotos] = useState<string[]>([])
  const [customFields, setCustomFields] = useState<ProductCustomFieldData[]>([])

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name)
      setDescription(editingProduct.description || '')
      setPrice(editingProduct.price.toString())
      setMinDaysNotice(editingProduct.minDaysNotice.toString())
      setMaxQuantityPerOrder(editingProduct.maxQuantityPerOrder.toString())
      setUnitLabel(editingProduct.unitLabel || 'unidade')
      setAvailable(editingProduct.available)
      setFeatured(editingProduct.featured || false)
      setCategoryId(editingProduct.categoryId ? editingProduct.categoryId.toString() : '')
      setPhotos(editingProduct.photos?.map(p => p.url) || [])
      setCustomFields(
        editingProduct.customFields?.map(cf => ({
          label: cf.label,
          fieldType: cf.fieldType,
          options: typeof cf.options === 'string' ? JSON.parse(cf.options || '[]') : cf.options,
          required: cf.required,
        })) || []
      )
    } else {
      setName('')
      setDescription('')
      setPrice('')
      setMinDaysNotice('2')
      setMaxQuantityPerOrder('99')
      setUnitLabel('unidade')
      setAvailable(true)
      setFeatured(false)
      setCategoryId('')
      setPhotos([])
      setCustomFields([])
    }
  }, [editingProduct, show])

  if (!show) return null

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida (JPG, PNG ou WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('A foto deve ter no máximo 5MB.')
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'products')

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!res.ok) throw new Error('Erro no upload')
      const { url } = await res.json()
      setPhotos(prev => [...prev, url])
    } catch (err) {
      console.error(err)
      alert('Erro ao fazer upload da foto. Tente novamente.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  function handleRemovePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddCustomField() {
    setCustomFields(prev => [
      ...prev,
      { label: '', fieldType: 'TEXT', options: [], required: false },
    ])
  }

  function handleUpdateCustomField(index: number, field: Partial<ProductCustomFieldData>) {
    setCustomFields(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...field }
      return updated
    })
  }

  function handleRemoveCustomField(index: number) {
    setCustomFields(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      alert('Nome do produto é obrigatório')
      return
    }
    if (!price || parseFloat(price) < 0) {
      alert('Preço inválido')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        minDaysNotice: parseInt(minDaysNotice) || 2,
        maxQuantityPerOrder: parseInt(maxQuantityPerOrder) || 99,
        unitLabel: unitLabel.trim() || 'unidade',
        available,
        featured,
        categoryId: categoryId ? parseInt(categoryId) : null,
        photos,
        customFields: customFields.map(cf => ({
          label: cf.label.trim(),
          fieldType: cf.fieldType,
          options: Array.isArray(cf.options) ? cf.options : [],
          required: Boolean(cf.required),
        })),
      }

      await onSave(payload)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-black text-pink-500 uppercase tracking-widest">
              BoraEncomenda · Cardápio
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {editingProduct ? 'Editar Produto de Encomenda' : 'Cadastrar Novo Produto'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Galeria de Fotos ── */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">
              Galeria de Fotos ({photos.length}/5)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((url, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden h-28 bg-slate-100 dark:bg-slate-800 group border border-slate-200 dark:border-slate-700">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full shadow">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-2xl h-28 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6 text-slate-400" />
                      <span className="text-[10px] font-bold">+ Adicionar Foto</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handlePhotoUpload(file)
              }}
            />
          </div>

          {/* ── Dados Principais ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Nome do Produto *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Bolo Vulcão Ninho com Nutella, Caixa de Brigadeiros..."
                className="input-simple font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Descrição & Ingredientes</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva o tamanho, peso, recheios e detalhes do produto..."
                className="input-simple font-medium text-sm min-h-[70px]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
                className="input-simple font-black text-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Unidade de Medida</label>
              <select
                value={unitLabel}
                onChange={e => setUnitLabel(e.target.value)}
                className="input-simple font-bold"
              >
                <option value="unidade">Por unidade</option>
                <option value="kg">Por Quilo (kg)</option>
                <option value="cento">Cento (100 un)</option>
                <option value="fatia">Por Fatia</option>
                <option value="caixa">Por Caixa</option>
                <option value="kit">Por Kit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input-simple font-bold"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2">Antecedência Mínima</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={minDaysNotice}
                  onChange={e => setMinDaysNotice(e.target.value)}
                  className="input-simple font-bold text-center"
                />
                <span className="text-xs font-bold text-slate-400">dias</span>
              </div>
            </div>
          </div>

          {/* ── Opções & Destaque ── */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={e => setAvailable(e.target.checked)}
                className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Disponível para Encomenda</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
                className="w-4 h-4 text-pink-500 rounded focus:ring-pink-400"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Produto em Destaque</span>
            </label>
          </div>

          {/* ── Campos de Personalização (Ex: Sabor, Mensagem) ── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Opções de Personalização do Cliente</h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Permita que o cliente escolha o sabor, adicione mensagem no topo, escolha cores, etc.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomField}
                className="px-3 py-1.5 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 text-pink-600 dark:text-pink-400 rounded-xl text-xs font-black flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta
              </button>
            </div>

            {customFields.map((field, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-xs font-black text-pink-500">Pergunta #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(idx)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Título da Pergunta</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={e => handleUpdateCustomField(idx, { label: e.target.value })}
                      placeholder="Ex: Escolha o Recheio, Nome para Dedicatória..."
                      className="input-simple text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tipo de Resposta</label>
                    <select
                      value={field.fieldType}
                      onChange={e => handleUpdateCustomField(idx, { fieldType: e.target.value as any })}
                      className="input-simple text-xs font-bold"
                    >
                      <option value="TEXT">Texto livre (cliente digita)</option>
                      <option value="SELECT">Lista de opções (cliente escolhe 1)</option>
                    </select>
                  </div>
                </div>

                {field.fieldType === 'SELECT' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Opções (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(field.options) ? field.options.join(', ') : ''}
                      onChange={e =>
                        handleUpdateCustomField(idx, {
                          options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="Ex: Chocolate Belga, Ninho com Morango, Doce de Leite"
                      className="input-simple text-xs font-medium"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => handleUpdateCustomField(idx, { required: e.target.checked })}
                    className="w-3.5 h-3.5 text-pink-500 rounded"
                  />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Resposta obrigatória</span>
                </label>
              </div>
            ))}
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting || uploadingPhoto}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-base transition-all shadow-xl shadow-pink-500/20 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Criar Produto no Cardápio'}
          </button>
        </form>
      </div>
    </div>
  )
}
