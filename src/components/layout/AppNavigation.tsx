import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Home", to: "/" },
  { label: "Login", to: "/login" },
  { label: "Register", to: "/register" },
  { label: "Session", to: "/session" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Profile", to: "/profile" },
  { label: "Notifications", to: "/notifications" },
  { label: "Children", to: "/children" },
  { label: "Incidents", to: "/incidents" },
  { label: "Pickup", to: "/pickup" },
  { label: "Audit", to: "/audit" },
  { label: "Admin", to: "/admin" },
] as const;

export function AppNavigation() {
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
