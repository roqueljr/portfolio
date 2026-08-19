import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { ArrowLeft, Archive, MailOpen, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function MessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await api.entities.ContactMessage.get(id);
        setMsg(m);
        if (m && !m.read) { await api.entities.ContactMessage.update(id, { read: true }); }
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

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!msg) return null;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/messages" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to messages
      </Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold">{msg.subject || 'No subject'}</h1>
            <p className="text-sm text-slate-500 mt-1">
              From <span className="font-medium text-slate-700">{msg.name}</span>{' '}
              <a href={`mailto:${msg.email}`} className="text-[var(--accent)] hover:underline">&lt;{msg.email}&gt;</a>
            </p>
            <p className="text-xs text-slate-400 mt-1">{new Date(msg.created_date).toLocaleString()}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={archive}><Archive className="w-4 h-4 mr-1" /> {msg.archived ? 'Unarchive' : 'Archive'}</Button>
            <Button variant="outline" size="sm" onClick={markUnread}><MailOpen className="w-4 h-4 mr-1" /> Unread</Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmDel(true)}><Trash2 className="w-4 h-4 mr-1 text-red-500" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-y border-slate-100 py-4">
          <Detail label="Company" value={msg.company} />
          <Detail label="Project type" value={msg.project_type} />
          <Detail label="Budget" value={msg.budget_range} />
          <Detail label="Status" value={msg.archived ? 'Archived' : msg.read ? 'Read' : 'Unread'} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Message</p>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100">
          <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your inquiry')}`}>
            <Button>Reply by email</Button>
          </a>
        </div>
      </div>

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
      <p className="text-slate-700">{value || '—'}</p>
    </div>
  );
}