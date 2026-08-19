const entity = (table, fields, options = {}) => ({
  table,
  fields,
  required: options.required || [],
  json: options.json || [],
  booleans: options.booleans || [],
  publicRead: options.publicRead !== false,
  publicCreate: options.publicCreate === true,
  adminOnly: options.adminOnly === true,
  publicWhere: options.publicWhere || null,
});

export const entities = {
  SiteSettings: entity('site_settings', [
    'full_name','short_name','professional_title','tagline','biography','professional_summary','profile_picture','logo','email','phone','location','years_experience','availability_status','availability_message','hero_heading','hero_introduction','accent_color','resume_url','default_seo_image','seo_title','seo_description','footer_cta_heading','footer_cta_subheading','interests','personal_statement'
  ], { required: ['full_name'], json: ['interests'], booleans: ['availability_status'] }),

  SocialLink: entity('social_links', ['platform','url','icon','display_order','enabled'], {
    required: ['platform','url'], booleans: ['enabled'], publicWhere: { enabled: 1 }
  }),

  ProjectCategory: entity('project_categories', ['name','slug','display_order'], {
    required: ['name']
  }),

  Project: entity('projects', [
    'title','slug','excerpt','overview','category','client','role','year','technologies','status','featured','display_order','cover_image','thumbnail','gallery_images','project_url','github_url','challenge','approach','solution','features','results','start_date','completion_date'
  ], {
    required: ['title','slug'],
    json: ['technologies','gallery_images','features','results'],
    booleans: ['featured'],
    publicWhere: { status: 'published' }
  }),

  Skill: entity('skills', ['name','category','icon','level','years_experience','description','display_order','visible'], {
    required: ['name'], booleans: ['visible'], publicWhere: { visible: 1 }
  }),

  Experience: entity('experiences', ['company','position','location','employment_type','start_date','end_date','currently_working','description','responsibilities','technologies','company_logo','company_url','display_order'], {
    required: ['company','position'], json: ['responsibilities','technologies'], booleans: ['currently_working']
  }),

  Education: entity('education', ['school','degree','field_of_study','start_year','end_year','description','logo','location','display_order'], {
    required: ['school','degree']
  }),

  Certification: entity('certifications', ['name','issuing_organization','issue_date','expiration_date','credential_id','credential_url','certificate_image','description'], {
    required: ['name','issuing_organization']
  }),

  Service: entity('services', ['title','description','icon','features','display_order','visible'], {
    required: ['title'], json: ['features'], booleans: ['visible'], publicWhere: { visible: 1 }
  }),

  Testimonial: entity('testimonials', ['person_name','job_title','organization','profile_picture','testimonial','rating','featured','visible','display_order'], {
    required: ['person_name','testimonial'], booleans: ['featured','visible'], publicWhere: { visible: 1 }
  }),

  ContactMessage: entity('contact_messages', ['name','email','company','subject','project_type','budget_range','message','read','archived'], {
    required: ['name','email','message'], booleans: ['read','archived'], publicRead: false, publicCreate: false
  }),

  RoadmapItem: entity('roadmap_items', ['title','description','status','priority','category','target_date','display_order'], {
    required: ['title'], publicRead: false, adminOnly: true
  }),
};

export const metadataFields = ['id', 'base44_id', 'created_by_id', 'created_date', 'updated_date'];

export function getEntity(name) {
  return entities[name] || null;
}

export function sanitizePayload(def, input = {}) {
  const payload = {};
  for (const field of def.fields) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    let value = input[field];
    if (value === '') value = null;
    if (def.json.includes(field)) {
      if (value == null) payload[field] = null;
      else payload[field] = JSON.stringify(value);
    } else if (def.booleans.includes(field)) {
      payload[field] = value ? 1 : 0;
    } else {
      payload[field] = value;
    }
  }
  return payload;
}

export function validateRequired(def, payload, isCreate = false) {
  for (const field of def.required) {
    if (!isCreate && !Object.prototype.hasOwnProperty.call(payload, field)) continue;
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      const error = new Error(`${field} is required.`);
      error.status = 400;
      throw error;
    }
  }
}

export function hydrateRow(def, row) {
  if (!row) return row;
  const out = { ...row };
  for (const field of def.json) {
    const value = out[field];
    if (value == null) {
      out[field] = [];
    } else if (typeof value === 'string') {
      try { out[field] = JSON.parse(value); } catch { out[field] = []; }
    }
  }
  for (const field of def.booleans) out[field] = Boolean(out[field]);
  return out;
}
