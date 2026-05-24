import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import apiClient from '@/api/client'
import { Users, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function TeamPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'Welcome123!',
    position: 'Staff', permissionTemplate: 'Staff'
  })

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiClient.get('/employees').then(r => r.data),
  })

  const inviteMutation = useMutation({
    mutationFn: () => apiClient.post('/employees/invite', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowInvite(false)
      setForm({ firstName: '', lastName: '', email: '', password: 'Welcome123!', position: 'Staff', permissionTemplate: 'Staff' })
      toast.success('Team member invited')
    },
    onError: (err: any) => toast.error(err.response?.data?.title || 'Failed to invite'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, position, isActive }: { id: string; position: string; isActive: boolean }) =>
      apiClient.put(`/employees/${id}`, { position, isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Updated') },
    onError: () => toast.error('Failed to update'),
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
            <input placeholder="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input placeholder="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <input placeholder="Position (e.g. Manager, Driver)" value={form.position} onChange={e => setForm({...form, position: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm" />
            <select value={form.permissionTemplate} onChange={e => setForm({...form, permissionTemplate: e.target.value})}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
              <option value="Owner">Owner (full access)</option>
              <option value="Staff">Staff (read-only)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => inviteMutation.mutate()} disabled={!form.email || !form.firstName || inviteMutation.isPending}
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
            <th className="text-left px-5 py-3 font-medium text-slate-600">Position</th>
            <th className="text-center px-5 py-3 font-medium text-slate-600">Status</th>
          </tr></thead>
          <tbody>
            {employees?.map((e: any) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-900">{e.firstName} {e.lastName}</td>
                <td className="px-5 py-3 text-slate-500">{e.email}</td>
                <td className="px-5 py-3 text-slate-700 text-sm">{e.position}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.isActive ? 'Active' : 'Inactive'}
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
