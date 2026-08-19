
import EntityCrud from '@/components/admin/EntityCrud';

const TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];

export default function AdminExperience() {
  return (
    <EntityCrud
      entity="Experience"
      title="Experience"
      singular="Experience"
      orderKey="display_order"
      searchKeys={['company', 'position']}
      defaultValues={{ currently_working: false, display_order: 0 }}
      columns={[
        { key: 'position', label: 'Position' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'start_date', label: 'Start' },
        { key: 'currently_working', label: 'Current', render: (i) => (i.currently_working ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'company', label: 'Company' },
        { key: 'position', label: 'Position' },
        { key: 'location', label: 'Location' },
        { key: 'employment_type', label: 'Employment Type', type: 'select', options: TYPES },
        { key: 'start_date', label: 'Start Date', type: 'date' },
        { key: 'end_date', label: 'End Date', type: 'date' },
        { key: 'currently_working', label: 'Currently Working Here', type: 'switch' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'company_url', label: 'Company URL' },
        { key: 'company_logo', label: 'Company Logo', type: 'image' },
        { key: 'description', label: 'Description', type: 'textarea', span: 2 },
        { key: 'responsibilities', label: 'Responsibilities', type: 'list', span: 2 },
        { key: 'technologies', label: 'Technologies', type: 'list', span: 2 },
      ]}
    />
  );
}