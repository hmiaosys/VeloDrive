import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { Sparkles } from 'lucide-react'

export function RegisterPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ tenantName: '', subdomain: '', fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const result = await authApi.register(form)
      setAuth(result.accessToken, result.refreshToken, { id: result.user.id, tenantId: result.user.tenantId, email: result.user.email, firstName: result.user.firstName, lastName: result.user.lastName, position: result.user.position, permissions: result.user.permissions, account: result.user.account })
      navigate(`/${result.user.account}`)
    } catch (err: any) { setError(err.response?.data || 'Registration failed.') }
    finally { setLoading(false) }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f7fb] p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><Sparkles className="h-5 w-5 text-white" /></div><span className="text-xl font-bold">{t('app.name')}</span></div>
        </div>
        <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">{t('auth.createYourAccount')}</h2><p className="text-slate-500 mt-1">{t('auth.startManaging')}</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</div>}
          {[['tenantName', t('auth.businessName')], ['subdomain', t('auth.subdomain')], ['fullName', t('auth.yourName')], ['email', t('auth.email')], ['password', t('auth.password')]].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <input value={(form as any)[key]} onChange={update(key)} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                className="mt-1.5 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
            {loading ? t('auth.creating') : t('auth.createAccountButton')}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">{t('auth.alreadyHaveAccount')} <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700">{t('auth.signInLink')}</Link></p>
      </div>
    </div>
  )
}
