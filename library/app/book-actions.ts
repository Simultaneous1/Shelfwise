"use server";

import { revalidatePath } from "next/cache";
import { sql } from "../lib/db";

export async function addBook(_previousMessage: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const authorId = Number(formData.get("authorId"));
  const yearText = String(formData.get("year") ?? "").trim();
  const year = yearText === "" ? null : Number(yearText);

  if (!title) return "Enter a book title.";

  if (!Number.isInteger(authorId) || authorId < 1 || authorId > 2147483647) {
    return "Select an author.";
  }

  if (year !== null && (!Number.isInteger(year) || year < 1 || year > 9999)) {
    return "Enter a whole year between 1 and 9999, or leave it blank.";
  }

  const bookIdText = formData.get("bookId");
  if (bookIdText !== null) {
    const bookId = Number(bookIdText);
    if (!Number.isInteger(bookId) || bookId < 1 || bookId > 2147483647) {
      return "Invalid book.";
    }

    const updated = await sql`
      UPDATE books SET title = ${title}, author_id = ${authorId}, year = ${year}
      WHERE id = ${bookId} AND EXISTS (SELECT 1 FROM authors WHERE id = ${authorId})
      RETURNING id
    `;
    if (!updated.length) return "Book or author no longer exists.";
    revalidatePath("/");
    revalidatePath("/loans");
    return "Book updated.";
  }

  const inserted = await sql`
    INSERT INTO books (title, author_id, year)
    SELECT ${title}, id, ${year}
    FROM authors
    WHERE id = ${authorId}
    RETURNING id
  `;

  if (inserted.length === 0) return "Select an author from the list.";

  revalidatePath("/");
  return "Book added.";
}

export async function deleteBook(formData: FormData) {
  const bookId = Number(formData.get("bookId"));
  if (!Number.isInteger(bookId) || bookId < 1 || bookId > 2147483647) return;

  await sql`DELETE FROM books WHERE id = ${bookId}`;
  revalidatePath("/");
  revalidatePath("/loans");
}
