import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shelfwise · Library Desk",
  description: "Manage your collection, members, reservations, and loans.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand"><span aria-hidden="true">S</span> Shelfwise</Link>
            <nav aria-label="Library">
              <Link href="/">Catalog</Link>
              <Link href="/members">Members</Link>
              <Link href="/loans">Loans</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
