import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Save, Send, Server, ShieldCheck } from 'lucide-react';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function EmailSettings() {
  const [data, setData] = useState({
    notifications_enabled: true,
    notification_email: '',
    reply_signature: '',
  });
  const [smtp, setSmtp] = useState({
    configured: false,
    from: '',
    provider: '',
    providerLabel: '',
  });
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.email.settings();
      setData({
        notifications_enabled: result.settings?.notifications_enabled !== false,
        notification_email: result.settings?.notification_email || '',
        reply_signature: result.settings?.reply_signature || '',
      });
      setSmtp(result.smtp || {
        configured: false,
        from: '',
        provider: '',
        providerLabel: '',
      });
      setFallbackEmail(result.fallback_email || '');
    } catch (err) {
      setError(err?.message || 'Could not load email settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await api.email.updateSettings(data);
      setData(result.settings);
      setMessage('Email preferences saved.');
    } catch (err) {
      setError(err?.message || 'Could not save email settings.');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setError('');
    setMessage('');

    try {
      const result = await api.email.sendTest();
      setMessage(`Test email sent to ${result.to}.`);
    } catch (err) {
      setError(err?.message || 'Could not send test email.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const providerName =
    smtp.providerLabel ||
    (smtp.provider === 'brevo' ? 'Brevo HTTPS API' : smtp.provider === 'smtp' ? 'SMTP' : '');

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Email & Replies</h1>
        <p className="text-sm text-slate-500 mt-1">
          Receive a notification for new contact messages and reply directly from the CMS.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 text-slate-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-sm">Email delivery</h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    smtp.configured
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {smtp.configured ? 'Configured' : 'Not configured'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                On Render Free, use the Brevo HTTPS API. Your API key stays in Render
                Environment Variables and is never stored in TiDB/MySQL.
              </p>

              {providerName && (
                <p className="text-xs text-slate-400 mt-2">
                  Provider: {providerName}
                </p>
              )}

              {smtp.from && (
                <p className="text-xs text-slate-400 mt-1">From: {smtp.from}</p>
              )}
            </div>
          </div>

          {!smtp.configured && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              For Render Free, set BREVO_API_KEY, BREVO_FROM_EMAIL, and
              BREVO_FROM_NAME. SMTP ports 25, 465, and 587 are blocked on Render
              Free.
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-sm">New-message notifications</h2>
              <p className="text-xs text-slate-500 mt-1">
                Send you an email immediately after a visitor submits the contact form.
              </p>
            </div>

            <Switch
              checked={data.notifications_enabled}
              onCheckedChange={(value) =>
                setData((current) => ({
                  ...current,
                  notifications_enabled: value,
                }))
              }
            />
          </div>

          <div>
            <Label className="admin-label" htmlFor="notification-email">
              Notification email
            </Label>
            <Input
              id="notification-email"
              type="email"
              value={data.notification_email}
              onChange={(e) =>
                setData((current) => ({
                  ...current,
                  notification_email: e.target.value,
                }))
              }
              placeholder={fallbackEmail || 'you@example.com'}
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave blank to use your public contact email or admin account email.
            </p>
          </div>

          <div>
            <Label className="admin-label" htmlFor="reply-signature">
              Reply signature
            </Label>
            <Textarea
              id="reply-signature"
              rows={5}
              value={data.reply_signature}
              onChange={(e) =>
                setData((current) => ({
                  ...current,
                  reply_signature: e.target.value,
                }))
              }
              placeholder={'Best regards,\nYour Name'}
            />
            <p className="text-xs text-slate-400 mt-1">
              Automatically added below replies sent from the message detail page.
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs leading-5 text-slate-500">
            Replies are sent server-side. Visitors never receive your Brevo API key or
            SMTP password, and these credentials are not stored in TiDB/MySQL.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={sendTest}
            disabled={testing || !smtp.configured}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            {testing ? 'Sending…' : 'Send test email'}
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {saving ? 'Saving…' : 'Save email settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
