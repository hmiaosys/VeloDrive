import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import apiClient from '@/api/client'
import { Users, Plus, Shield, Loader2 } from 'lucide-react'
import { useState } from 'react'

const roleBadge: Record<string, string> = {
  Owner: 'bg-purple-100 text-purple-700',
  Admin: 'bg-blue-100 text-blue-700',
  Manager: 'bg-amber-100 text-amber-700',
  Staff: 'bg-gray-100 text-gray-600',
}

export function TeamPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', role: 'Staff', password: 'Welcome123!' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['tenant', 'users'],
    queryFn: () => apiClient.get('/tenant/users').then(r => r.data),
  })

  const inviteMutation = useMutation({
    mutationFn: () => apiClient.post('/tenant/users/invite', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'users'] })
      setShowInvite(false)
      setForm({ email: '', fullName: '', role: 'Staff', password: 'Welcome123!' })
      toast.success('Team member invited')
    },
    onError: (err: any) => toast.error(err.response?.data?.title || 'Failed to invite user'),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role, isActive }: { id: string; role: string; isActive: boolean }) =>
      apiClient.put(`/tenant/users/${id}`, { role, isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tenant', 'users'] }); toast.success('Role updated') },
    onError: () => toast.error('Failed to update role'),
  })

  if (isLoading) return <div className="text-slate-400">{t('common.loading')}</div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('settings.team')}</h1>
          <p className="text-slate-500">{t('settings.teamDesc')}</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25">
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Invite Team Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="Owner">Owner</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
            <input placeholder="Password" type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => inviteMutation.mutate()} disabled={!form.email || !form.fullName || inviteMutation.isPending}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Send Invite'}
            </button>
            <button onClick={() => setShowInvite(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-slate-50/50">
            <th className="text-left px-5 py-3 font-medium text-slate-600">Name</th>
            <th className="text-left px-5 py-3 font-medium text-slate-600">Email</th>
            <th className="text-left px-5 py-3 font-medium text-slate-600">Role</th>
            <th className="text-center px-5 py-3 font-medium text-slate-600">Status</th>
          </tr></thead>
          <tbody>
            {users?.map((u: any) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-900">{u.fullName}</td>
                <td className="px-5 py-3 text-slate-500">{u.email}</td>
                <td className="px-5 py-3">
                  <select
                    value={u.role}
                    onChange={e => updateRole.mutate({ id: u.id, role: e.target.value, isActive: u.isActive })}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${roleBadge[u.role] || ''}`}
                  >
                    {['Owner', 'Admin', 'Manager', 'Staff'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
