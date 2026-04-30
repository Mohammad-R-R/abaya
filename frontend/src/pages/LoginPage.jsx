import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mesh-gold bg-ink-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sand-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl shadow-lg mb-4">
            <span className="text-white font-display text-3xl font-bold">ع</span>
          </div>
          <h1 className="font-display text-3xl text-ink-900 font-semibold">Abaya Store</h1>
          <p className="text-ink-400 mt-1 text-sm">Sign in to manage your store</p>
        </div>

        {/* Card */}
        <div className="card shadow-xl border-ink-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your@email.com"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick fill hints */}
          <div className="mt-5 pt-5 border-t border-ink-100">
            <p className="text-xs text-ink-400 text-center mb-3">Quick sign in:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEmail('mohammad@abayastore.com'); setPassword('Admin@2024') }}
                className="flex-1 text-xs py-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-600 transition-colors"
              >
                Mohammad (Admin)
              </button>
              <button
                onClick={() => { setEmail('shatha@abayastore.com'); setPassword('Staff@2024') }}
                className="flex-1 text-xs py-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-600 transition-colors"
              >
                Shatha (Staff)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
