import { useEffect, useState } from 'react';
import { Mail, LockKeyhole, Loader2, Save, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminAccount() {
  const { user, checkUserAuth } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(user?.email || '');
  }, [user?.email]);

  const saveAccount = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== String(user?.email || '').trim().toLowerCase();
    const passwordChanged = newPassword.length > 0;

    if (!emailChanged && !passwordChanged) {
      setError('Enter a new email address or a new password before saving.');
      return;
    }
    if (!currentPassword) {
      setError('Enter your current password to confirm this change.');
      return;
    }
    if (passwordChanged && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (passwordChanged && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const result = await api.auth.updateAccount({
        email: normalizedEmail,
        current_password: currentPassword,
        new_password: passwordChanged ? newPassword : undefined,
      });
      await checkUserAuth();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(result?.changed === false ? 'No account changes were needed.' : 'Account credentials updated successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to update account credentials.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-slate-500 mt-1">Manage the email and password used to sign in to the admin dashboard.</p>
      </div>

      <form onSubmit={saveAccount} className="space-y-6">
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Login email</h2>
              <p className="text-xs text-slate-500 mt-1">This is the email address you enter on the website login page.</p>
            </div>
          </div>
          <Label className="admin-label" htmlFor="account-email">Email address</Label>
          <Input
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <LockKeyhole className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Password</h2>
              <p className="text-xs text-slate-500 mt-1">Leave the new password fields blank if you only want to change your email.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="admin-label" htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to save changes"
              />
            </div>
            <div>
              <Label className="admin-label" htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <Label className="admin-label" htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </section>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-5 text-slate-500">For security, your current password is required before the login email or password can be changed. Your password is never displayed or stored as plain text.</p>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</div>}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? 'Saving…' : 'Update account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
