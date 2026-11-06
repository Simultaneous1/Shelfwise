"use client";

import { useActionState } from "react";
import { addBook, deleteBook } from "./book-actions";

type Author = { id: number; name: string };

type EditableBook = {
  id: number;
  title: string;
  author_id: number;
  year: number | null;
};

export default function AddBookForm({
  authors,
  book,
}: {
  authors: Author[];
  book?: EditableBook;
}) {
  const [message, formAction, pending] = useActionState(addBook, "");

  return (
    <form action={formAction} className="book-form">
      {book ? (
        <input type="hidden" name="bookId" value={book.id} />
      ) : (
        <h2 className="text-xl font-semibold">Add a book</h2>
      )}

      <label className="grid gap-1">
        Title
        <input name="title" defaultValue={book?.title ?? ""} required className="rounded border p-2" />
      </label>

      <label className="grid gap-1">
        Author
        <select name="authorId" defaultValue={book?.author_id ?? ""} required className="rounded border p-2">
          <option value="" disabled>Choose an author</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>{author.name}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        Publication year (optional)
        <input name="year" type="number" min="1" max="9999" defaultValue={book?.year ?? ""} className="rounded border p-2" />
      </label>

      <button type="submit" disabled={pending} className="w-fit rounded border px-4 py-2">
        {pending ? "Saving…" : book ? "Save changes" : "Add book"}
      </button>

      <p role="status">{message}</p>
    </form>
  );
}

export function DeleteBookButton({ bookId }: { bookId: number }) {
  return (
    <form action={deleteBook}>
      <input type="hidden" name="bookId" value={bookId} />
      <button
        type="button"
        className="text-button"
        onClick={(event) => {
          if (window.confirm("Delete this book, its reservations, and its loan records?")) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      >
        Delete
      </button>
    </form>
  );
}