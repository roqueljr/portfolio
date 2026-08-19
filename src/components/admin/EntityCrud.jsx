import { useState, useMemo, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Plus, Pencil, Trash2, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmDialog from './ConfirmDialog';
import ImageUpload from './ImageUpload';
import RichTextEditor from './RichTextEditor';

// Generic CRUD page for simple entities.
// fields: [{ key, label, type, options?, multiple?, placeholder?, span? }]
export default function EntityCrud({ entity, title, singular, fields, columns, searchKeys = [], defaultValues = {}, orderKey = 'display_order' }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} | item
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.entities[entity].list(`-${orderKey}`, 200);
      setItems(list || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it) => (searchKeys.length ? searchKeys : Object.keys(it)).some((k) => String(it[k] ?? '').toLowerCase().includes(q)));
  }, [items, search]);

  const openNew = () => setEditing({ ...defaultValues });
  const openEdit = (it) => setEditing({ ...it });
  const close = () => setEditing(null);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing };
      // strip built-ins
      ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by'].forEach((k) => delete payload[k]);
      if (editing.id) {
        await api.entities[entity].update(editing.id, payload);
      } else {
        await api.entities[entity].create(payload);
      }
      setEditing(null);
      await load();
    } catch (e) {
      alert(e?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.entities[entity].delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  const setField = (key, val) => setEditing((e) => ({ ...e, [key]: val }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{items?.length ?? 0} {items?.length === 1 ? singular.toLowerCase() : `${singular.toLowerCase()}s`}</p>
        </div>
        <div className="flex items-center gap-2">
          {searchKeys.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 w-48" />
            </div>
          )}
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Add {singular}</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">No {singular.toLowerCase()}s yet.</p>
            <Button onClick={openNew} variant="outline" className="mt-4"><Plus className="w-4 h-4 mr-1" /> Create your first {singular.toLowerCase()}</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  {columns.map((c) => <th key={c.key} className="text-left px-4 py-3 font-medium">{c.label}</th>)}
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 align-middle">
                        {c.render ? c.render(it) : (String(it[c.key] ?? '').length > 60 ? String(it[c.key]).slice(0, 60) + '…' : String(it[c.key] ?? '—'))}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(it)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(it)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Edit ${singular}` : `New ${singular}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.span === 2 ? 'sm:col-span-2' : ''}>
                  <FormField field={f} value={editing[f.key]} onChange={(v) => setField(f.key, v)} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete this ${singular.toLowerCase()}?`}
        description={deleteTarget ? `"${columns.map((c) => deleteTarget[c.key]).filter(Boolean)[0] || ''}" will be permanently removed. This action cannot be undone.` : ''}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const { type = 'text', label, options, placeholder, multiple } = field;

  if (type === 'rich') {
    return (
      <div>
        <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
        <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} />
      </div>
    );
  }
  if (type === 'image') {
    return <ImageUpload value={value} onChange={onChange} label={label} multiple={multiple} />;
  }
  if (type === 'list') {
    return <ListInput label={label} value={value || []} onChange={onChange} placeholder={placeholder} />;
  }
  if (type === 'switch') {
    return (
      <div className="flex items-center justify-between py-1.5">
        <Label className="text-xs text-slate-600">{label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (type === 'select') {
    return (
      <div>
        <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="admin-input">
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <div>
        <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
        <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
      </div>
    );
  }
  if (type === 'number') {
    return (
      <div>
        <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
        <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} placeholder={placeholder} />
      </div>
    );
  }
  if (type === 'date') {
    return (
      <div>
        <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
        <Input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ListInput({ label, value, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (!v) return;
    onChange([...value, v]);
    setText('');
  };
  return (
    <div>
      <Label className="text-xs text-slate-600 mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder || 'Type and press Add'} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
    </div>
  );
}