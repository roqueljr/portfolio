export default function SectionLabel({ index, label }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      <span className="font-mono text-xs text-[var(--accent)]">{String(index).padStart(2, '0')}</span>
      <span className="h-px w-10 bg-[var(--accent)]" />
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}