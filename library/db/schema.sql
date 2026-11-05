BEGIN;

CREATE TABLE authors (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (btrim(name) <> '')
);

CREATE TABLE books (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL CHECK (btrim(title) <> ''),
  year integer,
  author_id integer NOT NULL REFERENCES authors(id)
);

CREATE TABLE members (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (btrim(name) <> ''),
  phone text
);

CREATE TABLE loans (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book_id integer NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  member_id integer NOT NULL REFERENCES members(id),
  borrowed_on date NOT NULL DEFAULT CURRENT_DATE,
  due_on date NOT NULL,
  returned_on date
);

CREATE UNIQUE INDEX loans_one_active_per_book
  ON loans (book_id)
  WHERE returned_on IS NULL;

COMMIT;