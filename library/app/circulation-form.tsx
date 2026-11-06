"use client";

import { useActionState } from "react";
import { lendBook, reserveBook } from "./loan-actions";

export default function CirculationForm({ bookId, members, reserve = false }: {
  bookId: number;
  members: { id: number; name: string }[];
  reserve?: boolean;
}) {
  const [message, action, pending] = useActionState(reserve ? reserveBook : lendBook, "");
  return (
    <form action={action} className="circulation-form">
      <input type="hidden" name="bookId" value={bookId} />
      <label>
        <span className="sr-only">{reserve ? "Reserve for member" : "Lend to member"}</span>
        <select name="memberId" required defaultValue={members.length === 1 ? members[0].id : ""}>
          <option value="" disabled>Choose member</option>
          {members.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <button className={reserve ? "secondary" : ""} disabled={pending} type="submit">
        {pending ? "Saving…" : reserve ? "Reserve" : "Lend"}
      </button>
      {message && <span className="form-message" role="status">{message}</span>}
    </form>
  );
}
