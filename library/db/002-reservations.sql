BEGIN;

CREATE TABLE IF NOT EXISTS reservations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id integer NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_id integer NOT NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (book_id, member_id)
);

CREATE INDEX IF NOT EXISTS reservations_book_queue
  ON reservations (book_id, id);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

COMMIT;
