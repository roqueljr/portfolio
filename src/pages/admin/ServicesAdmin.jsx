import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminServices() {
  return (
    <EntityCrud
      entity="Service"
      title="Services"
      singular="Service"
      orderKey="display_order"
      searchKeys={['title']}
      defaultValues={{ visible: true, display_order: 0 }}
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description', render: (i) => (i.description || '').slice(0, 80) + (i.description?.length > 80 ? '…' : '') },
        { key: 'visible', label: 'Visible', render: (i) => (i.visible ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'title', label: 'Title', span: 2 },
        { key: 'icon', label: 'Icon (emoji or lucide name)' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'visible', label: 'Visible', type: 'switch' },
        { key: 'description', label: 'Description', type: 'textarea', span: 2 },
        { key: 'features', label: 'Features', type: 'list', span: 2 },
      ]}
    />
  );
}