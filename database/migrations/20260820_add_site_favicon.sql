-- Adds the browser tab icon managed from Admin > Settings.
-- Run only if site_settings.favicon does not already exist.
ALTER TABLE site_settings ADD COLUMN favicon LONGTEXT NULL;
