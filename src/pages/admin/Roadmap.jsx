import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '@/api/apiClient';
import { Plus, Pencil, Trash2, Loader2, GripVertical, CalendarDays, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', accent: 'bg-slate-400' },
  { id: 'in-progress', label: 'In Progress', accent: 'bg-blue-500' },
  { id: 'on-hold', label: 'On Hold', accent: 'bg-amber-500' },
  { id: 'completed', label: 'Completed', accent: 'bg-emerald-500' },
];

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

function formatDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

export default function Roadmap() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.entities.RoadmapItem.list('-display_order', 200);
      setItems(list || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const byStatus = useMemo(() => {
    const map = { backlog: [], 'in-progress': [], 'on-hold': [], completed: [] };
    (items || []).forEach((it) => {
      const k = map[it.status] ? it.status : 'backlog';
      map[k].push(it);
    });
    return map;
  }, [items]);

  const openNew = (status = 'backlog') => setEditing({ status, priority: 'medium', display_order: 0 });
  const openEdit = (it) => setEditing({ ...it });
  const close = () => setEditing(null);
  const setField = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const save = async () => {
    if (!editing?.title?.trim()) return;
    setSaving(true);
    try {
      const payload = { ...editing };
      ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by'].forEach((k) => delete payload[k]);
      if (editing.id) {
        await api.entities.RoadmapItem.update(editing.id, payload);
      } else {
        await api.entities.RoadmapItem.create(payload);
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
      await api.entities.RoadmapItem.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId;
    const item = items.find((it) => it.id === draggableId);
    if (!item || item.status === newStatus) return;

    // Optimistic update
    setItems((prev) => (prev || []).map((it) => (it.id === item.id ? { ...it, status: newStatus } : it)));
    try {
      await api.entities.RoadmapItem.update(item.id, { status: newStatus });
    } catch {
      // Revert on failure
      setItems((prev) => (prev || []).map((it) => (it.id === item.id ? { ...it, status: item.status } : it)));
      alert('Could not move item. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
          <p className="text-sm text-slate-500 mt-1">Track work in development and planned for the future.</p>
        </div>
        <Button onClick={() => openNew('backlog')}><Plus className="w-4 h-4 mr-1" /> Add item</Button>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="bg-slate-100/70 rounded-lg border border-slate-200 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                    <span className="text-sm font-medium text-slate-700">{col.label}</span>
                  </div>
                  <span className="text-xs text-slate-400">{byStatus[col.id].length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/60' : ''}`}
                    >
                      {byStatus[col.id].map((it, index) => (
                        <Draggable key={it.id} draggableId={it.id} index={index}>
                          {(p, s) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              className={`bg-white rounded-md border border-slate-200 p-3 shadow-sm ${s.isDragging ? 'shadow-md ring-2 ring-slate-300' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                <span {...p.dragHandleProps} className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab">
                                  <GripVertical className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-medium text-slate-900 leading-snug">{it.title}</h3>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button onClick={() => openEdit(it)} className="p-1 text-slate-400 hover:text-slate-700 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setDeleteTarget(it)} className="p-1 text-slate-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                  {it.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">{it.description}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    {it.priority && (
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_STYLES[it.priority]}`}>
                                        <Flag className="w-2.5 h-2.5" />{it.priority}
                                      </span>
                                    )}
                                    {it.category && (
                                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">{it.category}</span>
                                    )}
                                    {it.target_date && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                                        <CalendarDays className="w-2.5 h-2.5" />{formatDate(it.target_date)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {byStatus[col.id].length === 0 && (
                        <button onClick={() => openNew(col.id)} className="w-full text-xs text-slate-400 hover:text-slate-600 border border-dashed border-slate-300 rounded-md py-3 hover:bg-white/50 transition-colors">
                          + Add to {col.label}
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit roadmap item' : 'New roadmap item'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div>
                <Label className="text-xs text-slate-600 mb-1.5 block">Title</Label>
                <Input value={editing.title || ''} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Redesign project case studies" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1.5 block">Description</Label>
                <Textarea value={editing.description || ''} onChange={(e) => setField('description', e.target.value)} placeholder="What does this involve?" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Status</Label>
                  <select value={editing.status || 'backlog'} onChange={(e) => setField('status', e.target.value)} className="admin-input">
                    {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Priority</Label>
                  <select value={editing.priority || 'medium'} onChange={(e) => setField('priority', e.target.value)} className="admin-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Category</Label>
                  <Input value={editing.category || ''} onChange={(e) => setField('category', e.target.value)} placeholder="e.g. Feature, Refactor" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1.5 block">Target Date</Label>
                  <Input type="date" value={editing.target_date || ''} onChange={(e) => setField('target_date', e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving || !editing?.title?.trim()}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this roadmap item?"
        description={deleteTarget ? `"${deleteTarget.title}" will be permanently removed.` : ''}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}