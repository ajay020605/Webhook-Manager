// /src/layouts/Layout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("x-authorization");

  const handleLogout = () => {
    localStorage.removeItem("x-authorization");
    navigate("/"); // redirect to login/signup
  };

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "History", path: "/history" },
    { name: "App Manager", path: "/app-manager/Zoom" },
  ];

  return (
    <div className="flex flex-col h-screen text-white bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-700 shadow-lg">
        {/* Left: Branding */}
        <div className="text-2xl font-extrabold text-white">
          WebM <span className="text-blue-300">Manager</span>
        </div>

        {/* Right: Profile & Logout buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition"
          >
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="flex flex-col bg-gray-800 w-52 p-6 gap-4 border-r border-gray-700">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-300"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
