import { NavLink } from "react-router-dom";

import { visibleAccessNavigation } from "../../features/access/access-policy";
import { useAccess } from "../../features/access/useAccess";

export function AppNavigation() {
  const state = useAccess();
  const navigationItems =
    state.status === "ready"
      ? [
          { label: "Overview", to: "/dashboard" },
          ...visibleAccessNavigation(state.access),
          { label: "Session & MFA", to: "/session" },
        ]
      : state.status === "restricted"
        ? [
            { label: "Home", to: "/" },
            { label: "Complete MFA", to: "/mfa/required" },
            { label: "Session", to: "/session" },
          ]
        : [
            { label: "Home", to: "/" },
            { label: "Login", to: "/login" },
            { label: "Register", to: "/register" },
          ];

  return (
    <nav className="primary-navigation" id="primary-navigation" aria-label="Primary navigation">
      <ul className="navigation-list">
        {navigationItems.map((item) => (
          <li key={item.to}>
            <NavLink
              className={({ isActive }) =>
                isActive ? "navigation-link navigation-link-active" : "navigation-link"
              }
              end={item.to === "/"}
              to={item.to}
            >
              <span className="navigation-dot" aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
