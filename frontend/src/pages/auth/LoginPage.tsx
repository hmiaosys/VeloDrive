import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { Sparkles, Bus, Calendar, Users, ArrowRight } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('owner@metrobus.com')
  const [password, setPassword] = useState('Admin123!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const result = await authApi.login({ email, password })
      setAuth(result.accessToken, result.refreshToken, {
        id: result.user.id, tenantId: result.user.tenantId,
        email: result.user.email, firstName: result.user.firstName, lastName: result.user.lastName,
        position: result.user.position, permissions: result.user.permissions, account: result.user.account,
      })
      navigate(`/${result.user.account}`)
    } catch { setError(t('auth.invalidCredentials')) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Hero side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">{t('app.name')}</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6">
            {t('hero.headline')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{t('hero.highlight')}</span>
          </h1>
          <p className="text-lg text-slate-400 mb-12 max-w-md">{t('hero.description')}</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Bus, label: t('hero.feature1Title'), desc: t('hero.feature1Desc') },
              { icon: Calendar, label: t('hero.feature2Title'), desc: t('hero.feature2Desc') },
              { icon: Users, label: t('hero.feature3Title'), desc: t('hero.feature3Desc') },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-white/80">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-sm font-semibold text-white mb-1">{label}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center bg-[#f6f7fb] p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">{t('app.name')}</span>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="hidden lg:flex justify-end mb-4">
            <LanguageSwitcher />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{t('auth.welcomeBack')}</h2>
            <p className="text-slate-500 mt-1">{t('auth.signIn')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{error}</div>}

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="email">{t('auth.email')}</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="password">{t('auth.password')}</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
              {loading ? t('auth.signingIn') : <>{t('auth.signInButton')} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {t('auth.newToVeloDrive')}{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700">{t('auth.createAccount')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
