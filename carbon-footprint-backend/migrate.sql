ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'individual';
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS scope INTEGER DEFAULT 1;
UPDATE reports
SET scope = CASE
  WHEN LOWER(activity_type) LIKE '%route%'       THEN 1
  WHEN LOWER(activity_type) LIKE '%vehicle%'     THEN 1
  WHEN LOWER(activity_type) LIKE '%travel%'      THEN 1
  WHEN LOWER(activity_type) LIKE '%industrial%'  THEN 2
  WHEN LOWER(activity_type) LIKE '%electricity%' THEN 2
  WHEN LOWER(activity_type) LIKE '%grid%'        THEN 2
  ELSE 3
END
WHERE scope IS NULL OR scope = 0;
SELECT 'users' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role'
UNION ALL
SELECT 'reports', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reports' AND column_name = 'scope';
