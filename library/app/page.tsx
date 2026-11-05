import { Suspense } from "react";
import { sql } from "../lib/db";
import AddBookForm, { DeleteBookButton } from "./add-book-form";

type Author = {
  id: number;
  name: string;
};

type Book = {
  id: number;
  title: string;
  author_id: number;
  author: string;
  year: number | null;
  on_loan: boolean;
};

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Shelfwise Books</h1>
      <Suspense fallback={<p>Loading books…</p>}>
        <BooksList />
      </Suspense>
    </main>
  );
}

async function BooksList() {
  const authors = await sql<Author[]>`
    SELECT id, name
    FROM authors
    ORDER BY name
  `;

  const books = await sql<Book[]>`
    SELECT
      books.id,
      books.title,
      books.author_id,
      books.year,
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
    <>
      <AddBookForm authors={authors} />

      {books.length === 0 ? (
        <p>No books in the library yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-3">Title</th>
                <th scope="col" className="p-3">Author</th>
                <th scope="col" className="p-3">Status</th>
                <th scope="col" className="p-3">Actions</th>
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
                  <td className="p-3">
                    <details>
                      <summary className="cursor-pointer">Edit</summary>
                      <AddBookForm authors={authors} book={book} />
                    </details>
                    <DeleteBookButton bookId={book.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}