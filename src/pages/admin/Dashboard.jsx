import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { FolderKanban, Star, CheckCircle2, FileEdit, Sparkles, Briefcase, Mail, MailOpen, MessageSquare, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [projects, skills, experiences, messages, testimonials] = await Promise.all([
          api.entities.Project.list('-updated_date', 200),
          api.entities.Skill.list(),
          api.entities.Experience.list(),
          api.entities.ContactMessage.list('-created_date', 50),
          api.entities.Testimonial.list(),
        ]);
        const published = (projects || []).filter((p) => p.status === 'published');
        const drafts = (projects || []).filter((p) => p.status === 'draft');
        const featured = (projects || []).filter((p) => p.featured);
        const unread = (messages || []).filter((m) => !m.read && !m.archived);
        setStats({
          total: (projects || []).length,
          published: published.length,
          drafts: drafts.length,
          featured: featured.length,
          skills: (skills || []).length,
          experiences: (experiences || []).length,
          messages: (messages || []).length,
          unread: unread.length,
          testimonials: (testimonials || []).length,
        });
        setRecentMessages((messages || []).slice(0, 4));
        setRecentProjects((projects || []).slice(0, 4));
      } catch (e) {
        setStats({});
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-8">An overview of your portfolio.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats?.total} />
        <StatCard icon={Star} label="Featured" value={stats?.featured} />
        <StatCard icon={CheckCircle2} label="Published" value={stats?.published} />
        <StatCard icon={FileEdit} label="Drafts" value={stats?.drafts} />
        <StatCard icon={Sparkles} label="Skills" value={stats?.skills} />
        <StatCard icon={Briefcase} label="Experience" value={stats?.experiences} />
        <StatCard icon={MessageSquare} label="Testimonials" value={stats?.testimonials} />
        <StatCard icon={Mail} label="Messages" value={stats?.messages} highlight={stats?.unread} />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-10">
        <QuickAction to="/admin/projects/new" icon={Plus}>Add Project</QuickAction>
        <QuickAction to="/admin/experience" icon={Plus}>Add Experience</QuickAction>
        <QuickAction to="/admin/skills" icon={Plus}>Add Skill</QuickAction>
        <QuickAction to="/admin/messages" icon={Mail}>View Messages</QuickAction>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Recent Messages" link="/admin/messages">
          {recentMessages.length === 0 ? <Empty text="No messages yet." /> : (
            <ul className="divide-y divide-slate-100">
              {recentMessages.map((m) => (
                <li key={m.id}>
                  <Link to={`/admin/messages/${m.id}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded">
                    {!m.read && <MailOpen className="w-4 h-4 text-[var(--accent)]" />}
                    {m.read && <Mail className="w-4 h-4 text-slate-300" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name} — {m.subject || 'No subject'}</p>
                      <p className="text-xs text-slate-500 truncate">{m.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{new Date(m.created_date).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent Projects" link="/admin/projects">
          {recentProjects.length === 0 ? <Empty text="No projects yet." /> : (
            <ul className="divide-y divide-slate-100">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/projects/${p.id}/edit`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded">
                    <span className={`w-2 h-2 rounded-full ${p.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.category || 'Uncategorized'} · {p.status}</p>
                    </div>
                    {p.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {highlight > 0 && <span className="text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 py-0.5 rounded">{highlight} new</span>}
      </div>
      <p className="text-2xl font-semibold">{value ?? '—'}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 transition-colors">
      <Icon className="w-4 h-4" /> {children}
    </Link>
  );
}

function Panel({ title, link, children }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">{title}</h2>
        <Link to={link} className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400 py-6 text-center">{text}</p>;
}