import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({
  children,
  eyebrow = "Secure account",
  title,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <Link className="auth-back-link" to="/">
        ← SecureCare
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="auth-title">{title}</h1>
      {children}
    </section>
  );
}
