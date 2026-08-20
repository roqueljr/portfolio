-- Contact email notifications + reply history
CREATE TABLE IF NOT EXISTS email_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  notification_email VARCHAR(255) NULL,
  reply_signature TEXT NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_message_replies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_message_id BIGINT UNSIGNED NOT NULL,
  admin_user_id BIGINT UNSIGNED NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  provider_message_id VARCHAR(500) NULL,
  sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_replies_message (contact_message_id, sent_date),
  KEY idx_contact_replies_admin (admin_user_id)
) ENGINE=InnoDB;

INSERT INTO email_settings (notifications_enabled)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM email_settings);
