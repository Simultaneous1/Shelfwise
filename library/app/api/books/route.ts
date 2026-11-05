import { sql } from "../../../lib/db";

export async function GET() {
  const books = await sql`
    SELECT
      books.id,
      books.title,
      authors.name AS author,
      books.year,
      CASE
        WHEN loans.id IS NULL THEN 'Available'
        ELSE 'On loan'
      END AS status
    FROM books
    JOIN authors ON authors.id = books.author_id
    LEFT JOIN loans ON loans.book_id = books.id AND loans.returned_on IS NULL
    ORDER BY books.title, books.id
  `;

  return Response.json(books);
}
