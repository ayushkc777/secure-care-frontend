import { Link } from "react-router-dom";

export function AccessDeniedPage() {
  return (
    <section className="content-card" aria-labelledby="access-denied-title">
      <p className="eyebrow">Access control</p>
      <h1 id="access-denied-title">Access denied</h1>
      <p>
        Your current centre role does not allow this page. Access is checked again by the server for
        every request.
      </p>
      <Link className="navigation-link" to="/access">
        Review my current access
      </Link>
    </section>
  );
}
