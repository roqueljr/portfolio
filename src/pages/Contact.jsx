import { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/api/apiClient';
import { useSettings } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';

const PROJECT_TYPES = ['Web Development', 'Mobile App', 'UI/UX Design', 'Internal System', 'API / Backend', 'Other'];
const BUDGETS = ['< $1k', '$1k – $5k', '$5k – $15k', '$15k – $50k', '$50k+', 'Not sure yet'];

export default function Contact() {
  const { data: settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', project_type: '', budget_range: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) { setError('Please fill in your name, email, and message.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await api.functions.invoke('submitContact', form);
      setSent(true);
      setForm({ name: '', email: '', company: '', subject: '', project_type: '', budget_range: '', message: '' });
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-16 sm:pt-20">
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Contact</p>
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight max-w-[14ch]">
          {settings?.footer_cta_heading || "Let's build something"}
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground text-lg">
          {settings?.footer_cta_subheading || 'Tell me about your project — I reply to every serious inquiry within two business days.'}
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16 grid gap-12 lg:grid-cols-12">
        {/* Info */}
        <div className="lg:col-span-4 space-y-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</p>
            {settings?.email && <a href={`mailto:${settings.email}`} className="font-heading text-xl hover:text-[var(--accent)] transition-colors">{settings.email}</a>}
          </div>
          {settings?.phone && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Phone</p>
              <p className="font-heading text-xl">{settings.phone}</p>
            </div>
          )}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Location</p>
            <p className="font-heading text-xl">{settings?.location || '—'}</p>
          </div>
          {settings?.availability_status && (
            <div className="flex items-center gap-2 text-sm">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {settings?.availability_message || 'Available for work'}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="lg:col-span-8">
          {sent ? (
            <Reveal className="border border-border rounded-sm p-10 sm:p-16 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[var(--accent)] mb-6" />
              <h2 className="font-heading text-3xl font-medium">Message sent</h2>
              <p className="mt-3 text-muted-foreground">Thanks for reaching out — I'll get back to you shortly.</p>
              <button onClick={() => setSent(false)} className="mt-8 text-sm text-[var(--accent)] hover:underline">Send another message</button>
            </Reveal>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="p-3 rounded-sm bg-destructive/10 text-destructive text-sm">{error}</div>}
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Name *"><input value={form.name} onChange={set('name')} required className="input-base" placeholder="Your name" /></Field>
                <Field label="Email *"><input type="email" value={form.email} onChange={set('email')} required className="input-base" placeholder="you@example.com" /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Company"><input value={form.company} onChange={set('company')} className="input-base" placeholder="Optional" /></Field>
                <Field label="Subject"><input value={form.subject} onChange={set('subject')} className="input-base" placeholder="What's this about?" /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Project type">
                  <select value={form.project_type} onChange={set('project_type')} className="input-base">
                    <option value="">Select…</option>
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Budget range">
                  <select value={form.budget_range} onChange={set('budget_range')} className="input-base">
                    <option value="">Select…</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Message *">
                <textarea value={form.message} onChange={set('message')} required rows={6} className="input-base resize-none" placeholder="Tell me about your project…" />
              </Field>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-foreground text-background rounded-sm text-sm font-medium hover:bg-[var(--accent)] transition-colors disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send message</>}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">{label}</span>
      {children}
    </label>
  );
}