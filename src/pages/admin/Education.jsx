import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminEducation() {
  return (
    <EntityCrud
      entity="Education"
      title="Education"
      singular="Education"
      orderKey="display_order"
      searchKeys={['school', 'degree']}
      defaultValues={{ display_order: 0 }}
      columns={[
        { key: 'school', label: 'School' },
        { key: 'degree', label: 'Degree' },
        { key: 'field_of_study', label: 'Field' },
        { key: 'start_year', label: 'Start' },
        { key: 'end_year', label: 'End' },
      ]}
      fields={[
        { key: 'school', label: 'School / Institution', span: 2 },
        { key: 'degree', label: 'Degree' },
        { key: 'field_of_study', label: 'Field of Study' },
        { key: 'start_year', label: 'Start Year', type: 'number' },
        { key: 'end_year', label: 'End Year', type: 'number' },
        { key: 'location', label: 'Location' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'logo', label: 'Logo', type: 'image' },
        { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      ]}
    />
  );
}