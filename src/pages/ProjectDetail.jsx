import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Github } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useProject, useProjects, formatProjectNumber } from '@/lib/portfolio';
import Reveal from '@/components/portfolio/Reveal';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data: project, isLoading } = useProject(slug);
  const { data: allProjects } = useProjects();

  if (isLoading) {
    return (
      <div className="pt-32 pb-32 mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="h-10 w-2/3 bg-muted/40 rounded animate-pulse mb-6" />
        <div className="h-80 bg-muted/40 rounded animate-pulse" />
      </div>
    );
  }

  if (!project) return <Navigate to="/work" replace />;

  const projects = allProjects || [];
  const currentIndex = projects.findIndex((p) => p.id === project.id);
  const nextProject = currentIndex >= 0 && currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;
  const number = currentIndex >= 0 ? formatProjectNumber(currentIndex) : '01';

  const gallery = project.gallery_images || [];
  const features = project.features || [];
  const results = project.results || [];
  const tech = project.technologies || [];

  return (
    <div className="pt-16 sm:pt-20">
      {/* Intro */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 pt-12 sm:pt-20 pb-12">
        <Link to="/work" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to work
        </Link>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="font-mono text-sm text-[var(--accent)] mb-4">{number} / {project.category || 'Project'}</p>
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.95]">{project.title}</h1>
            {project.excerpt && <p className="mt-6 text-xl text-muted-foreground max-w-2xl">{project.excerpt}</p>}
          </div>
          <div className="lg:col-span-4 lg:pt-4 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <Meta label="Client" value={project.client} />
            <Meta label="Role" value={project.role} />
            <Meta label="Year" value={project.year} />
            <Meta label="Status" value={project.status === 'published' ? 'Live' : project.status} />
            <Meta label="Start" value={project.start_date} />
            <Meta label="Completed" value={project.completion_date} />
          </div>
        </div>
      </section>

      {/* Cover */}
      {project.cover_image && (
        <section className="mx-auto max-w-[1600px] px-5 sm:px-8">
          <Reveal>
            <div className="aspect-[16/9] sm:aspect-[21/9] overflow-hidden rounded-sm bg-muted">
              <Image src={project.cover_image} alt={project.title} fittingType="fill" className="w-full h-full" />
            </div>
          </Reveal>
        </section>
      )}

      {/* Body */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground sticky top-28">Case Study</p>
          </div>
          <div className="lg:col-span-9 space-y-16">
            {project.overview && <Block label="Overview" html={project.overview} />}
            {project.challenge && <Block label="Challenge" html={project.challenge} />}
            {project.approach && <Block label="Approach" html={project.approach} />}
            {project.solution && <Block label="Solution" html={project.solution} />}

            {features.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">Key Features</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm border-t border-border pt-3">
                      <span className="font-mono text-[var(--accent)] text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tech.length > 0 && (
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">Technology</p>
                <div className="flex flex-wrap gap-2">
                  {tech.map((t, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs font-mono border border-border rounded-full text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-5 sm:px-8 pb-16 sm:pb-24">
          <div className="grid gap-4 sm:gap-6">
            {gallery.map((img, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className={`overflow-hidden rounded-sm bg-muted ${i % 3 === 0 ? 'aspect-[16/9]' : i % 3 === 1 ? 'aspect-[4/3]' : 'aspect-[3/4] max-w-2xl mx-auto'}`}>
                  <Image src={img} alt={`${project.title} gallery ${i + 1}`} fittingType="fill" className="w-full h-full" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {results.length > 0 && (
        <section className="border-y border-border">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-10">Results</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((r, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <p className="font-heading text-4xl sm:text-6xl font-medium text-[var(--accent)]">{r.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{r.label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Links */}
      {(project.project_url || project.github_url) && (
        <section className="mx-auto max-w-[1400px] px-5 sm:px-8 py-12 flex flex-wrap gap-4">
          {project.project_url && (
            <a href={project.project_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-sm text-sm hover:bg-[var(--accent)] transition-colors">
              <ExternalLink className="w-4 h-4" /> Visit Website
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 border border-border rounded-sm text-sm hover:border-foreground transition-colors">
              <Github className="w-4 h-4" /> GitHub
            </a>
          )}
        </section>
      )}

      {/* Next project */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 py-16 sm:py-24">
          {nextProject ? (
            <Link to={`/projects/${nextProject.slug}`} className="group block">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Next Project</p>
              <div className="flex items-end justify-between gap-6">
                <h2 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight group-hover:text-[var(--accent)] transition-colors">{nextProject.title}</h2>
                <ArrowRight className="w-10 h-10 mb-2 transition-transform group-hover:translate-x-3 text-[var(--accent)]" />
              </div>
            </Link>
          ) : (
            <Link to="/work" className="group block">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">End of archive</p>
              <div className="flex items-end justify-between gap-6">
                <h2 className="font-heading text-4xl sm:text-6xl font-medium tracking-tight group-hover:text-[var(--accent)] transition-colors">Back to all work</h2>
                <ArrowRight className="w-10 h-10 text-[var(--accent)]" />
              </div>
            </Link>
          )}
        </div>
      </section>
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

function Block({ label, html }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">{label}</p>
      <div className="prose-portfolio max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </div>
  );
}