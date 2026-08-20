import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { ArrowLeft, Archive, MailOpen, Trash2, Loader2, Send, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

function replySubject(subject) {
  const value = String(subject || 'Your inquiry').trim();
  return /^re:/i.test(value) ? value : `Re: ${value}`;
}

export default function MessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState(null);
  const [replies, setReplies] = useState([]);
  const [emailSettings, setEmailSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');

  const loadReplies = async () => {
    const list = await api.messages.replies(id);
    setReplies(list || []);
  };

  useEffect(() => {
    (async () => {
      try {
        const m = await api.entities.ContactMessage.get(id);
        setMsg(m);
        setSubject(replySubject(m?.subject));
        if (m && !m.read) await api.entities.ContactMessage.update(id, { read: true });

        const [settingsResult, repliesResult] = await Promise.allSettled([
          api.email.settings(),
          api.messages.replies(id),
        ]);
        if (settingsResult.status === 'fulfilled') setEmailSettings(settingsResult.value);
        if (repliesResult.status === 'fulfilled') setReplies(repliesResult.value || []);
      } catch { navigate('/admin/messages'); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const archive = async () => {
    try { await api.entities.ContactMessage.update(id, { archived: !msg.archived }); setMsg({ ...msg, archived: !msg.archived }); } catch (e) { alert(e?.message); }
  };
  const markUnread = async () => {
    try { await api.entities.ContactMessage.update(id, { read: false }); setMsg({ ...msg, read: false }); navigate('/admin/messages'); } catch (e) { alert(e?.message); }
  };
  const del = async () => {
    setDeleting(true);
    try { await api.entities.ContactMessage.delete(id); navigate('/admin/messages'); }
    catch (e) { alert(e?.message); }
    finally { setDeleting(false); }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    setReplyError(''); setReplySuccess('');
    if (!replyBody.trim()) { setReplyError('Write a reply before sending.'); return; }
    setSending(true);
    try {
      await api.messages.reply(id, { subject, body: replyBody });
      setReplyBody('');
      setReplySuccess(`Reply sent to ${msg.email}.`);
      await loadReplies();
    } catch (err) {
      setReplyError(err?.message || 'Could not send the reply.');
    } finally { setSending(false); }
  };

  const smtpReady = Boolean(emailSettings?.smtp?.configured);
  const signature = emailSettings?.settings?.reply_signature || '';
  const sortedReplies = useMemo(() => [...replies].sort((a, b) => new Date(a.sent_date) - new Date(b.sent_date)), [replies]);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!msg) return null;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/messages" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to messages
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold break-words">{msg.subject || 'No subject'}</h1>
            <p className="text-sm text-slate-500 mt-1 break-all">
              From <span className="font-medium text-slate-700">{msg.name}</span>{' '}
              <a href={`mailto:${msg.email}`} className="text-[var(--accent)] hover:underline">&lt;{msg.email}&gt;</a>
            </p>
            <p className="text-xs text-slate-400 mt-1">{new Date(msg.created_date).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" onClick={archive}><Archive className="w-4 h-4 mr-1" /> {msg.archived ? 'Unarchive' : 'Archive'}</Button>
            <Button variant="outline" size="sm" onClick={markUnread}><MailOpen className="w-4 h-4 mr-1" /> Unread</Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmDel(true)}><Trash2 className="w-4 h-4 mr-1 text-red-500" /></Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm border-y border-slate-100 py-4">
          <Detail label="Company" value={msg.company} />
          <Detail label="Project type" value={msg.project_type} />
          <Detail label="Budget" value={msg.budget_range} />
          <Detail label="Status" value={msg.archived ? 'Archived' : msg.read ? 'Read' : 'Unread'} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Message</p>
          <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
        </div>
      </div>

      {sortedReplies.length > 0 && (
        <section className="mt-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Sent replies</h2>
          {sortedReplies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium">{reply.subject}</p>
                  <p className="text-xs text-slate-400">To {reply.to_email}</p>
                </div>
                <p className="text-xs text-slate-400">{new Date(reply.sent_date).toLocaleString()}</p>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{reply.body}</p>
            </div>
          ))}
        </section>
      )}

      <form onSubmit={sendReply} className="mt-5 bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-semibold">Reply to {msg.name}</h2>
            <p className="text-xs text-slate-500 mt-1">Send directly to {msg.email} from the CMS.</p>
          </div>
          <Link to="/admin/email" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">Email settings <ExternalLink className="w-3.5 h-3.5" /></Link>
        </div>

        {!smtpReady && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">SMTP is not configured yet. Add your SMTP environment variables before sending replies.</div>}

        <div className="space-y-4">
          <div>
            <Label className="admin-label" htmlFor="reply-subject">Subject</Label>
            <Input id="reply-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} />
          </div>
          <div>
            <Label className="admin-label" htmlFor="reply-body">Reply</Label>
            <Textarea id="reply-body" rows={8} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write your reply…" />
            {signature && <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">Your configured signature will be added automatically:
{signature}</p>}
          </div>
        </div>

        {replyError && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{replyError}</div>}
        {replySuccess && <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{replySuccess}</div>}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" disabled={sending || !smtpReady}>
            {sending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            {sending ? 'Sending…' : 'Send reply'}
          </Button>
          <a href={`mailto:${msg.email}?subject=${encodeURIComponent(subject)}`}><Button type="button" variant="outline">Open mail app</Button></a>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Delete this message?"
        description="This message will be permanently removed. This action cannot be undone."
        onConfirm={del}
        loading={deleting}
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-700 break-words">{value || '—'}</p>
    </div>
  );
}
