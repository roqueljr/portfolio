import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

// Singleton settings: fetch first record, create a default if none exists.
export const defaultSettings = {
  full_name: 'Your Name',
  short_name: 'YN',
  professional_title: 'Designer & Developer',
  tagline: 'Crafting polished digital products',
  biography: '',
  professional_summary: '',
  profile_picture: '',
  logo: '',
  email: 'hello@example.com',
  phone: '',
  location: 'Earth',
  years_experience: 0,
  availability_status: true,
  availability_message: 'Available for select projects',
  hero_heading: 'I design and build digital experiences that solve real problems.',
  hero_introduction: 'A multidisciplinary designer and developer building thoughtful, performant products end to end.',
  accent_color: '#C2410C',
  resume_url: '',
  default_seo_image: '',
  seo_title: '',
  seo_description: '',
  footer_cta_heading: 'Have a project worth building?',
  footer_cta_subheading: 'Tell me about it — I reply to every serious inquiry.',
  interests: [],
  personal_statement: '',
};

export function useSettings() {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const list = await api.entities.SiteSettings.list();
      if (list && list.length > 0) return { ...defaultSettings, ...list[0] };
      return defaultSettings;
    },
    staleTime: 30000,
  });
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ['socialLinks'],
    queryFn: async () => {
      const list = await api.entities.SocialLink.filter({ enabled: true }, 'display_order', 50);
      return list || [];
    },
    staleTime: 30000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['projectCategories'],
    queryFn: async () => {
      const list = await api.entities.ProjectCategory.list('display_order', 50);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useProjects(opts = {}) {
  const { featuredOnly = false } = opts;
  return useQuery({
    queryKey: ['projects', { featuredOnly }],
    queryFn: async () => {
      const all = await api.entities.Project.list('-display_order', 200);
      let items = (all || []).filter((p) => p.status === 'published');
      if (featuredOnly) items = items.filter((p) => p.featured);
      return items;
    },
    staleTime: 30000,
  });
}

export function useProject(slug) {
  return useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const list = await api.entities.Project.filter({ slug }, undefined, 1);
      return list && list[0] ? list[0] : null;
    },
    enabled: !!slug,
    staleTime: 30000,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const list = await api.entities.Skill.filter({ visible: true }, 'display_order', 200);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useExperiences() {
  return useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const list = await api.entities.Experience.list('-display_order', 100);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useEducation() {
  return useQuery({
    queryKey: ['education'],
    queryFn: async () => {
      const list = await api.entities.Education.list('-display_order', 50);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: ['certifications'],
    queryFn: async () => {
      const list = await api.entities.Certification.list('-issue_date', 50);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const list = await api.entities.Service.filter({ visible: true }, 'display_order', 50);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const list = await api.entities.Testimonial.filter({ visible: true }, 'display_order', 50);
      return list || [];
    },
    staleTime: 60000,
  });
}

export function formatProjectNumber(index) {
  return String(index + 1).padStart(2, '0');
}