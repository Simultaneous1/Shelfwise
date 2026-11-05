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
