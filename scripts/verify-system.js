import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../server/db.js';
import { config } from '../server/config.js';

const expectedTables = [
  'users', 'user_oauth_accounts', 'email_verification_codes', 'password_reset_tokens',
  'auth_refresh_tokens', 'site_settings', 'social_links', 'project_categories', 'projects',
  'skills', 'experiences', 'education', 'certifications', 'services', 'testimonials',
  'contact_messages', 'roadmap_items', 'uploaded_files',
];

const contentTables = [
  'site_settings', 'social_links', 'project_categories', 'projects', 'skills', 'experiences',
  'education', 'certifications', 'services', 'testimonials', 'contact_messages', 'roadmap_items',
];

let failures = 0;
let warnings = 0;
const ok = (msg) => console.log(`OK   ${msg}`);
const warn = (msg) => { warnings += 1; console.warn(`WARN ${msg}`); };
const fail = (msg) => { failures += 1; console.error(`FAIL ${msg}`); };

async function main() {
  console.log(`Checking MySQL database: ${config.db.database}\n`);

  const [tableRows] = await pool.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
    [config.db.database]
  );
  const present = new Set(tableRows.map((row) => row.TABLE_NAME));
  for (const table of expectedTables) {
    if (present.has(table)) ok(`table ${table}`);
    else fail(`missing table ${table}`);
  }

  console.log('\nContent counts:');
  for (const table of contentTables) {
    if (!present.has(table)) continue;
    const [[row]] = await pool.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
    console.log(`     ${table.padEnd(22)} ${row.total}`);
  }

  if (present.has('users')) {
    const [[admins]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role='admin' AND is_active=1");
    if (admins.total > 0) ok(`${admins.total} active administrator account(s)`);
    else fail('no active administrator account exists');
  }

  if (present.has('site_settings')) {
    const [[settings]] = await pool.query('SELECT COUNT(*) AS total FROM site_settings');
    if (settings.total === 1) ok('exactly one SiteSettings record');
    else if (settings.total === 0) warn('no SiteSettings record exists');
    else warn(`${settings.total} SiteSettings records exist; the public site uses the first record`);
  }

  // Find old externally-hosted media references. Legacy numeric IDs are harmless; URLs are what matter.
  const mediaColumns = {
    site_settings: ['profile_picture', 'logo', 'resume_url', 'default_seo_image'],
    projects: ['cover_image', 'thumbnail'],
    experiences: ['company_logo'],
    education: ['logo'],
    certifications: ['certificate_image'],
    testimonials: ['profile_picture'],
  };
  let oldUrlCount = 0;
  for (const [table, columns] of Object.entries(mediaColumns)) {
    if (!present.has(table)) continue;
    for (const column of columns) {
      const [[row]] = await pool.query(
        `SELECT COUNT(*) AS total FROM \`${table}\` WHERE LOWER(COALESCE(\`${column}\`, '')) LIKE '%base44%'`
      );
      oldUrlCount += Number(row.total || 0);
    }
  }
  if (oldUrlCount === 0) ok('no old Base44 media URLs found in primary media fields');
  else warn(`${oldUrlCount} old Base44 media URL reference(s) remain`);

  if (present.has('uploaded_files')) {
    const [files] = await pool.query("SELECT stored_name FROM uploaded_files WHERE storage_driver='local'");
    let missing = 0;
    for (const file of files) {
      try { await fs.access(path.join(config.uploads.dir, file.stored_name)); }
      catch { missing += 1; }
    }
    if (missing === 0) ok(`${files.length} tracked local upload(s) are present on disk`);
    else warn(`${missing} uploaded_files record(s) point to files missing from ${config.uploads.dir}`);
  }

  console.log(`\nVerification finished: ${failures} failure(s), ${warnings} warning(s).`);
  if (failures) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`FAIL verification could not complete: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
