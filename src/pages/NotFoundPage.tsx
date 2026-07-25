import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="content-card" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page not found</h1>
      <p>The requested page does not exist or is no longer available.</p>
      <Link className="navigation-link" to="/">
        Return to SecureCare
      </Link>
    </section>
  );
}
