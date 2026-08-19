const ALLOWED_TAGS = new Set([
  'P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'U',
  'H1', 'H2', 'H3', 'OL', 'UL', 'LI', 'A'
]);

const BLOCKED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON']);
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

function isSafeHref(value) {
  if (!value) return false;
  if (value.startsWith('#') || value.startsWith('/')) return true;
  try {
    const url = new URL(value, window.location.origin);
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize CMS-authored rich text before injecting it into the public UI.
 * The editor only needs a small formatting subset, so everything else is removed.
 */
export function sanitizeHtml(html = '') {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return '';

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return;

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.remove();
      return;
    }

    const element = node;
    const children = Array.from(element.childNodes);

    if (BLOCKED_TAGS.has(element.tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...children);
      children.forEach(cleanNode);
      return;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      if (element.tagName === 'A' && name === 'href' && isSafeHref(attr.value)) continue;
      element.removeAttribute(attr.name);
    }

    if (element.tagName === 'A') {
      const href = element.getAttribute('href');
      if (!href || !isSafeHref(href)) {
        element.removeAttribute('href');
      } else {
        element.setAttribute('rel', 'noopener noreferrer');
        if (!href.startsWith('#') && !href.startsWith('/') && !href.startsWith('mailto:')) {
          element.setAttribute('target', '_blank');
        }
      }
    }

    Array.from(element.childNodes).forEach(cleanNode);
  };

  Array.from(root.childNodes).forEach(cleanNode);
  return root.innerHTML;
}
