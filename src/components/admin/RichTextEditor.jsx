import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link2, RemoveFormatting } from 'lucide-react';

const TOOL_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted transition-colors';

function runCommand(command, value = null) {
  document.execCommand(command, false, value);
}

function safeLink(raw) {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith('/') || value.startsWith('#') || value.startsWith('mailto:')) return value;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    try {
      const url = new URL(`https://${value}`);
      return url.toString();
    } catch {
      return null;
    }
  }
}

export default function RichTextEditor({ value, onChange, placeholder = '' }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const next = value || '';
    if (editor.innerHTML !== next) editor.innerHTML = next;
  }, [value]);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML || '';
    onChange?.(html === '<br>' ? '' : html);
  };

  const apply = (command, commandValue = null) => {
    editorRef.current?.focus();
    runCommand(command, commandValue);
    emitChange();
  };

  const addLink = () => {
    editorRef.current?.focus();
    const raw = window.prompt('Enter a URL');
    const href = safeLink(raw);
    if (href) apply('createLink', href);
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    runCommand('insertText', text);
    emitChange();
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
        <button type="button" className={`${TOOL_BUTTON} w-auto px-2 text-xs font-medium`} aria-label="Paragraph" title="Paragraph" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', 'p')}>P</button>
        <button type="button" className={`${TOOL_BUTTON} w-auto px-2 text-xs font-medium`} aria-label="Heading 1" title="Heading 1" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', 'h1')}>H1</button>
        <button type="button" className={`${TOOL_BUTTON} w-auto px-2 text-xs font-medium`} aria-label="Heading 2" title="Heading 2" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', 'h2')}>H2</button>
        <button type="button" className={`${TOOL_BUTTON} w-auto px-2 text-xs font-medium`} aria-label="Heading 3" title="Heading 3" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', 'h3')}>H3</button>
        <button type="button" className={TOOL_BUTTON} aria-label="Bold" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('bold')}><Bold className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Italic" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('italic')}><Italic className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Underline" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('underline')}><Underline className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Ordered list" title="Ordered list" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertOrderedList')}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Bullet list" title="Bullet list" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertUnorderedList')}><List className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Add link" title="Add link" onMouseDown={(e) => e.preventDefault()} onClick={addLink}><Link2 className="h-4 w-4" /></button>
        <button type="button" className={TOOL_BUTTON} aria-label="Clear formatting" title="Clear formatting" onMouseDown={(e) => e.preventDefault()} onClick={() => apply('removeFormat')}><RemoveFormatting className="h-4 w-4" /></button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        className="min-h-40 px-4 py-3 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-primary [&_a]:underline"
      />
    </div>
  );
}
