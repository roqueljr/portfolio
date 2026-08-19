import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useServices, useTestimonials, useSettings } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';
import SectionLabel from '@/components/portfolio/SectionLabel';

export default function Services() {
  const { data: services } = useServices();
  const { data: testimonials } = useTestimonials();
  const { data: settings } = useSettings();

  return (
    <div className="pt-16 sm:pt-20">
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-12">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6">Services</p>
        <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-medium tracking-tight max-w-[12ch]">
          How I can help
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground text-lg">
          {settings?.tagline} — end-to-end delivery, from first sketch to production.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 sm:py-16">
        {!services?.length ? (
          <p className="text-muted-foreground">No services listed yet.</p>
        ) : (
          <div className="border-t border-border">
            {services.map((s, i) => (
              <Reveal key={s.id}>
                <div className="group grid gap-6 sm:grid-cols-12 border-b border-border py-10 sm:py-12">
                  <div className="sm:col-span-1 font-mono text-sm text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</div>
                  <div className="sm:col-span-5">
                    <h2 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight group-hover:text-[var(--accent)] transition-colors">{s.title}</h2>
                  </div>
                  <div className="sm:col-span-6">
                    <p className="text-muted-foreground">{s.description}</p>
                    {s.features?.length > 0 && (
                      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                        {s.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-sm">
                            <span className="text-[var(--accent)] mt-1">✦</span>{f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      {testimonials?.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
            <Reveal><SectionLabel index={1} label="What people say" /></Reveal>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i * 0.08} className="p-8 border border-border rounded-sm flex flex-col">
                  <div className="flex gap-0.5 mb-4 text-[var(--accent)]">
                    {Array.from({ length: t.rating || 5 }).map((_, r) => <span key={r}>★</span>)}
                  </div>
                  <p className="font-heading text-lg leading-snug flex-1">"{t.testimonial}"</p>
                  <p className="mt-6 text-sm text-muted-foreground">{t.person_name} — {t.job_title}{t.organization ? `, ${t.organization}` : ''}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Ready when you are</p>
          <Link to="/contact" className="group inline-flex items-center gap-3 font-heading text-4xl sm:text-6xl font-medium tracking-tight hover:text-[var(--accent)] transition-colors">
            Start a project
            <ArrowRight className="w-10 h-10 transition-transform group-hover:translate-x-2 text-[var(--accent)]" />
          </Link>
        </div>
      </section>
    </div>
  );
}