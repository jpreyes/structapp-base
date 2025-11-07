-- Migration: Add is_critical column to calc_runs table
-- Date: 2025-11-07
-- Description: Adds a boolean column to mark critical elements for reports

-- Add the is_critical column with default value false
ALTER TABLE calc_runs
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;

-- Add a comment to the column for documentation
COMMENT ON COLUMN calc_runs.is_critical IS 'Flag to mark this calculation as the critical/representative element of its type for use in reports and documentation';

-- Create an index to speed up queries filtering by critical elements
CREATE INDEX IF NOT EXISTS idx_calc_runs_is_critical
ON calc_runs (project_id, element_type, is_critical)
WHERE is_critical = TRUE;

-- Optional: Add a check constraint to ensure only one critical element per type per project
-- Note: This is implemented in the application logic via set_critical_element function
-- but can also be enforced at database level if needed

/*
-- Example query to find all critical elements in a project:
SELECT * FROM calc_runs
WHERE project_id = 'your-project-id'
AND is_critical = TRUE
ORDER BY element_type;

-- Example query to set a critical element (use the API endpoint instead):
UPDATE calc_runs SET is_critical = FALSE
WHERE project_id = 'your-project-id' AND element_type = 'steel_beam';

UPDATE calc_runs SET is_critical = TRUE
WHERE id = 'your-run-id';
*/
