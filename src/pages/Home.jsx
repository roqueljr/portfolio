import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSettings, useProjects, useServices, useTestimonials, useSkills, formatProjectNumber } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';
import SectionLabel from '@/components/portfolio/SectionLabel';
import MagneticButton from '@/components/portfolio/MagneticButton';

export default function Home() {
  const { data: settings } = useSettings();
  const { data: featured, isLoading } = useProjects({ featuredOnly: true });
  const { data: services } = useServices();
  const { data: testimonials } = useTestimonials();
  const { data: skills } = useSkills();
  const year = new Date().getFullYear();

  const projects = featured || [];

  return (
    <div className="pt-16 sm:pt-20">
      {/* HERO */}
      <section className="relative mx-auto max-w-[1400px] px-5 sm:px-8 pt-16 sm:pt-28 pb-20 sm:pb-32">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground mb-12 sm:mb-20">
          <span>Portfolio / {year}</span>
          {settings?.availability_status && (
            <span className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {settings?.availability_message || 'Available'}
            </span>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[12vw] leading-[0.92] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[7rem] font-medium tracking-tight max-w-[16ch]"
        >
          {settings?.hero_heading || 'I design and build digital experiences that solve real problems.'}
        </motion.h1>

        <div className="mt-12 sm:mt-16 grid gap-8 sm:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="sm:col-span-7 lg:col-span-6"
          >
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              {settings?.hero_introduction}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="sm:col-span-5 lg:col-span-6 sm:col-start-8 lg:col-start-7 grid grid-cols-2 gap-x-6 gap-y-4 text-sm"
          >
            <Meta label="Name" value={settings?.full_name} />
            <Meta label="Role" value={settings?.professional_title} />
            <Meta label="Based" value={settings?.location} />
            <Meta label="Focus" value={settings?.tagline} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 sm:mt-24 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground"
        >
          <ArrowDown className="w-4 h-4 animate-bounce text-[var(--accent)]" />
          Selected work below
        </motion.div>
      </section>

      {/* SELECTED WORK — staggered editorial */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
        <Reveal><SectionLabel index={1} label="Selected Work" /></Reveal>

        {isLoading ? (
          <div className="space-y-24">
            {[0, 1].map((i) => <div key={i} className="h-72 sm:h-96 rounded-sm bg-muted/40 animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground">No featured projects yet.</p>
        ) : (
          <div className="space-y-20 sm:space-y-32">
            {projects.map((p, i) => (
              <FeaturedProject key={p.id} project={p} index={i} flip={i % 2 === 1} />
            ))}
          </div>
        )}

        <div className="mt-16 sm:mt-24 text-center">
          <MagneticButton className="inline-block">
            <Link
              to="/work"
              className="group inline-flex items-center gap-3 font-heading text-2xl sm:text-3xl font-medium hover:text-[var(--accent)] transition-colors"
            >
              View all work
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </Link>
          </MagneticButton>
        </div>
      </section>

      {/* CAPABILITIES MARQUEE */}
      {skills?.length > 0 && (
        <section className="border-y border-border py-6 overflow-hidden">
          <div className="flex gap-12 whitespace-nowrap animate-marquee">
            {[...skills, ...skills].map((s, i) => (
              <span key={i} className="font-heading text-2xl sm:text-3xl text-muted-foreground/70 flex items-center gap-12">
                {s.name}
                <span className="text-[var(--accent)]">✦</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* SERVICES PREVIEW */}
      {services?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
          <Reveal><SectionLabel index={2} label="Services" /></Reveal>
          <div className="grid gap-px sm:grid-cols-2 border border-border">
            {services.slice(0, 4).map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05} className="p-8 sm:p-10 border-border sm:[&:nth-child(odd)]:border-r">
                <span className="font-mono text-xs text-[var(--accent)]">0{i + 1}</span>
                <h3 className="mt-4 font-heading text-2xl font-medium">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials?.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24 border-t border-border">
          <Reveal><SectionLabel index={3} label="Testimonials" /></Reveal>
          <div className="grid gap-8 sm:grid-cols-2">
            {testimonials.slice(0, 2).map((t, i) => (
              <Reveal key={t.id} delay={i * 0.1} className="p-8 sm:p-10 border border-border rounded-sm">
                <p className="font-heading text-xl sm:text-2xl leading-snug">"{t.testimonial}"</p>
                <p className="mt-6 text-sm text-muted-foreground">{t.person_name} — {t.job_title}{t.organization ? `, ${t.organization}` : ''}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-foreground">{value || '—'}</p>
    </div>
  );
}

function FeaturedProject({ project, index, flip }) {
  return (
    <Reveal>
      <Link to={`/projects/${project.slug}`} className="group block">
        <div className={`grid gap-6 sm:gap-10 lg:grid-cols-12 items-center ${flip ? 'lg:[direction:rtl]' : ''}`}>
          <div className="lg:col-span-7 [direction:ltr]">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-sm bg-muted">
              {project.thumbnail ? (
                <Image
                  src={project.thumbnail}
                  alt={project.title}
                  fittingType="fill"
                  className="w-full h-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-sm">No image</div>
              )}
              <span className="absolute top-4 left-4 font-mono text-xs text-background/90 mix-blend-difference">{formatProjectNumber(index)}</span>
            </div>
          </div>
          <div className="lg:col-span-5 [direction:ltr]">
            <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
              <span>{project.category || 'Project'}</span>
              <span className="w-6 h-px bg-border" />
              <span>{project.year}</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-medium tracking-tight leading-none group-hover:text-[var(--accent)] transition-colors">
              {project.title}
            </h2>
            {project.excerpt && <p className="mt-4 text-muted-foreground max-w-md">{project.excerpt}</p>}
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-mono text-[var(--accent)]">
              View case study <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}