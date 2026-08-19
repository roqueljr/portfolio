import EntityCrud from '@/components/admin/EntityCrud';

export default function AdminCertifications() {
  return (
    <EntityCrud
      entity="Certification"
      title="Certifications"
      singular="Certification"
      orderKey="issue_date"
      searchKeys={['name', 'issuing_organization']}
      defaultValues={{}}
      columns={[
        { key: 'name', label: 'Certification' },
        { key: 'issuing_organization', label: 'Organization' },
        { key: 'issue_date', label: 'Issued' },
        { key: 'expiration_date', label: 'Expires' },
      ]}
      fields={[
        { key: 'name', label: 'Certification Name', span: 2 },
        { key: 'issuing_organization', label: 'Issuing Organization' },
        { key: 'credential_id', label: 'Credential ID' },
        { key: 'issue_date', label: 'Issue Date', type: 'date' },
        { key: 'expiration_date', label: 'Expiration Date', type: 'date' },
        { key: 'credential_url', label: 'Credential URL' },
        { key: 'certificate_image', label: 'Certificate Image', type: 'image' },
        { key: 'description', label: 'Description', type: 'textarea', span: 2 },
      ]}
    />
  );
}