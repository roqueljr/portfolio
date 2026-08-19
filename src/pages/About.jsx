import { Download, MapPin, Mail } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSettings, useSkills, useEducation, useCertifications } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';
import SectionLabel from '@/components/portfolio/SectionLabel';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

const LEVEL_DOTS = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };

export default function About() {
  const { data: settings } = useSettings();
  const { data: skills } = useSkills();
  const { data: education } = useEducation();
  const { data: certifications } = useCertifications();

  // Group skills by category
  const skillGroups = {};
  (skills || []).forEach((s) => {
    const c = s.category || 'Other';
    if (!skillGroups[c]) skillGroups[c] = [];
    skillGroups[c].push(s);
  });

  return (
    <div className="pt-16 sm:pt-20">
      {/* Intro */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">About</p>
        <div className="grid gap-10 lg:grid-cols-12 items-end">
          <h1 className="lg:col-span-8 font-heading text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.98]">
            {settings?.professional_summary || settings?.tagline || `${settings?.full_name} — ${settings?.professional_title}`}
          </h1>
          <div className="lg:col-span-4 space-y-2 text-sm text-muted-foreground">
            {settings?.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {settings.location}</p>}
            {settings?.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {settings.email}</p>}
            <p>{settings?.years_experience || 0} years of experience</p>
          </div>
        </div>
      </section>

      {/* Portrait + bio */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16 grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-5 flex justify-center lg:block min-w-0">
          {settings?.profile_picture ? (
            <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-none aspect-[4/5] overflow-hidden rounded-sm bg-muted mx-auto lg:mx-0">
              <Image src={settings.profile_picture} alt={settings?.full_name} fittingType="fill" className="w-full h-full" />
            </div>
          ) : <div className="w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-none aspect-[4/5] rounded-sm bg-muted/40 mx-auto lg:mx-0" />}
        </Reveal>
        <div className="lg:col-span-7 lg:pt-4 min-w-0 max-w-full">
          {settings?.biography ? (
            <div className="prose-portfolio text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.biography) }} />
          ) : (
            <p className="text-muted-foreground">Biography coming soon.</p>
          )}
          {settings?.resume_url && (
            <a href={settings.resume_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 px-5 py-3 border border-border rounded-sm text-sm hover:border-foreground transition-colors">
              <Download className="w-4 h-4" /> Download Résumé
            </a>
          )}
        </div>
      </section>

      {/* Personal statement */}
      {settings?.personal_statement && (
        <section className="border-y border-border">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
            <Reveal>
              <p className="font-heading text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-tight max-w-4xl">
                {settings.personal_statement}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* Capabilities index */}
      {skills?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
          <Reveal><SectionLabel index={1} label="Capabilities" /></Reveal>
          <div className="grid gap-12 sm:grid-cols-2">
            {Object.entries(skillGroups).map(([cat, items], gi) => (
              <Reveal key={cat} delay={gi * 0.05}>
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-5">{cat}</p>
                <ul className="space-y-3">
                  {items.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {s.years_experience > 0 && <span className="text-xs font-mono text-muted-foreground">{s.years_experience}y</span>}
                        <div className="flex gap-1">
                          {[1,2,3,4].map((d) => (
                            <span key={d} className={`w-1.5 h-1.5 rounded-full ${d <= (LEVEL_DOTS[s.level] || 0) ? 'bg-[var(--accent)]' : 'bg-border'}`} />
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
          <Reveal><SectionLabel index={2} label="Education" /></Reveal>
          <div className="space-y-8">
            {education.map((e) => (
              <Reveal key={e.id}>
                <div className="grid gap-2 sm:grid-cols-12 border-b border-border/60 pb-8">
                  <div className="sm:col-span-3 font-mono text-sm text-muted-foreground">{e.start_year}{e.end_year ? ` — ${e.end_year}` : ' — Present'}</div>
                  <div className="sm:col-span-9">
                    <h3 className="font-heading text-2xl font-medium">{e.school}</h3>
                    <p className="text-muted-foreground">{e.degree}{e.field_of_study ? ` · ${e.field_of_study}` : ''}</p>
                    {e.description && <p className="mt-2 text-sm text-muted-foreground max-w-xl">{e.description}</p>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
          <Reveal><SectionLabel index={3} label="Certifications" /></Reveal>
          <div className="grid gap-px sm:grid-cols-2 border border-border">
            {certifications.map((c) => (
              <Reveal key={c.id} className="p-6 sm:p-8 border-border sm:[&:nth-child(odd)]:border-r">
                <h3 className="font-heading text-xl font-medium">{c.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.issuing_organization}</p>
                {c.issue_date && <p className="text-xs font-mono text-muted-foreground mt-3">Issued {c.issue_date}</p>}
                {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-[var(--accent)]">Verify credential ↗</a>}
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Interests */}
      {settings?.interests?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
          <Reveal><SectionLabel index={4} label="Beyond the Work" /></Reveal>
          <div className="flex flex-wrap gap-3">
            {settings.interests.map((it, i) => (
              <span key={i} className="px-4 py-2 border border-border rounded-full text-sm text-muted-foreground">{it}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}