BEGIN;

INSERT INTO authors (name) VALUES
  ('Chinua Achebe'),
  ('Chimamanda Ngozi Adichie'),
  ('Wole Soyinka'),
  ('Buchi Emecheta'),
  ('Ngũgĩ wa Thiong’o');

INSERT INTO books (title, year, author_id)
SELECT sample.title, sample.year, authors.id
FROM (VALUES
  ('Things Fall Apart', 1958, 'Chinua Achebe'),
  ('Arrow of God', 1964, 'Chinua Achebe'),
  ('Purple Hibiscus', 2003, 'Chimamanda Ngozi Adichie'),
  ('Half of a Yellow Sun', 2006, 'Chimamanda Ngozi Adichie'),
  ('The Lion and the Jewel', 1963, 'Wole Soyinka'),
  ('Death and the King’s Horseman', 1975, 'Wole Soyinka'),
  ('Second-Class Citizen', 1974, 'Buchi Emecheta'),
  ('The Joys of Motherhood', 1979, 'Buchi Emecheta'),
  ('Weep Not, Child', 1964, 'Ngũgĩ wa Thiong’o'),
  ('A Grain of Wheat', 1967, 'Ngũgĩ wa Thiong’o')
) AS sample(title, year, author_name)
JOIN authors ON authors.name = sample.author_name;

WITH starter_members AS (
  INSERT INTO members (name) VALUES
    ('Ada Okafor'),
    ('Tunde Bello'),
    ('Ife Okoye'),
    ('Amaka Eze'),
    ('David James')
  RETURNING id, name
)
INSERT INTO loans (book_id, member_id, borrowed_on, due_on)
SELECT books.id, starter_members.id, CURRENT_DATE, CURRENT_DATE + 14
FROM (VALUES
  ('Things Fall Apart', 'Ada Okafor'),
  ('Purple Hibiscus', 'Tunde Bello')
) AS sample(book_title, member_name)
JOIN books ON books.title = sample.book_title
JOIN starter_members ON starter_members.name = sample.member_name;

COMMIT;
