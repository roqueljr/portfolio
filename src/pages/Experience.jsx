import { useExperiences } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';

export default function Experience() {
  const { data: experiences, isLoading } = useExperiences();

  return (
    <div className="pt-16 sm:pt-20">
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Experience</p>
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight">A working timeline</h1>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16">
        {isLoading ? (
          <div className="space-y-8">{[0,1,2].map((i) => <div key={i} className="h-40 bg-muted/40 animate-pulse rounded-sm" />)}</div>
        ) : !experiences?.length ? (
          <p className="text-muted-foreground">No experience records yet.</p>
        ) : (
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-0 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-px" aria-hidden="true" />
            <div className="space-y-16 sm:space-y-24">
              {experiences.map((exp, i) => (
                <Reveal key={exp.id}>
                  <div className={`relative grid gap-4 sm:grid-cols-2 ${i % 2 === 0 ? '' : 'sm:[direction:rtl]'}`}>
                    <div className="hidden sm:block" />
                    <div className={`sm:pl-12 [direction:ltr] ${i % 2 === 0 ? 'sm:pl-12' : 'sm:pr-12 sm:pl-0 sm:text-right'}`}>
                      <span className="absolute left-0 sm:left-1/2 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--accent)] border-4 border-background" />
                      <p className="font-mono text-xs text-muted-foreground mb-2">
                        {fmtDate(exp.start_date)} — {exp.currently_working ? 'Present' : fmtDate(exp.end_date)}
                      </p>
                      <h3 className="font-heading text-2xl sm:text-3xl font-medium">{exp.position}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        {exp.company_url ? (
                          <a href={exp.company_url} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)]">{exp.company}</a>
                        ) : exp.company}
                        {exp.location && <span>· {exp.location}</span>}
                      </div>
                      {exp.description && <p className="mt-4 text-muted-foreground max-w-xl">{exp.description}</p>}
                      {exp.responsibilities?.length > 0 && (
                        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                          {exp.responsibilities.map((r, ri) => (
                            <li key={ri} className="flex gap-2"><span className="text-[var(--accent)]">—</span>{r}</li>
                          ))}
                        </ul>
                      )}
                      {exp.technologies?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {exp.technologies.map((t, ti) => (
                            <span key={ti} className="px-2.5 py-1 text-[11px] font-mono border border-border rounded-full text-muted-foreground">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); } catch { return d; }
}