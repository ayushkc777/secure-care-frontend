import { NavLink } from "react-router-dom";

import { visibleAccessNavigation } from "../../features/access/access-policy";
import { useAccess } from "../../features/access/useAccess";

export function AppNavigation() {
  const state = useAccess();
  const navigationItems =
    state.status === "ready"
      ? [
          { label: "Home", to: "/" },
          { label: "Session", to: "/session" },
          ...visibleAccessNavigation(state.access),
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
    <nav aria-label="Primary navigation">
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
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
