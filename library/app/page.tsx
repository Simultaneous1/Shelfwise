import { lendBook, returnBook } from "./loan-actions";  
import { Suspense } from "react";
import { sql } from "../lib/db";
import AddBookForm, { DeleteBookButton } from "./add-book-form";
import Link from "next/dist/client/link";

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
  loan_id: number | null;
  due_on: string | null;
};

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Shelfwise Books</h1>
      <Link href="/members" className="mb-4 inline-block underline">Members</Link>
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
  
  const members = await sql<{ id: number; name: string }[]>`
    SELECT id, name
    FROM members
    ORDER BY name, id
  `;

   const books = await sql<Book[]>`
    SELECT
      books.id,
      books.title,
      books.author_id,
      books.year,
      authors.name AS author,
      loans.id IS NOT NULL AS on_loan,
      loans.id AS loan_id,
      loans.due_on::text AS due_on
    FROM books
    JOIN authors ON authors.id = books.author_id
    LEFT JOIN loans ON loans.book_id = books.id AND loans.returned_on IS NULL
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
                                        {book.loan_id !== null ? (
                      <form action={returnBook}>
                        <input type="hidden" name="loanId" value={book.loan_id} />
                        <p>Due {book.due_on}</p>
                        <button type="submit" className="underline">Return</button>
                      </form>
                    ) : members.length > 0 ? (
                      <form action={lendBook} className="mt-2 grid gap-1">
                        <input type="hidden" name="bookId" value={book.id} />
                        <label>
                          Member
                          <select name="memberId" required defaultValue="" className="ml-2 rounded border">
                            <option value="" disabled>Choose a member</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                          </select>
                        </label>
                        <button type="submit" className="w-fit underline">Lend</button>
                      </form>
                    ) : (
                      <p>Add a member before lending.</p>
                    )}
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