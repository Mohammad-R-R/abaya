import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { X, Upload, Image, Loader2, Trash2 } from 'lucide-react'

export default function AbayaFormModal({ abaya, categories, onClose, onSuccess }) {
  const isEdit = !!abaya
  const [form, setForm] = useState({
    name: abaya?.name || '',
    nameAr: abaya?.nameAr || '',
    description: abaya?.description || '',
    categoryId: abaya?.categoryId || '',
    quantity: abaya?.quantity ?? '',
    costPrice: abaya?.costPrice || '',
    sellingPrice: abaya?.sellingPrice || '',
    lowStockAlert: abaya?.lowStockAlert || 5
  })
  const [images, setImages] = useState(abaya?.images || [])
  const [newFiles, setNewFiles] = useState([])
  const [previews, setPreviews] = useState([])

  const onDrop = useCallback((accepted) => {
    const files = accepted.slice(0, 5 - images.length - newFiles.length)
    setNewFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews(prev => [...prev, { url: e.target.result, name: file.name }])
      reader.readAsDataURL(file)
    })
  }, [images.length, newFiles.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5, disabled: images.length + newFiles.length >= 5
  })

  const mutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => v !== '' && v !== null && v !== undefined && fd.append(k, v))
      newFiles.forEach(f => fd.append('images', f))
      
      if (isEdit) return api.put(`/abayas/${abaya.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      return api.post('/abayas', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Abaya updated!' : 'Abaya added!')
      onSuccess()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save')
  })

  const deleteImageMutation = useMutation({
    mutationFn: ({ imageId }) => api.delete(`/abayas/${abaya.id}/images/${imageId}`),
    onSuccess: (_, { imageId }) => setImages(prev => prev.filter(img => img.id !== imageId))
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.categoryId || form.quantity === '' || !form.costPrice || !form.sellingPrice) {
      return toast.error('Please fill in all required fields')
    }
    mutation.mutate(form)
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white z-10">
          <h2 className="font-display text-xl text-ink-900">{isEdit ? 'Edit Abaya' : 'Add New Abaya'}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name (English) *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Classic Black Abaya" required />
            </div>
            <div>
              <label className="label">اسم (عربي)</label>
              <input className="input" dir="rtl" value={form.nameAr} onChange={e => set('nameAr', e.target.value)} placeholder="عباية سوداء كلاسيكية" />
            </div>
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" required />
            </div>
            <div>
              <label className="label">Cost Price (ILS) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Selling Price (ILS) *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          {form.costPrice && form.sellingPrice && (
            <div className={`text-sm px-3 py-2 rounded-lg ${parseFloat(form.sellingPrice) < parseFloat(form.costPrice) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {parseFloat(form.sellingPrice) < parseFloat(form.costPrice) 
                ? '⚠️ Selling price is below cost price!'
                : `✓ Profit margin: ${(((form.sellingPrice - form.costPrice) / form.costPrice) * 100).toFixed(1)}%`
              }
            </div>
          )}

          <div>
            <label className="label">Low Stock Alert (units)</label>
            <input type="number" min="0" className="input" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe this abaya..." />
          </div>

          {/* Image Upload */}
          <div>
            <label className="label">Images ({images.length + newFiles.length}/5)</label>
            
            {/* Existing Images */}
            {(images.length > 0 || previews.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {images.map(img => (
                  <div key={img.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-ink-100">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                    {img.isPrimary && <div className="absolute bottom-0 inset-x-0 bg-gold-500/80 text-white text-[9px] text-center py-0.5">Primary</div>}
                    <button
                      type="button"
                      onClick={() => deleteImageMutation.mutate({ imageId: img.id })}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {previews.map((p, i) => (
                  <div key={`new-${i}`} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gold-200">
                    <img src={p.url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute bottom-0 inset-x-0 bg-gold-500/80 text-white text-[9px] text-center py-0.5">New</div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewFiles(prev => prev.filter((_, fi) => fi !== i))
                        setPreviews(prev => prev.filter((_, fi) => fi !== i))
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length + newFiles.length < 5 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-gold-400 bg-gold-50' : 'border-ink-200 hover:border-gold-300 hover:bg-ink-50'
                }`}
              >
                <input {...getInputProps()} />
                <Image size={24} className="mx-auto text-ink-300 mb-2" />
                <p className="text-sm text-ink-500">
                  {isDragActive ? 'Drop images here...' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-ink-400 mt-1">JPG, PNG, WebP — max 5MB each</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (isEdit ? 'Save Changes' : 'Add Abaya')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
