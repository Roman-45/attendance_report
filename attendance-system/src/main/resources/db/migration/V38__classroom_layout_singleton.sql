-- The classroom layout is the same for the whole school regardless of module.
-- Drop the module_id link so a single global layout can serve everyone.
-- Existing demo data has been wiped, so there's nothing to migrate.

ALTER TABLE classroom_layouts
    DROP COLUMN IF EXISTS module_id;
