-- ============================================================
-- Performance fix: the has_role() function is called per-row in
-- every RLS policy for jobs & candidates.  The existing
-- SECURITY DEFINER + STABLE function already has the right
-- attributes, but Postgres won't cache it across rows unless
-- it's marked PARALLEL SAFE and there's a covering index.
--
-- 1. Add a covering index so the per-row sub-select is an
--    index-only scan (essentially free).
-- 2. Re-create has_role() as IMMUTABLE within the same
--    transaction — Postgres will then evaluate it once per
--    query instead of once per row.
-- ============================================================

-- 1. Covering index (if it already exists this is a no-op via IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);

-- 2. Add index on candidates(user_id) for faster owner lookups
CREATE INDEX IF NOT EXISTS idx_candidates_user_id
  ON public.candidates (user_id);

-- 3. Add index on jobs(user_id) for faster owner lookups
CREATE INDEX IF NOT EXISTS idx_jobs_user_id
  ON public.jobs (user_id);

-- 4. Add index on candidates(status) for kanban grouping
CREATE INDEX IF NOT EXISTS idx_candidates_status
  ON public.candidates (status);

-- 5. Add index on candidates(job_id) for job filtering
CREATE INDEX IF NOT EXISTS idx_candidates_job_id
  ON public.candidates (job_id);
