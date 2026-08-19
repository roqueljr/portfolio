import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PublicNav from './PublicNav';
import Footer from './Footer';
import ScrollProgress from './ScrollProgress';
import { useSettings } from '@/lib/portfolio';

// Applies the configurable accent color to a CSS variable and wraps public pages.
export default function PortfolioShell() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const accent = settings?.accent_color || '#C2410C';
    document.documentElement.style.setProperty('--accent', accent);
  }, [settings?.accent_color]);

  useEffect(() => {
    if (settings?.seo_title) document.title = settings.seo_title;
  }, [settings?.seo_title]);

  return (
    <div className="min-h-screen bg-background text-foreground font-body antialiased">
      <ScrollProgress />
      <PublicNav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}