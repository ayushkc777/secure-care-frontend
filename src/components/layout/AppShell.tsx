import { Outlet } from "react-router-dom";

import { SkipLink } from "../accessibility/SkipLink";
import { AppNavigation } from "./AppNavigation";

export function AppShell() {
  return (
    <>
      <SkipLink />
      <header className="site-header">
        <div className="header-content">
          <span className="brand">SecureCare</span>
          <AppNavigation />
        </div>
      </header>
      <main className="page-shell" id="main-content">
        <Outlet />
      </main>
    </>
  );
}
