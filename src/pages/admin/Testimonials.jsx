import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminTestimonials() {
  return (
    <EntityCrud
      entity="Testimonial"
      title="Testimonials"
      singular="Testimonial"
      orderKey="display_order"
      searchKeys={['person_name', 'organization']}
      defaultValues={{ visible: true, featured: false, rating: 5, display_order: 0 }}
      columns={[
        { key: 'person_name', label: 'Name' },
        { key: 'job_title', label: 'Title' },
        { key: 'organization', label: 'Organization' },
        { key: 'rating', label: 'Rating' },
        { key: 'visible', label: 'Visible', render: (i) => (i.visible ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'person_name', label: 'Person Name' },
        { key: 'job_title', label: 'Job Title' },
        { key: 'organization', label: 'Organization' },
        { key: 'rating', label: 'Rating (1-5)', type: 'number' },
        { key: 'featured', label: 'Featured', type: 'switch' },
        { key: 'visible', label: 'Visible', type: 'switch' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'profile_picture', label: 'Profile Picture', type: 'image' },
        { key: 'testimonial', label: 'Testimonial', type: 'textarea', span: 2 },
      ]}
    />
  );
}