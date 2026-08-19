import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminCategories() {
  return (
    <EntityCrud
      entity="ProjectCategory"
      title="Project Categories"
      singular="Category"
      orderKey="display_order"
      searchKeys={['name']}
      defaultValues={{ display_order: 0 }}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'display_order', label: 'Order' },
      ]}
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug (URL)', placeholder: 'auto from name if empty' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
      ]}
    />
  );
}