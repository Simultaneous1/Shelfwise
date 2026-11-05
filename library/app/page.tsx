import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { sql } from "../lib/db";
import AddBookForm, { DeleteBookButton } from "./add-book-form";
import CirculationForm from "./circulation-form";
import { cancelReservation, returnBook } from "./loan-actions";

type Person = { id: number; name: string };
type Book = {
  id: number; title: string; author_id: number; author: string; year: number | null;
  loan_id: number | null; due_on: string | null; overdue: boolean;
};
type Reservation = { id: number; book_id: number; member_id: number; name: string };

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div><p className="eyebrow">Collection management</p><h1>Library catalog</h1>
          <p>Manage your collection, lend books, and keep track of who’s next in line.</p></div>
        <Link href="/loans" className="hero-link">View loan history →</Link>
      </section>
      <Suspense fallback={<p className="panel">Loading your collection…</p>}><Catalog /></Suspense>
    </main>
  );
}

async function Catalog() {
  await connection();
  const [authors, members, books, reservations] = await Promise.all([
    sql<Person[]>`SELECT id, name FROM authors ORDER BY name, id`,
    sql<Person[]>`SELECT id, name FROM members ORDER BY name, id`,
    sql<Book[]>`
      SELECT books.id, title, author_id, authors.name AS author, year,
        loans.id AS loan_id, loans.due_on::text AS due_on,
        COALESCE(loans.due_on < CURRENT_DATE, false) AS overdue
      FROM books JOIN authors ON authors.id = books.author_id
      LEFT JOIN loans ON loans.book_id = books.id AND loans.returned_on IS NULL
      ORDER BY title, books.id
    `,
    sql<Reservation[]>`
      SELECT reservations.id, book_id, member_id, members.name
      FROM reservations JOIN members ON members.id = reservations.member_id
      ORDER BY reservations.id
    `,
  ]);

  const queues = new Map<number, Reservation[]>();
  for (const reservation of reservations) {
    const queue = queues.get(reservation.book_id) ?? [];
    queue.push(reservation);
    queues.set(reservation.book_id, queue);
  }
  const overdue = books.filter((book) => book.overdue).length;

  return (
    <>
      <div className="stats" aria-label="Collection summary">
        <div><span>Titles in catalog</span><strong>{books.length}</strong></div>
        <div><span>On loan</span><strong>{books.filter((book) => book.loan_id !== null).length}</strong></div>
        <div><span>Reservations</span><strong>{reservations.length}</strong></div>
        <div><span>Overdue loans</span><strong>{overdue}</strong></div>
      </div>
      {overdue > 0 && <aside className="notice"><strong>{overdue} overdue {overdue === 1 ? "loan" : "loans"}</strong>
        <Link href="/loans#overdue">View overdue notices →</Link></aside>}
      <details className="panel add-panel">
        <summary>+ Add a book</summary>
        <AddBookForm authors={authors} />
      </details>
      <section className="panel">
        <div className="panel-heading"><h2>Books</h2><span>{books.length} in your collection</span></div>
        {books.length === 0 ? <p>No books in the library yet.</p> : (
          <ul className="book-list">
            {books.map((book) => {
              const queue = queues.get(book.id) ?? [];
              const first = queue[0];
              const eligible = first ? members.filter((member) => member.id === first.member_id) : members;
              const canReserve = members.filter((member) => !queue.some((entry) => entry.member_id === member.id));
              const status = book.overdue ? "Overdue" : book.loan_id !== null ? "On loan" : first ? "Reserved" : "Available";
              return (
                <li key={book.id} className="book-row">
                  <div>
                    <h3>{book.title}</h3>
                    <p>{book.author}{book.year === null ? "" : ` · ${book.year}`}</p>
                  </div>
                  <div><span className={`badge ${status.toLowerCase().replace(" ", "-")}`}>{status}</span>
                    {book.due_on && <p className="due">Due {book.due_on}</p>}
                    {first && <p className="due">{queue.length} in queue · Next: {first.name}</p>}
                  </div>
                  <div className="book-actions">
                    {book.loan_id !== null ? (
                      <form action={returnBook}>
                        <input type="hidden" name="loanId" value={book.loan_id} />
                        <button type="submit">Return</button>
                      </form>
                    ) : eligible.length > 0 ? <CirculationForm bookId={book.id} members={eligible} /> : (
                      <Link href="/members">Add a member to lend</Link>
                    )}
                    <details>
                      <summary>Manage book</summary>
                      {canReserve.length > 0 && <CirculationForm bookId={book.id} members={canReserve} reserve />}
                      {queue.length > 0 && <ol className="queue" aria-label="Reservation queue">
                        {queue.map((entry) => <li key={entry.id}>
                          {entry.name}
                          <form action={cancelReservation}>
                            <input type="hidden" name="reservationId" value={entry.id} />
                            <input type="hidden" name="bookId" value={book.id} />
                            <button className="text-button" type="submit" aria-label={`Cancel reservation for ${entry.name}`}>Cancel</button>
                          </form>
                        </li>)}
                      </ol>}
                      <AddBookForm authors={authors} book={book} />
                      <DeleteBookButton bookId={book.id} />
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
