import { useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { api } from '@/api/apiClient';
import { Image } from '@/components/ui/image';

const MAX_SIZE = 6 * 1024 * 1024; // 6MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export default function ImageUpload({ value, onChange, label = 'Image', aspect = 'aspect-video', multiple = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files) => {
    setError('');
    const arr = Array.from(files);
    for (const f of arr) {
      if (!ACCEPTED.includes(f.type)) { setError('Please use JPG, PNG, WebP, or GIF.'); return; }
      if (f.size > MAX_SIZE) { setError('Each image must be under 6MB.'); return; }
    }
    setUploading(true);
    try {
      const urls = [];
      for (const f of arr) {
        const { file_url } = await api.integrations.Core.UploadFile({ file: f });
        urls.push(file_url);
      }
      if (multiple) {
        onChange([...(value || []), ...urls]);
      } else {
        onChange(urls[0] || '');
      }
    } catch (e) {
      setError(e?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx) => {
    if (multiple) {
      onChange((value || []).filter((_, i) => i !== idx));
    } else {
      onChange('');
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-2">{label}</label>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {!multiple && value ? (
        <div className={`relative ${aspect} w-full max-w-sm rounded-md overflow-hidden border border-slate-200 bg-slate-100`}>
          <Image src={value} alt="" fittingType="fill" className="w-full h-full" />
          <button type="button" onClick={() => remove()} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80">
            <X className="w-3.5 h-3.5" />
          </button>
          <label className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 text-white text-xs rounded cursor-pointer hover:bg-black/80">
            <Upload className="w-3 h-3 inline mr-1" /> Replace
            <input type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          </label>
        </div>
      ) : multiple ? (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {(value || []).map((url, i) => (
              <div key={i} className={`relative ${aspect} rounded-md overflow-hidden border border-slate-200 bg-slate-100`}>
                <Image src={url} alt="" fittingType="fill" className="w-full h-full" />
                <button type="button" onClick={() => remove(i)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className={`${aspect} flex flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 cursor-pointer hover:border-slate-400 text-slate-400`}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-[10px] mt-1">Add</span></>}
              <input type="file" accept={ACCEPTED.join(',')} multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </label>
          </div>
        </div>
      ) : (
        <label className={`${aspect} w-full max-w-sm flex flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 cursor-pointer hover:border-slate-400 text-slate-400`}>
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ImageIcon className="w-6 h-6" /><span className="text-xs mt-2">Click to upload</span><span className="text-[10px] text-slate-400">JPG, PNG, WebP · max 6MB</span></>}
          <input type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </label>
      )}
    </div>
  );
}