import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Search, MailOpen, Mail, Archive, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function AdminMessages() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('inbox'); // inbox | unread | archived
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.entities.ContactMessage.list('-created_date', 200);
      setItems(list || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    let res = items;
    if (filter === 'unread') res = res.filter((m) => !m.read && !m.archived);
    else if (filter === 'archived') res = res.filter((m) => m.archived);
    else res = res.filter((m) => !m.archived);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((m) => [m.name, m.email, m.subject, m.message].some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return res;
  }, [items, search, filter]);

  const markRead = async (m, val) => {
    try { await api.entities.ContactMessage.update(m.id, { read: val }); await load(); } catch (e) { alert(e?.message); }
  };
  const toggleArchive = async (m) => {
    try { await api.entities.ContactMessage.update(m.id, { archived: !m.archived }); await load(); } catch (e) { alert(e?.message); }
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.entities.ContactMessage.delete(deleteTarget.id); setDeleteTarget(null); await load(); }
    catch (e) { alert(e?.message); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Messages</h1>
      <p className="text-sm text-slate-500 mb-6">Inquiries from your contact form.</p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-1">
          {['inbox', 'unread', 'archived'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>{f}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages…" className="pl-9 w-56" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No messages here.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <button onClick={() => markRead(m, !m.read)}>
                  {m.read ? <Mail className="w-4 h-4 text-slate-300" /> : <MailOpen className="w-4 h-4 text-[var(--accent)]" />}
                </button>
                <Link to={`/admin/messages/${m.id}`} className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className={`text-sm truncate ${m.read ? 'font-normal text-slate-600' : 'font-semibold'}`}>{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>
                  <p className={`text-sm truncate ${m.read ? 'text-slate-400' : 'text-slate-700'}`}>{m.subject || 'No subject'} — {m.message}</p>
                </Link>
                <span className="text-xs text-slate-400 shrink-0 hidden sm:block">{new Date(m.created_date).toLocaleDateString()}</span>
                <button onClick={() => toggleArchive(m)} className="p-1.5 text-slate-400 hover:text-slate-700"><Archive className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(m)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this message?"
        description="This message will be permanently removed. This action cannot be undone."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}