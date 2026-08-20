import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Save, Loader2, CheckCircle2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/admin/ImageUpload';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { defaultSettings } from '@/lib/portfolio';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [data, setData] = useState(defaultSettings);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.entities.SiteSettings.list();
        if (list && list[0]) { setData({ ...defaultSettings, ...list[0] }); setRecordId(list[0].id); }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...data };
      ['id', 'created_date', 'updated_date', 'created_by_id', 'created_by'].forEach((k) => delete payload[k]);
      if (recordId) {
        await api.entities.SiteSettings.update(recordId, payload);
      } else {
        const created = await api.entities.SiteSettings.create(payload);
        setRecordId(created.id);
      }
      setSaved(true);
      queryClient.setQueryData(['siteSettings'], { ...defaultSettings, ...data, id: recordId });
      await queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      document.documentElement.style.setProperty('--accent', data.accent_color);
    } catch (e) { alert(e?.message || 'Failed to save settings.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your portfolio identity and configuration.</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> : <Save className="w-4 h-4 mr-1" />}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="Identity">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name"><Input value={data.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
            <Field label="Short Name"><Input value={data.short_name} onChange={(e) => set('short_name', e.target.value)} /></Field>
            <Field label="Professional Title"><Input value={data.professional_title} onChange={(e) => set('professional_title', e.target.value)} /></Field>
            <Field label="Tagline"><Input value={data.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
            <Field label="Years of Experience"><Input type="number" value={data.years_experience} onChange={(e) => set('years_experience', Number(e.target.value))} /></Field>
            <Field label="Location"><Input value={data.location} onChange={(e) => set('location', e.target.value)} /></Field>
          </div>
          <div className="mt-4"><Field label="Biography"><RichTextEditor value={data.biography} onChange={(v) => set('biography', v)} /></Field></div>
          <div className="mt-4"><Field label="Professional Summary"><Textarea value={data.professional_summary} onChange={(e) => set('professional_summary', e.target.value)} rows={2} /></Field></div>
          <div className="mt-4"><Field label="Personal Statement"><Textarea value={data.personal_statement} onChange={(e) => set('personal_statement', e.target.value)} rows={2} /></Field></div>
          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <ImageUpload value={data.profile_picture} onChange={(v) => set('profile_picture', v)} label="Profile Picture" aspect="aspect-[4/5]" />
            <ImageUpload value={data.logo} onChange={(v) => set('logo', v)} label="Logo" aspect="aspect-video" />
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" value={data.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Phone"><Input value={data.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Social Media">
          <div className="grid sm:grid-cols-2 gap-4">
            {['github','linkedin','facebook','instagram','twitter','youtube','behance','dribbble'].map((p) => (
              <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)}>
                <Input value={data[p] || ''} onChange={(e) => set(p, e.target.value)} placeholder={`https://${p}.com/…`} />
              </Field>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Tip: for full control, also manage Social Links from the dedicated section. Leave empty to hide.</p>
        </Section>

        <Section title="Hero">
          <Field label="Hero Heading"><Textarea value={data.hero_heading} onChange={(e) => set('hero_heading', e.target.value)} rows={2} /></Field>
          <div className="mt-4"><Field label="Hero Introduction"><Textarea value={data.hero_introduction} onChange={(e) => set('hero_introduction', e.target.value)} rows={2} /></Field></div>
        </Section>

        <Section title="Availability">
          <div className="flex items-center justify-between">
            <Label className="admin-label">Available for work</Label>
            <Switch checked={data.availability_status} onCheckedChange={(v) => set('availability_status', v)} />
          </div>
          <div className="mt-4"><Field label="Availability Message"><Input value={data.availability_message} onChange={(e) => set('availability_message', e.target.value)} /></Field></div>
        </Section>

        <Section title="Footer CTA">
          <Field label="Footer CTA Heading"><Input value={data.footer_cta_heading} onChange={(e) => set('footer_cta_heading', e.target.value)} /></Field>
          <div className="mt-4"><Field label="Footer CTA Subheading"><Input value={data.footer_cta_subheading} onChange={(e) => set('footer_cta_subheading', e.target.value)} /></Field></div>
        </Section>

        <Section title="Appearance & Assets">
          <FaviconField value={data.favicon || ''} onChange={(v) => set('favicon', v)} />
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <Field label="Accent Color">
              <div className="flex items-center gap-3">
                <input type="color" value={data.accent_color} onChange={(e) => set('accent_color', e.target.value)} className="w-12 h-10 rounded border border-slate-200 cursor-pointer" />
                <Input value={data.accent_color} onChange={(e) => set('accent_color', e.target.value)} />
              </div>
            </Field>
            <Field label="Resume / CV URL"><Input value={data.resume_url} onChange={(e) => set('resume_url', e.target.value)} placeholder="Upload via button below" /></Field>
          </div>
          <div className="mt-4">
            <Label className="admin-label">Upload Résumé (PDF)</Label>
            <input type="file" accept="application/pdf" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              try { const { file_url } = await api.integrations.Core.UploadFile({ file: f }); set('resume_url', file_url); } catch (err) { alert('Upload failed.'); }
            }} className="text-sm text-slate-500" />
          </div>
          <div className="mt-4"><ImageUpload value={data.default_seo_image} onChange={(v) => set('default_seo_image', v)} label="Default SEO / Social Image" aspect="aspect-[1200/630]" /></div>
        </Section>

        <Section title="SEO">
          <Field label="Default SEO Title"><Input value={data.seo_title} onChange={(e) => set('seo_title', e.target.value)} /></Field>
          <div className="mt-4"><Field label="Default SEO Description"><Textarea value={data.seo_description} onChange={(e) => set('seo_description', e.target.value)} rows={2} /></Field></div>
        </Section>

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}


function FaviconField({ value, onChange }) {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError('');

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Use a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please choose an image under 2MB.');
      return;
    }

    setProcessing(true);
    try {
      const dataUrl = await resizeFavicon(file);
      onChange(dataUrl);
    } catch {
      setError('Could not process this image. Please try another file.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Label className="admin-label">Browser Tab Icon / Favicon</Label>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 p-4">
        <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
          {value ? <img src={value} alt="Favicon preview" className="w-10 h-10 object-contain" /> : <span className="text-[10px] text-slate-400 text-center px-1">No icon</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700">Website browser icon</p>
          <p className="text-xs text-slate-500 mt-1">Upload a square PNG, JPG, or WebP. It is resized to 128×128 and stored in the database, so it survives Render redeploys.</p>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <div className="flex items-center gap-2 mt-3">
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium cursor-pointer hover:bg-slate-50">
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {value ? 'Replace icon' : 'Upload icon'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={processing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleFile(file);
                  e.target.value = '';
                }}
              />
            </label>
            {value && (
              <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function resizeFavicon(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas is unavailable.'));

        ctx.clearRect(0, 0, size, size);
        const scale = Math.min(size / img.width, size / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        ctx.drawImage(img, x, y, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-sm mb-4">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <Label className="admin-label">{label}</Label>
      {children}
    </div>
  );
}