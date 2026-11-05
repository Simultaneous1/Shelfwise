import { connection } from "next/server";
import { sql } from "../../../lib/db";

export async function GET() {
  await connection();
  const books = await sql`
    SELECT
      books.id,
      books.title,
      authors.name AS author,
      books.year,
      CASE
        WHEN loans.due_on < CURRENT_DATE THEN 'Overdue'
        WHEN loans.id IS NOT NULL THEN 'On loan'
        WHEN EXISTS (SELECT 1 FROM reservations WHERE reservations.book_id = books.id) THEN 'Reserved'
        ELSE 'Available'
      END AS status
    FROM books
    JOIN authors ON authors.id = books.author_id
    LEFT JOIN loans ON loans.book_id = books.id AND loans.returned_on IS NULL
    ORDER BY books.title, books.id
  `;

  return Response.json(books);
}
