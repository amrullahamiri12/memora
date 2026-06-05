-- Guest device bindings: one guest account per browser device
CREATE TABLE IF NOT EXISTS guest_device_bindings (
  device_id   TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guest_device_bindings_user_id_idx ON guest_device_bindings(user_id);
