import { Link } from "react-router-dom";

export function RouteErrorPage() {
  return (
    <main className="page-shell" id="main-content">
      <section className="content-card" role="alert">
        <h1>Unable to display this page</h1>
        <p>An unexpected routing error occurred.</p>
        <nav aria-label="Error recovery">
          <Link className="navigation-link" to="/">
            Return home
          </Link>
        </nav>
      </section>
    </main>
  );
}
