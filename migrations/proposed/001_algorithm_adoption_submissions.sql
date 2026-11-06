-- Proposed private adoption registry foundation. Do not run against production until
-- identity, retention, access-control, backup, rollback and migration review pass.
BEGIN;
CREATE TABLE algorithm_adoption_submissions (
  id uuid PRIMARY KEY,
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 200),
  integration_name text NOT NULL CHECK (length(integration_name) BETWEEN 1 AND 200),
  operator_name text NOT NULL CHECK (length(operator_name) BETWEEN 1 AND 200),
  algorithm_version text NOT NULL CHECK (length(algorithm_version) BETWEEN 1 AND 100),
  purpose text NOT NULL CHECK (length(purpose) BETWEEN 1 AND 2000),
  evidence_url text CHECK (evidence_url IS NULL OR length(evidence_url) <= 2048),
  report_kind text NOT NULL DEFAULT 'self_reported' CHECK (report_kind = 'self_reported'),
  review_state text NOT NULL DEFAULT 'pending' CHECK (review_state IN ('pending','reviewed','rejected','withdrawn')),
  public_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX algorithm_adoption_owner_idx ON algorithm_adoption_submissions(owner_subject, created_at DESC);
CREATE INDEX algorithm_adoption_review_idx ON algorithm_adoption_submissions(review_state, created_at);
-- No public view: consent does not itself constitute review or authorization.
COMMIT;
