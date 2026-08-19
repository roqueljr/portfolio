import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSettings, useSocialLinks } from '@/lib/portfolio';

const NAV = [
  { label: 'Work', to: '/work' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Experience', to: '/experience' },
  { label: 'Contact', to: '/contact' },
];

export default function PublicNav() {
  const { data: settings } = useSettings();
  const { data: socials } = useSocialLinks();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const name = settings?.short_name || settings?.full_name || 'Studio';

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-background/85 backdrop-blur-md border-b border-border/60' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Home">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] transition-transform duration-500 group-hover:scale-150" />
            <span className="font-heading text-sm sm:text-base font-medium tracking-tight">{name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            {NAV.map((item) => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative text-[13px] tracking-wide uppercase font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {item.label}
                  <span className={`absolute -bottom-1.5 left-0 h-px bg-[var(--accent)] transition-all duration-300 ${active ? 'w-full' : 'w-0'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {settings?.availability_status && (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {settings?.availability_message || 'Available'}
              </span>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden bg-background transition-all duration-500 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-6">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-baseline gap-4 py-4 border-b border-border/60"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                <span className="font-heading text-3xl sm:text-4xl font-medium tracking-tight group-hover:text-[var(--accent)] transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto py-8 flex flex-wrap gap-x-6 gap-y-2">
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="text-sm text-muted-foreground hover:text-foreground">{settings.email}</a>
            )}
            {socials?.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">{s.platform}</a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}