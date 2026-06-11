-- An account is either anonymous (device_id, no email) or email-based.
-- A device_id left on an email account let device-login bypass the password.
-- Backfill existing violators first, since ADD CONSTRAINT validates on apply.

UPDATE users
SET device_id = NULL
WHERE email IS NOT NULL
  AND device_id IS NOT NULL;

ALTER TABLE users
ADD CONSTRAINT users_email_no_device_id
CHECK (email IS NULL OR device_id IS NULL);
