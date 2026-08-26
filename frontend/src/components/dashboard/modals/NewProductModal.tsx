import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Camera, Loader2, ImagePlus, Star, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { api } from '../../../services/api'
import type { ProductData, ProductCategoryData, ProductCustomFieldData } from '../../../types/dashboard'

interface NewProductModalProps {
  show: boolean
  onClose: () => void
  editingProduct: ProductData | null
  categories: ProductCategoryData[]
  onSave: (data: any) => Promise<void>
}

/**
 * Comprime e redimensiona imagem no lado do cliente (Canvas) para envio rápido e sem falhas de limite
 */
async function compressImage(file: File, maxWidth = 1400, maxHeight = 1400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    // Se não for imagem comum ou for svg, envia original
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            // Guarda o width original antes de alterar
            const originalWidth = width
            height = maxHeight
            width = Math.round((originalWidth * maxHeight) / img.height)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              resolve(blob || file)
            },
            'image/jpeg',
            quality
          )
        } else {
          resolve(file)
        }
      }
      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')

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
      setPhotos(
        (editingProduct.photos || [])
          .map((p: any) => (typeof p === 'string' ? p : p?.url))
          .filter(Boolean)
      )
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
    setUploadError(null)
    setShowUrlInput(false)
    setCustomImageUrl('')
  }, [editingProduct, show])

  if (!show) return null

  async function handlePhotoFiles(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const remainingSlots = 5 - photos.length
    if (remainingSlots <= 0) {
      alert('Você já atingiu o limite máximo de 5 fotos para este produto.')
      return
    }

    const filesToUpload = fileArray.slice(0, remainingSlots)

    setUploadingPhoto(true)
    setUploadError(null)

    const uploadedUrls: string[] = []

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Por favor selecione arquivos de imagem válidos (JPG, PNG, WebP).')
        continue
      }

      try {
        // Comprime a imagem antes de subir
        const compressedBlob = await compressImage(file)
        const result = await api.uploadImage(compressedBlob, 'products')
        if (result?.url) {
          uploadedUrls.push(result.url)
        }
      } catch (err: any) {
        console.error('Erro no upload da foto:', err)
        setUploadError(err.message || 'Erro ao enviar a imagem. Tente novamente.')
      }
    }

    if (uploadedUrls.length > 0) {
      setPhotos(prev => [...prev, ...uploadedUrls])
    }

    setUploadingPhoto(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleAddUrlPhoto() {
    const cleanUrl = customImageUrl.trim()
    if (!cleanUrl) return
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:image/')) {
      alert('Insira uma URL de imagem válida (começando com https:// ou http://)')
      return
    }
    if (photos.length >= 5) {
      alert('Limite de 5 fotos atingido.')
      return
    }
    setPhotos(prev => [...prev, cleanUrl])
    setCustomImageUrl('')
    setShowUrlInput(false)
  }

  function handleRemovePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  function handleSetAsCover(index: number) {
    if (index === 0) return
    setPhotos(prev => {
      const copy = [...prev]
      const [selected] = copy.splice(index, 1)
      return [selected, ...copy]
    })
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
        photos: photos.filter(Boolean),
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
      <div className="bg-white dark:bg-[#131826] w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-black text-pink-500 uppercase tracking-widest">
              BoraEncomenda · Cardápio
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {editingProduct ? 'Editar Produto de Encomenda' : 'Cadastrar Novo Produto'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Galeria de Fotos ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                Galeria de Fotos ({photos.length}/5)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1 transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  {showUrlInput ? 'Ocultar Link' : 'Adicionar via Link'}
                </button>
              </div>
            </div>

            {/* Input para URL direta */}
            {showUrlInput && (
              <div className="mb-3 p-3 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Cole a URL da imagem (ex: https://site.com/foto.jpg)"
                  className="input-simple text-xs flex-1 py-1.5 px-3"
                />
                <button
                  type="button"
                  onClick={handleAddUrlPhoto}
                  className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  Adicionar
                </button>
              </div>
            )}

            {uploadError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Área de Fotos com Drag and Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handlePhotoFiles(e.dataTransfer.files)
                }
              }}
              className={`grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 rounded-2xl transition-all border-2 ${
                isDragOver
                  ? 'border-pink-500 bg-pink-50/30 dark:bg-pink-500/10 border-dashed'
                  : 'border-transparent'
              }`}
            >
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden h-28 bg-slate-100 dark:bg-slate-800 group border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback se a imagem não carregar
                      (e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                  {idx === 0 ? (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" /> Capa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetAsCover(idx)}
                      title="Definir como foto principal"
                      className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-slate-900/80 hover:bg-pink-500 text-white px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow"
                    >
                      Tornar Capa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    title="Excluir foto"
                    className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-2xl h-28 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400 p-2 text-center"
                >
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                      <span className="text-[10px] font-bold text-pink-500">Enviando...</span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-pink-500 transition-colors" />
                      <span className="text-[10px] font-bold">+ Adicionar Foto</span>
                      <span className="text-[8px] text-slate-400 hidden sm:inline">ou arraste aqui</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handlePhotoFiles(e.target.files)
                }
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
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl text-white font-black text-base transition-all shadow-xl shadow-pink-500/20 disabled:opacity-50 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            {submitting ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Criar Produto no Cardápio'}
          </button>
        </form>
      </div>
    </div>
  )
}

