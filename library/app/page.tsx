import { Suspense } from "react";
import AddBookForm from "./add-book-form";
import { sql } from "../lib/db";



type Book = {
  id: number;
  title: string;
  author: string;
  on_loan: boolean;
};

export default function Home() {
  return (
    <Suspense fallback={<p>Loading books…</p>}>
      <BooksList />
    </Suspense>
  );
}

async function BooksList() {

  const authors = await sql<{ id: number; name: string }[]>`
  SELECT id, name
  FROM authors
  ORDER BY name
`;

  const books = await sql<Book[]>`
    SELECT
      books.id,
      books.title,
      authors.name AS author,
      EXISTS (
        SELECT 1
        FROM loans
        WHERE loans.book_id = books.id
          AND loans.returned_on IS NULL
      ) AS on_loan
    FROM books
    JOIN authors ON authors.id = books.author_id
    ORDER BY books.title, books.id
  `;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Shelfwise Books</h1>
      <AddBookForm authors={authors} />

      {books.length === 0 ? (
        <p>No books in the library yet.</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th scope="col" className="p-3">Title</th>
              <th scope="col" className="p-3">Author</th>
              <th scope="col" className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-b">
                <td className="p-3">{book.title}</td>
                <td className="p-3">{book.author}</td>
                <td className="p-3">
                  {book.on_loan ? "On loan" : "Available"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}