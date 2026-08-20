import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/portfolio';
import { LayoutDashboard, FolderKanban, Tags, Sparkles, Briefcase, GraduationCap, Award, Wrench, MessageSquare, MessagesSquare, Settings, ExternalLink, LogOut, Link2, Route, UserRound } from 'lucide-react';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/roadmap', label: 'Roadmap', icon: Route },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/skills', label: 'Skills', icon: Sparkles },
  { to: '/admin/experience', label: 'Experience', icon: Briefcase },
  { to: '/admin/education', label: 'Education', icon: GraduationCap },
  { to: '/admin/certifications', label: 'Certifications', icon: Award },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare },
  { to: '/admin/social-links', label: 'Social Links', icon: Link2 },
  { to: '/admin/messages', label: 'Messages', icon: MessagesSquare },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/account', label: 'Account', icon: UserRound },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { data: settings } = useSettings();
  const cmsName = settings?.admin_brand_name?.trim() || 'Atelier CMS';

  const handleLogout = async () => {
    await logout(false);
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="font-semibold tracking-tight truncate">{cmsName}</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 space-y-1">
          {user?.email && <div className="px-3 pb-1 text-[11px] text-slate-400 truncate" title={user.email}>{user.email}</div>}
          <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
            <ExternalLink className="w-4 h-4" /> View site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <Link to="/admin" className="font-semibold max-w-[55vw] truncate">{cmsName}</Link>
        <div className="flex items-center gap-2">
          <Link to="/" target="_blank" className="p-2"><ExternalLink className="w-4 h-4" /></Link>
          <button onClick={handleLogout} className="p-2"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Mobile nav (horizontal scroll) */}
      <div className="lg:hidden fixed top-14 inset-x-0 z-30 bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 lg:ml-64 pt-28 lg:pt-0">
        <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-[1200px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}