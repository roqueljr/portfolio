import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { ArrowLeft, Save, Loader2, Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';

const EMPTY = {
  title: '', slug: '', excerpt: '', overview: '', category: '', client: '', role: '', year: new Date().getFullYear(),
  technologies: [], status: 'draft', featured: false, display_order: 0, cover_image: '', thumbnail: '', gallery_images: [],
  project_url: '', github_url: '', challenge: '', approach: '', solution: '', features: [], results: [],
  start_date: '', completion_date: '',
};

function slugify(s) { return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.entities.ProjectCategory.list('display_order', 50).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      try {
        const p = await api.entities.Project.get(id);
        setData({ ...EMPTY, ...p });
      } catch { navigate('/admin/projects'); }
      finally { setLoading(false); }
    })();
  }, [id, isNew, navigate]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const onTitleChange = (v) => {
    setData((d) => ({ ...d, title: v, slug: d.slug || slugify(v) }));
  };

  const save = async (publish) => {
    if (!data.title || !data.slug) { alert('Title and slug are required.'); return; }
    setSaving(true);
    try {
      const payload = { ...data, slug: slugify(data.slug), status: publish ? 'published' : data.status };
      ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by'].forEach((k) => delete payload[k]);
      if (isNew) {
        const created = await api.entities.Project.create(payload);
        navigate(`/admin/projects/${created.id}/edit`);
      } else {
        await api.entities.Project.update(id, payload);
      }
      alert('Saved.');
    } catch (e) { alert(e?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div>
      <Link to="/admin/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{isNew ? 'New Project' : data.title}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save draft</Button>
          <Button onClick={() => save(true)} disabled={saving}><Star className="w-4 h-4 mr-1" /> {data.status === 'published' ? 'Save & Publish' : 'Publish'}</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Basics">
            <div className="grid gap-4">
              <div>
                <Label className="admin-label">Title *</Label>
                <Input value={data.title} onChange={(e) => onTitleChange(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="admin-label">Slug *</Label>
                  <Input value={data.slug} onChange={(e) => set('slug', e.target.value)} placeholder="project-url-slug" />
                </div>
                <div>
                  <Label className="admin-label">Category</Label>
                  <select value={data.category} onChange={(e) => set('category', e.target.value)} className="admin-input">
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="admin-label">Short Description</Label>
                <Textarea value={data.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} />
              </div>
            </div>
          </Card>

          <Card title="Case Study">
            <div className="space-y-5">
              <div><Label className="admin-label">Overview</Label><RichTextEditor value={data.overview} onChange={(v) => set('overview', v)} /></div>
              <div><Label className="admin-label">Challenge</Label><RichTextEditor value={data.challenge} onChange={(v) => set('challenge', v)} /></div>
              <div><Label className="admin-label">Approach</Label><RichTextEditor value={data.approach} onChange={(v) => set('approach', v)} /></div>
              <div><Label className="admin-label">Solution</Label><RichTextEditor value={data.solution} onChange={(v) => set('solution', v)} /></div>
            </div>
          </Card>

          <Card title="Key Features">
            <ListEditor items={data.features} onChange={(v) => set('features', v)} placeholder="Add a feature…" />
          </Card>

          <Card title="Technologies">
            <ListEditor items={data.technologies} onChange={(v) => set('technologies', v)} placeholder="Add a technology…" />
          </Card>

          <Card title="Results / Metrics">
            <div className="space-y-3">
              {data.results.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r.value} onChange={(e) => set('results', data.results.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} placeholder="Value (e.g. 40%)" />
                  <Input value={r.label} onChange={(e) => set('results', data.results.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Label (e.g. faster load)" />
                  <button onClick={() => set('results', data.results.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <Button variant="outline" onClick={() => set('results', [...data.results, { value: '', label: '' }])}><Plus className="w-4 h-4 mr-1" /> Add result</Button>
            </div>
          </Card>

          <Card title="Gallery">
            <ImageUpload value={data.gallery_images} onChange={(v) => set('gallery_images', v)} multiple label="Gallery Images" aspect="aspect-video" />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Publish">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="admin-label">Featured</Label>
                <Switch checked={data.featured} onCheckedChange={(v) => set('featured', v)} />
              </div>
              <div>
                <Label className="admin-label">Status</Label>
                <select value={data.status} onChange={(e) => set('status', e.target.value)} className="admin-input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <Label className="admin-label">Display Order</Label>
                <Input type="number" value={data.display_order} onChange={(e) => set('display_order', Number(e.target.value))} />
              </div>
            </div>
          </Card>

          <Card title="Details">
            <div className="space-y-4">
              <div><Label className="admin-label">Client</Label><Input value={data.client} onChange={(e) => set('client', e.target.value)} /></div>
              <div><Label className="admin-label">Role</Label><Input value={data.role} onChange={(e) => set('role', e.target.value)} /></div>
              <div><Label className="admin-label">Year</Label><Input type="number" value={data.year} onChange={(e) => set('year', Number(e.target.value))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="admin-label">Start</Label><Input type="date" value={data.start_date} onChange={(e) => set('start_date', e.target.value)} /></div>
                <div><Label className="admin-label">Completed</Label><Input type="date" value={data.completion_date} onChange={(e) => set('completion_date', e.target.value)} /></div>
              </div>
            </div>
          </Card>

          <Card title="Links">
            <div className="space-y-4">
              <div><Label className="admin-label">Project URL</Label><Input value={data.project_url} onChange={(e) => set('project_url', e.target.value)} placeholder="https://…" /></div>
              <div><Label className="admin-label">GitHub URL</Label><Input value={data.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/…" /></div>
            </div>
          </Card>

          <Card title="Cover Image">
            <ImageUpload value={data.cover_image} onChange={(v) => set('cover_image', v)} label="Cover Image" aspect="aspect-video" />
          </Card>

          <Card title="Thumbnail">
            <ImageUpload value={data.thumbnail} onChange={(v) => set('thumbnail', v)} label="Thumbnail" aspect="aspect-video" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-sm mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => { const v = text.trim(); if (!v) return; onChange([...(items || []), v]); setText(''); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(items || []).map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs">
            {v}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" onClick={add}><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}