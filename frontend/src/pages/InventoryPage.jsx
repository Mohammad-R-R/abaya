import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatCurrency } from '../utils/format'
import {
  Plus, Search, Filter, Package, Edit2, Trash2,
  AlertTriangle, Image, ChevronLeft, ChevronRight, X, Upload
} from 'lucide-react'
import AbayaFormModal from '../components/inventory/AbayaFormModal'

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editAbaya, setEditAbaya] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['abayas', page, search, categoryId, lowStock],
    queryFn: () => api.get('/abayas', {
      params: { page, limit: 16, search: search || undefined, categoryId: categoryId || undefined, lowStock: lowStock || undefined }
    }).then(r => r.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/abayas/${id}`),
    onSuccess: () => {
      toast.success('Abaya deleted')
      queryClient.invalidateQueries({ queryKey: ['abayas'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Delete failed')
  })

  const handleDelete = (abaya) => {
    if (confirm(`Delete "${abaya.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(abaya.id)
    }
  }

  const handleEdit = (abaya) => {
    setEditAbaya(abaya)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditAbaya(null)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-sm text-ink-400 mt-1">{data?.pagination?.total || 0} abayas total</p>
        </div>
        <div className="flex gap-2">
          <Link to="/import" className="btn-secondary">
            <Upload size={16} /> Import Excel
          </Link>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Add Abaya
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={e => { setCategoryId(e.target.value); setPage(1) }}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => { setLowStock(!lowStock); setPage(1) }}
          className={`btn-secondary ${lowStock ? 'bg-amber-50 border-amber-200 text-amber-700' : ''}`}
        >
          <AlertTriangle size={15} /> Low Stock
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <div className="skeleton h-48 rounded-none" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-ink-200 mx-auto mb-4" />
          <p className="text-ink-500 font-medium">No abayas found</p>
          <p className="text-ink-400 text-sm mt-1">Try changing filters or add a new abaya</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.data?.map(abaya => (
            <AbayaCard
              key={abaya.id}
              abaya={abaya}
              onEdit={() => handleEdit(abaya)}
              onDelete={() => handleDelete(abaya)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed px-3"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-ink-600 px-2">
            Page {page} of {data.pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pagination.pages}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed px-3"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AbayaFormModal
          abaya={editAbaya}
          categories={categories || []}
          onClose={closeForm}
          onSuccess={() => {
            closeForm()
            queryClient.invalidateQueries({ queryKey: ['abayas'] })
          }}
        />
      )}
    </div>
  )
}

function AbayaCard({ abaya, onEdit, onDelete }) {
  const primaryImage = abaya.images?.find(img => img.isPrimary) || abaya.images?.[0]

  return (
    <div className={`card p-0 overflow-hidden hover:shadow-md transition-all group ${abaya.isLowStock ? 'ring-2 ring-amber-300' : ''}`}>
      {/* Image */}
      <Link to={`/inventory/${abaya.id}`} className="block">
        <div className="relative h-48 bg-ink-50 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={abaya.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={36} className="text-ink-200" />
            </div>
          )}
          {abaya.images?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-ink-800/70 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Image size={10} /> {abaya.images.length}
            </div>
          )}
          {abaya.isLowStock && (
            <div className="absolute top-2 left-2 badge badge-red flex items-center gap-1">
              <AlertTriangle size={10} /> Low
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link to={`/inventory/${abaya.id}`}>
          <p className="font-medium text-ink-800 text-sm truncate hover:text-gold-700">{abaya.name}</p>
          <p className="text-xs text-ink-400 mt-0.5">{abaya.category?.name}</p>
        </Link>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-gold-600 font-semibold text-sm">{formatCurrency(abaya.sellingPrice)}</p>
            <p className="text-xs text-ink-400">Stock: <span className={`font-medium ${abaya.quantity <= 3 ? 'text-red-500' : 'text-ink-700'}`}>{abaya.quantity}</span></p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 hover:bg-gold-50 rounded-lg text-ink-400 hover:text-gold-600 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg text-ink-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
