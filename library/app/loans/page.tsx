import { connection } from "next/server";
import { Suspense } from "react";
import { sql } from "../../lib/db";

type Loan = {
  id: number; title: string; member: string; borrowed_on: string;
  due_on: string; returned_on: string | null; overdue: boolean;
};

export default function LoansPage() {
  return (
    <main className="shell">
      <section className="hero">
        <div><p className="eyebrow">Circulation</p><h1>Loans & history</h1>
          <p>See what’s overdue, what’s still out, and what’s been returned.</p></div>
      </section>
      <Suspense fallback={<p className="panel">Loading loan records…</p>}><LoanRecords /></Suspense>
    </main>
  );
}

async function LoanRecords() {
  await connection();
  const loans = await sql<Loan[]>`
    SELECT loans.id, books.title, members.name AS member, borrowed_on::text,
      due_on::text, returned_on::text, (returned_on IS NULL AND due_on < CURRENT_DATE) AS overdue
    FROM loans JOIN books ON books.id = loans.book_id
    JOIN members ON members.id = loans.member_id
    ORDER BY borrowed_on DESC, loans.id DESC
  `;
  const overdue = loans.filter((loan) => loan.overdue)
    .sort((a, b) => a.due_on.localeCompare(b.due_on));

  return (
    <>
      <section className="panel" id="overdue">
        <div className="panel-heading"><h2>Overdue notices</h2><span>{overdue.length} need attention</span></div>
        {overdue.length ? <ul className="overdue-list">
          {overdue.map((loan) => <li className="notice" key={loan.id}>
            <div><strong>{loan.title}</strong><p>Borrowed by {loan.member}</p></div>
            <span className="badge overdue">Due {loan.due_on}</span>
          </li>)}
        </ul> : <p>No overdue loans.</p>}
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Loan history</h2><span>{loans.length} records</span></div>
        {loans.length ? <div className="table-wrap" tabIndex={0} role="region" aria-label="Loan history">
          <table>
            <thead><tr>{["Book", "Member", "Borrowed", "Due", "Returned", "Status"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead>
            <tbody>{loans.map((loan) => {
              const status = loan.returned_on ? "Returned" : loan.overdue ? "Overdue" : "On loan";
              return <tr key={loan.id}><th scope="row">{loan.title}</th><td>{loan.member}</td>
                <td>{loan.borrowed_on}</td><td>{loan.due_on}</td><td>{loan.returned_on ?? "—"}</td>
                <td><span className={`badge ${status.toLowerCase().replace(" ", "-")}`}>{status}</span></td></tr>;
            })}</tbody>
          </table>
        </div> : <p>No loans recorded yet.</p>}
      </section>
    </>
  );
}
