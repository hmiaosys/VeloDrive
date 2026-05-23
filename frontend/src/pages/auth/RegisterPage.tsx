import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { Bus } from 'lucide-react'

export function RegisterPage() {
  const [form, setForm] = useState({
    tenantName: '', subdomain: '', fullName: '', email: '', password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await authApi.register(form)
      setAuth(result.accessToken, result.refreshToken, {
        id: result.user.id,
        tenantId: result.user.tenantId,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Bus className="h-10 w-10 mx-auto text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground">Start managing your rentals</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6 space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
          )}

          <div>
            <label className="text-sm font-medium">Business Name</label>
            <input value={form.tenantName} onChange={update('tenantName')}
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background" required />
          </div>

          <div>
            <label className="text-sm font-medium">Subdomain</label>
            <input value={form.subdomain} onChange={update('subdomain')}
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background" required />
          </div>

          <div>
            <label className="text-sm font-medium">Your Name</label>
            <input value={form.fullName} onChange={update('fullName')}
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background" required />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" value={form.email} onChange={update('email')}
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background" required />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input type="password" value={form.password} onChange={update('password')}
              className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
