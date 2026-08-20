import { useEffect } from 'react';
import { useSettings } from '@/lib/portfolio';

function ensureManagedLink(rel, attribute) {
  let link = document.head.querySelector(`link[${attribute}="true"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    link.setAttribute(attribute, 'true');
    document.head.appendChild(link);
  }
  return link;
}

export default function SiteFavicon() {
  const { data: settings } = useSettings();

  useEffect(() => {
    const favicon = settings?.favicon || '';
    const existingIcon = document.head.querySelector('link[data-dynamic-favicon="true"]');
    const existingApple = document.head.querySelector('link[data-dynamic-apple-icon="true"]');

    if (!favicon) {
      existingIcon?.remove();
      existingApple?.remove();
      return;
    }

    const icon = ensureManagedLink('icon', 'data-dynamic-favicon');
    icon.type = 'image/png';
    icon.href = favicon;

    const apple = ensureManagedLink('apple-touch-icon', 'data-dynamic-apple-icon');
    apple.href = favicon;
  }, [settings?.favicon]);

  return null;
}
