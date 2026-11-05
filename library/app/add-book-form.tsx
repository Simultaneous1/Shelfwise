"use client";

import { useActionState } from "react";
import { addBook } from "./book-actions";

type Author = { id: number; name: string };

export default function AddBookForm({ authors }: { authors: Author[] }) {
  const [message, formAction, pending] = useActionState(addBook, "");

  return (
    <form action={formAction} className="mb-8 grid gap-3 rounded border p-4">
      <h2 className="text-xl font-semibold">Add a book</h2>

      <label className="grid gap-1">
        Title
        <input name="title" required className="rounded border p-2" />
      </label>

      <label className="grid gap-1">
        Author
        <select name="authorId" required defaultValue="" className="rounded border p-2">
          <option value="" disabled>Choose an author</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>{author.name}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        Publication year (optional)
        <input name="year" type="number" min="1" max="9999" className="rounded border p-2" />
      </label>

      <button type="submit" disabled={pending} className="w-fit rounded border px-4 py-2">
        {pending ? "Adding…" : "Add book"}
      </button>

      <p role="status">{message}</p>
    </form>
  );
}
