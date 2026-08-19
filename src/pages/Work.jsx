import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useProjects, useCategories, formatProjectNumber } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';
import ProjectIndex from '@/components/portfolio/ProjectIndex';

export default function Work() {
  const { data: projects, isLoading } = useProjects();
  const { data: categories } = useCategories();
  const [view, setView] = useState('visual'); // 'visual' | 'index'
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === 'all') return projects;
    return projects.filter((p) => p.category === filter);
  }, [projects, filter]);

  return (
    <div className="pt-16 sm:pt-20">
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-10">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Archive</p>
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight">Selected Work</h1>
        <p className="mt-6 max-w-xl text-muted-foreground text-lg">
          A curated index of projects across web, mobile, and systems. Browse visually or as a compact directory.
        </p>
      </section>

      {/* Controls */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 sticky top-16 sm:top-20 z-30 bg-background/85 backdrop-blur-md py-4 border-y border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
            {categories?.map((c) => (
              <FilterChip key={c.id} active={filter === c.name} onClick={() => setFilter(c.name)}>{c.name}</FilterChip>
            ))}
            {categories?.length === 0 && projects?.length > 0 && (
              [...new Set(projects.map((p) => p.category).filter(Boolean))].map((c) => (
                <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</FilterChip>
              ))
            )}
          </div>
          <div className="flex items-center gap-1 border border-border rounded-sm p-1 self-start sm:self-auto">
            <button
              onClick={() => setView('visual')}
              className={`p-1.5 rounded-sm transition-colors ${view === 'visual' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
              aria-label="Visual view"
            ><LayoutGrid className="w-4 h-4" /></button>
            <button
              onClick={() => setView('index')}
              className={`p-1.5 rounded-sm transition-colors ${view === 'index' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
              aria-label="Index view"
            ><List className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2">{[0,1,2,3].map((i) => <div key={i} className="h-72 bg-muted/40 animate-pulse rounded-sm" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-20 text-center">No projects in this category yet.</p>
        ) : view === 'index' ? (
          <ProjectIndex projects={filtered} />
        ) : (
          <div className="grid gap-8 sm:gap-x-6 sm:gap-y-16 sm:grid-cols-2">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 2) * 0.1}>
                <Link to={`/projects/${p.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                    {p.thumbnail ? (
                      <Image src={p.thumbnail} alt={p.title} fittingType="fill" className="w-full h-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]" />
                    ) : <div className="w-full h-full" />}
                    <span className="absolute top-3 left-3 font-mono text-xs text-background/90 mix-blend-difference">{formatProjectNumber(i)}</span>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="font-heading text-xl sm:text-2xl font-medium group-hover:text-[var(--accent)] transition-colors">{p.title}</h3>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{p.year}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.category}{p.client ? ` · ${p.client}` : ''}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest rounded-full border transition-colors ${
        active ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
      }`}
    >
      {children}
    </button>
  );
}