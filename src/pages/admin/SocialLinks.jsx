import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminSocialLinks() {
  return (
    <EntityCrud
      entity="SocialLink"
      title="Social Links"
      singular="Social Link"
      orderKey="display_order"
      searchKeys={['platform']}
      defaultValues={{ enabled: true, display_order: 0 }}
      columns={[
        { key: 'platform', label: 'Platform' },
        { key: 'url', label: 'URL', render: (i) => (i.url || '').slice(0, 50) },
        { key: 'enabled', label: 'Enabled', render: (i) => (i.enabled ? 'Yes' : 'No') },
      ]}
      fields={[
        { key: 'platform', label: 'Platform', placeholder: 'GitHub, LinkedIn…' },
        { key: 'url', label: 'URL', placeholder: 'https://…' },
        { key: 'icon', label: 'Icon (emoji or lucide name)' },
        { key: 'display_order', label: 'Display Order', type: 'number' },
        { key: 'enabled', label: 'Enabled', type: 'switch' },
      ]}
    />
  );
}