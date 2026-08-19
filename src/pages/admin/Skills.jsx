import EntityCrud from '@/components/admin/EntityCrud';

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function AdminSkills() {
  return (
    <EntityCrud
      entity="Skill"
      title="Skills"
      singular="Skill"
      orderKey="display_order"
      searchKeys={['name', 'category']}
      defaultValues={{ visible: true, display_order: 0, years_experience: 0, level: 'intermediate' }}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'level', label: 'Level' },
        { key: 'years_experience', label: 'Years' },
        { key: 'visible', label: 'Visible', render: (i) => (i.visible ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'name', label: 'Skill Name', span: 2 },
        { key: 'category', label: 'Category' },
        { key: 'icon', label: 'Icon (emoji or lucide name)' },
        { key: 'level', label: 'Level', type: 'select', options: LEVELS },
        { key: 'years_experience', label: 'Years of Experience', type: 'number' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'visible', label: 'Visible', type: 'switch' },
        { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      ]}
    />
  );
}