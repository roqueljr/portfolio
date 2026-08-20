import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import SiteFavicon from '@/components/SiteFavicon';
import ProtectedRoute from '@/components/ProtectedRoute';
import PortfolioShell from '@/components/portfolio/PortfolioShell';
import AdminLayout from '@/components/admin/AdminLayout';
// Add page imports here
import Home from '@/pages/Home';
import Work from '@/pages/Work';
import ProjectDetail from '@/pages/ProjectDetail';
import About from '@/pages/About';
import Experience from '@/pages/Experience';
import Services from '@/pages/Services';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/admin/Dashboard';
import AdminProjects from '@/pages/admin/Projects';
import ProjectEdit from '@/pages/admin/ProjectEdit';
import AdminRoadmap from '@/pages/admin/Roadmap';
import AdminSkills from '@/pages/admin/Skills';
import AdminExperience from '@/pages/admin/ExperienceAdmin';
import AdminEducation from '@/pages/admin/Education';
import AdminCertifications from '@/pages/admin/Certifications';
import AdminServices from '@/pages/admin/ServicesAdmin';
import AdminTestimonials from '@/pages/admin/Testimonials';
import AdminCategories from '@/pages/admin/Categories';
import AdminSocialLinks from '@/pages/admin/SocialLinks';
import AdminMessages from '@/pages/admin/Messages';
import MessageDetail from '@/pages/admin/MessageDetail';
import AdminSettings from '@/pages/admin/Settings';
import AdminAccount from '@/pages/admin/Account';
import EmailSettings from '@/pages/admin/EmailSettings';

const GuestOnlyRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public portfolio */}
      <Route element={<PortfolioShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/projects" element={<Navigate to="/work" replace />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="projects/new" element={<ProjectEdit />} />
          <Route path="projects/:id/edit" element={<ProjectEdit />} />
          <Route path="roadmap" element={<AdminRoadmap />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="skills" element={<AdminSkills />} />
          <Route path="experience" element={<AdminExperience />} />
          <Route path="education" element={<AdminEducation />} />
          <Route path="certifications" element={<AdminCertifications />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="social-links" element={<AdminSocialLinks />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="messages/:id" element={<MessageDetail />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="account" element={<AdminAccount />} />
          <Route path="email" element={<EmailSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SiteFavicon />
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App