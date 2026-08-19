import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Plus, Search, Pencil, Trash2, Star, Copy, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

export default function AdminProjects() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.entities.Project.list('-display_order', 200);
      setItems(list || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((p) => [p.title, p.category, p.client, p.slug].some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [items, search]);

  const toggle = async (p, key) => {
    setBusy((b) => ({ ...b, [p.id]: true }));
    try {
      await api.entities.Project.update(p.id, { [key]: !p[key] });
      await load();
    } catch (e) { alert(e?.message || 'Failed.'); }
    finally { setBusy((b) => ({ ...b, [p.id]: false })); }
  };

  const duplicate = async (p) => {
    setBusy((b) => ({ ...b, ['dup']: true }));
    try {
      const { id, created_date, updated_date, created_by_id, created_by, ...rest } = p;
      await api.entities.Project.create({ ...rest, title: `${p.title} (copy)`, slug: `${p.slug}-copy`, status: 'draft', featured: false });
      await load();
    } catch (e) { alert(e?.message || 'Failed to duplicate.'); }
    finally { setBusy((b) => ({ ...b, ['dup']: false })); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.entities.Project.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) { alert(e?.message || 'Failed.'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">{items?.length ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects…" className="pl-9 w-52" />
          </div>
          <Link to="/admin/projects/new"><Button><Plus className="w-4 h-4 mr-1" /> New Project</Button></Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No projects yet.</p>
            <Link to="/admin/projects/new"><Button variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-1" /> Create your first project</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Project</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Year</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Featured</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/projects/${p.id}/edit`} className="font-medium hover:text-[var(--accent)]">{p.title}</Link>
                      <p className="text-xs text-slate-400">/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.year || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(p, 'status')}
                        disabled={busy[p.id]}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(p, 'featured')} disabled={busy[p.id]}>
                        <Star className={`w-4 h-4 ${p.featured ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {p.status === 'published' && (
                        <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className="inline p-1.5 text-slate-400 hover:text-slate-700"><ExternalLink className="w-4 h-4" /></a>
                      )}
                      <Link to={`/admin/projects/${p.id}/edit`} className="inline p-1.5 text-slate-500 hover:text-slate-900"><Pencil className="w-4 h-4" /></Link>
                      <button onClick={() => duplicate(p)} disabled={busy.dup} className="inline p-1.5 text-slate-500 hover:text-slate-900 ml-1"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(p)} className="inline p-1.5 text-slate-500 hover:text-red-600 ml-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title='Delete this project?'
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed. This action cannot be undone.` : ''}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}