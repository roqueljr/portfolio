import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { formatProjectNumber } from '@/lib/portfolio';

// Signature interaction: editorial project index with floating image preview on hover (desktop).
export default function ProjectIndex({ projects }) {
  const [active, setActive] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const onMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (!projects?.length) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      className="relative"
    >
      {/* Floating preview (desktop only) */}
      <div className="hidden lg:block">
        <AnimatePresence>
          {active !== null && projects[active]?.thumbnail && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="pointer-events-none absolute z-20 w-72 h-96 overflow-hidden rounded-sm shadow-2xl"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
            >
              <Image
                src={projects[active].thumbnail}
                alt=""
                fittingType="fill"
                className="w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ul className="divide-y divide-border/70 border-y border-border/70">
        {projects.map((p, i) => (
          <li key={p.id}>
            <Link
              to={`/projects/${p.slug}`}
              className="group relative block py-7 sm:py-9 transition-colors"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              <div className="grid grid-cols-12 items-baseline gap-4">
                <span className="col-span-2 sm:col-span-1 font-mono text-xs sm:text-sm text-muted-foreground transition-colors group-hover:text-[var(--accent)]">
                  {formatProjectNumber(i)}
                </span>
                <div className="col-span-10 sm:col-span-6 lg:col-span-5">
                  <h3 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-none transition-transform duration-500 group-hover:translate-x-2">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground max-w-md line-clamp-1 lg:hidden">{p.excerpt}</p>
                  )}
                </div>
                <div className="hidden lg:block lg:col-span-3 text-sm text-muted-foreground">
                  {p.category || '—'}
                </div>
                <div className="col-span-12 sm:col-span-4 lg:col-span-2 flex items-baseline justify-between sm:justify-end gap-4">
                  <span className="hidden sm:inline text-sm text-muted-foreground font-mono">{p.year || ''}</span>
                  <span className="text-[var(--accent)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-sm font-mono">
                    View ↗
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}