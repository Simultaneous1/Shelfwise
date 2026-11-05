"use server";

import { revalidatePath } from "next/cache";
import { sql } from "../lib/db";

function readId(formData: FormData, field: string) {
  const id = Number(formData.get(field));
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export async function reserveBook(_message: string, formData: FormData) {
  const bookId = readId(formData, "bookId");
  const memberId = readId(formData, "memberId");
  if (bookId === null || memberId === null) return "Choose a member.";

  const message = await sql.begin(async (tx) => {
    // Serialize queue changes and checkouts for the same book.
    const books = await tx`SELECT id FROM books WHERE id = ${bookId} FOR UPDATE`;
    if (!books.length) return "This book was removed.";

    const inserted = await tx`
      INSERT INTO reservations (book_id, member_id)
      SELECT ${bookId}, id FROM members WHERE id = ${memberId}
      ON CONFLICT (book_id, member_id) DO NOTHING
      RETURNING id
    `;
    return inserted.length ? "Reservation added." : "Member is already in the queue or no longer exists.";
  });

  revalidatePath("/");
  return message;
}

export async function cancelReservation(formData: FormData) {
  const id = readId(formData, "reservationId");
  const bookId = readId(formData, "bookId");
  if (id === null || bookId === null) return;

  await sql.begin(async (tx) => {
    await tx`SELECT id FROM books WHERE id = ${bookId} FOR UPDATE`;
    await tx`DELETE FROM reservations WHERE id = ${id} AND book_id = ${bookId}`;
  });

  revalidatePath("/");
}

export async function lendBook(_message: string, formData: FormData) {
  const bookId = readId(formData, "bookId");
  const memberId = readId(formData, "memberId");
  if (bookId === null || memberId === null) return "Choose a member.";

  const message = await sql.begin(async (tx) => {
    const books = await tx`SELECT id FROM books WHERE id = ${bookId} FOR UPDATE`;
    if (!books.length) return "This book was removed.";

    const [first] = await tx<{ id: number; member_id: number }[]>`
      SELECT id, member_id FROM reservations WHERE book_id = ${bookId}
      ORDER BY id LIMIT 1
    `;
    if (first && first.member_id !== memberId) return "This book is reserved for the first member in the queue.";

    const inserted = await tx`
      INSERT INTO loans (book_id, member_id, borrowed_on, due_on)
      SELECT ${bookId}, id, CURRENT_DATE, CURRENT_DATE + 14
      FROM members WHERE id = ${memberId}
      ON CONFLICT (book_id) WHERE returned_on IS NULL DO NOTHING
      RETURNING id
    `;
    if (!inserted.length) return "The book is already on loan or the member no longer exists.";

    if (first) await tx`DELETE FROM reservations WHERE id = ${first.id}`;
    return "Book lent.";
  });

  revalidatePath("/");
  revalidatePath("/loans");
  return message;
}

export async function returnBook(formData: FormData) {
  const loanId = readId(formData, "loanId");
  if (loanId === null) return;

  await sql`
    UPDATE loans SET returned_on = CURRENT_DATE
    WHERE id = ${loanId} AND returned_on IS NULL
  `;

  revalidatePath("/");
  revalidatePath("/loans");
}
