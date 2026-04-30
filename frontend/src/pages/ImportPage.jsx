import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatCurrency } from '../utils/format'
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle,
  AlertTriangle, Loader2, X, ChevronDown, ChevronUp
} from 'lucide-react'

const STEPS = ['Upload File', 'Preview & Validate', 'Import']

export default function ImportPage() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showInvalid, setShowInvalid] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setStep(1) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  })

  const previewMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (res) => { setPreview(res.data); setStep(2) },
    onError: (err) => toast.error(err.response?.data?.error || 'Preview failed')
  })

  const importMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', file)
      return api.post('/import/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (res) => {
      toast.success(`✓ Imported ${res.data.imported} abayas successfully!`)
      setStep(3)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Import failed')
  })

  const reset = () => { setStep(0); setFile(null); setPreview(null); setShowInvalid(false) }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Abayas</h1>
          <p className="text-sm text-ink-400 mt-1">Bulk add products via Excel or CSV</p>
        </div>
        <a href="/api/import/template" download className="btn-secondary">
          <Download size={16} /> Download Template
        </a>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              i < step ? 'bg-emerald-100 text-emerald-700' :
              i === step ? 'bg-gold-500 text-white shadow-sm' :
              'bg-ink-100 text-ink-400'
            }`}>
              {i < step ? <CheckCircle size={14} /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-emerald-300' : 'bg-ink-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Template info */}
          <div className="card bg-gold-50 border-gold-200">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={20} className="text-gold-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gold-800 mb-1">Use our Excel Template</p>
                <p className="text-sm text-gold-700 mb-3">Download the template file and fill in your abayas. Required columns:</p>
                <div className="flex flex-wrap gap-2">
                  {['name', 'category', 'quantity', 'cost_price', 'selling_price'].map(col => (
                    <code key={col} className="text-xs bg-gold-100 text-gold-800 px-2 py-0.5 rounded-lg font-mono">{col}</code>
                  ))}
                  <span className="text-xs text-gold-600 self-center">+ optional: name_ar, description, low_stock_alert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-gold-400 bg-gold-50 scale-[1.01]' : 'border-ink-200 hover:border-gold-300 hover:bg-ink-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className={isDragActive ? 'text-gold-500' : 'text-ink-400'} />
            </div>
            <p className="text-lg font-medium text-ink-700 mb-1">
              {isDragActive ? 'Drop the file here' : 'Upload Excel or CSV file'}
            </p>
            <p className="text-sm text-ink-400">Drag & drop or click to browse — .xlsx, .xls, .csv — max 10MB</p>
          </div>
        </div>
      )}

      {/* Step 1: File selected, preview loading */}
      {step === 1 && file && (
        <div className="card text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet size={24} className="text-emerald-500" />
          </div>
          <p className="font-medium text-ink-800 mb-1">{file.name}</p>
          <p className="text-sm text-ink-400 mb-6">{(file.size / 1024).toFixed(1)} KB</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-secondary">
              <X size={15} /> Cancel
            </button>
            <button onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending} className="btn-primary">
              {previewMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle size={15} /> Validate & Preview</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview results */}
      {step === 2 && preview && (
        <div className="space-y-5">
          {/* Summary badges */}
          <div className="flex flex-wrap gap-3">
            <div className="card flex items-center gap-3 py-3">
              <div className="w-10 h-10 bg-ink-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet size={18} className="text-ink-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-ink-900">{preview.total}</p>
                <p className="text-xs text-ink-400">Total rows</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 py-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-700">{preview.valid}</p>
                <p className="text-xs text-ink-400">Valid rows</p>
              </div>
            </div>
            <div className="card flex items-center gap-3 py-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{preview.invalid}</p>
                <p className="text-xs text-ink-400">Invalid rows</p>
              </div>
            </div>
          </div>

          {/* Valid rows preview */}
          {preview.validRows?.length > 0 && (
            <div>
              <h3 className="font-medium text-ink-800 mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                Valid Rows — will be imported
              </h3>
              <div className="table-container max-h-64 overflow-y-auto">
                <table className="table text-xs">
                  <thead>
                    <tr>
                      <th>Row</th><th>Name</th><th>Category</th><th>Qty</th><th>Cost</th><th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.validRows.map((row, i) => (
                      <tr key={i}>
                        <td className="text-ink-400">{row.rowNumber}</td>
                        <td className="font-medium">{row.name}{row.nameAr && <span className="text-ink-400 ml-1" dir="rtl">({row.nameAr})</span>}</td>
                        <td><span className="badge badge-gold">{row.category}</span></td>
                        <td>{row.quantity}</td>
                        <td>{formatCurrency(row.costPrice)}</td>
                        <td className="text-gold-700 font-medium">{formatCurrency(row.sellingPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid rows */}
          {preview.invalidRows?.length > 0 && (
            <div>
              <button
                onClick={() => setShowInvalid(!showInvalid)}
                className="flex items-center gap-2 font-medium text-red-600 mb-3"
              >
                <XCircle size={16} />
                {preview.invalid} Invalid Rows — will be skipped
                {showInvalid ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showInvalid && (
                <div className="space-y-2">
                  {preview.invalidRows.map((row, i) => (
                    <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm font-medium text-red-700 mb-1">Row {row.rowNumber}: {row.name || 'Unknown'}</p>
                      {row.errors.map((err, j) => (
                        <p key={j} className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle size={11} /> {err}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="btn-secondary">
              <X size={15} /> Start Over
            </button>
            {preview.canImport && (
              <button onClick={() => importMutation.mutate()} disabled={importMutation.isPending} className="btn-primary">
                {importMutation.isPending
                  ? <Loader2 size={15} className="animate-spin" />
                  : <><Upload size={15} /> Import {preview.valid} Abayas</>
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl text-ink-900 mb-2">Import Successful!</h2>
          <p className="text-ink-500 mb-8">Your abayas have been added to the inventory.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-secondary">Import More</button>
            <a href="/inventory" className="btn-primary">View Inventory</a>
          </div>
        </div>
      )}
    </div>
  )
}
