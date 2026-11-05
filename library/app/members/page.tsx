import { connection } from "next/server";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { sql } from "../../lib/db";

async function addMember(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;
  await sql`INSERT INTO members (name, phone) VALUES (${name}, ${phone || null})`;
  revalidatePath("/members");
  revalidatePath("/");
}

export default function MembersPage() {
  return (
    <main className="shell">
      <section className="hero"><div><p className="eyebrow">Library community</p>
        <h1>Members</h1><p>Register borrowers and find members of your library.</p></div></section>
      <section className="panel"><h2>Add a member</h2>
        <form action={addMember} className="member-form">
          <label>Name<input name="name" required pattern={".*\\S.*"} /></label>
          <label>Phone (optional)<input name="phone" type="tel" /></label>
          <button type="submit">Add member</button>
        </form>
      </section>
      <Suspense fallback={<p className="panel">Loading members…</p>}><MembersList /></Suspense>
    </main>
  );
}

async function MembersList() {
  await connection();
  const members = await sql<{ id: number; name: string; phone: string | null }[]>`
    SELECT id, name, phone FROM members ORDER BY name, id
  `;
  return <section className="panel">
    <div className="panel-heading"><h2>Member directory</h2><span>{members.length} registered</span></div>
    {members.length ? <table><thead><tr><th scope="col">Name</th><th scope="col">Phone</th></tr></thead>
      <tbody>{members.map((member) => <tr key={member.id}><th scope="row">{member.name}</th><td>{member.phone ?? "—"}</td></tr>)}</tbody>
    </table> : <p>No members yet.</p>}
  </section>;
}
