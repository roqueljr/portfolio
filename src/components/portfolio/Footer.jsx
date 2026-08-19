import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { useSettings, useSocialLinks } from '@/lib/portfolio';

export default function Footer() {
  const { data: settings } = useSettings();
  const { data: socials } = useSocialLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-5">
              {settings?.availability_status ? '● Available for work' : '○ Not available'}
            </p>
            <h2 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.95]">
              {settings?.footer_cta_heading || 'Have a project worth building?'}
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground text-lg">
              {settings?.footer_cta_subheading}
            </p>
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-3 mt-8 font-heading text-2xl sm:text-3xl font-medium hover:text-[var(--accent)] transition-colors"
              >
                {settings.email}
                <span className="text-[var(--accent)]">↗</span>
              </a>
            )}
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Menu</p>
              <ul className="space-y-2.5">
                {[
                  { label: 'Work', to: '/work' },
                  { label: 'About', to: '/about' },
                  { label: 'Services', to: '/services' },
                  { label: 'Experience', to: '/experience' },
                  { label: 'Contact', to: '/contact' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm hover:text-[var(--accent)] transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Elsewhere</p>
              <ul className="space-y-2.5">
                {socials?.length ? socials.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-sm hover:text-[var(--accent)] transition-colors">{s.platform}</a>
                  </li>
                )) : <li className="text-sm text-muted-foreground">—</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {year} {settings?.full_name || 'Studio'} — {settings?.location || ''}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to top
            <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}