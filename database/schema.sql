CREATE TABLE IF NOT EXISTS acurris_leads (
  lead_id text PRIMARY KEY,
  form_type text NOT NULL,
  payload jsonb NOT NULL,
  email_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS acurris_lead_rate_limits (
  ip_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  hit_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS acurris_leads_created_at_idx ON acurris_leads (created_at DESC);