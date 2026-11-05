"use server";

import { revalidatePath } from "next/cache";
import { sql } from "../lib/db";

function readId(formData: FormData, field: string) {
  const id = Number(formData.get(field));
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export async function lendBook(formData: FormData) {
  const bookId = readId(formData, "bookId");
  const memberId = readId(formData, "memberId");
  if (bookId === null || memberId === null) return;

  await sql`
    INSERT INTO loans (book_id, member_id, borrowed_on, due_on)
    SELECT books.id, members.id, CURRENT_DATE, CURRENT_DATE + 14
    FROM books
    CROSS JOIN members
    WHERE books.id = ${bookId} AND members.id = ${memberId}
    ON CONFLICT (book_id) WHERE returned_on IS NULL DO NOTHING
  `;

  revalidatePath("/");
}

export async function returnBook(formData: FormData) {
  const loanId = readId(formData, "loanId");
  if (loanId === null) return;

  await sql`
    UPDATE loans
    SET returned_on = CURRENT_DATE
    WHERE id = ${loanId} AND returned_on IS NULL
  `;

  revalidatePath("/");
}
