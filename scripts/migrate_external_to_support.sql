-- Rename table 'external_staff' to 'support_staff'
ALTER TABLE external_staff RENAME TO support_staff;

-- Optional: Rename any constraints or indexes if they have specific names containing 'external_staff'
-- Example: ALTER INDEX external_staff_pkey RENAME TO support_staff_pkey;
