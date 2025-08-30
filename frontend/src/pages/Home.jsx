import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("x-authorization");

  const predefinedApps = [
    { name: "Zoom", icon: "/assets/zoom.svg", description: "Manage your Zoom integrations here" },
  ];

  // ================= FETCH APPS =================
  const fetchApps = async () => {
    try {
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/apps", {
        headers: { "x-authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch apps");
      const data = await res.json();

      const uniqueApps = data.filter(
        (app) => !predefinedApps.some((preApp) => preApp.name === app.name)
      );
      setApps(uniqueApps);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-blue-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(white,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-ping"></div>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-800 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>

      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-extrabold mb-6 drop-shadow-lg text-blue-300"
      >
        🌌 Your Apps
      </motion.h1>

      {/* Apps */}
      {loading ? (
        <p className="text-gray-400">Loading apps...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
          {predefinedApps.map((app) => (
            <motion.div
              key={app.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-blue-500/40 flex flex-col items-center cursor-pointer"
              onClick={() => navigate(`/app-manager/${app.name}`)}
            >
              <img src={app.icon} alt={app.name} className="h-16 mb-4" />
              <h2 className="text-xl font-semibold text-blue-300">{app.name}</h2>
              <p className="text-gray-400 text-sm mt-2 text-center">{app.description}</p>
            </motion.div>
          ))}
          {apps.map((app) => (
            <motion.div
              key={app._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-purple-500/40 flex flex-col items-center cursor-pointer"
              onClick={() => navigate(`/app-manager/${app.name}`)}
            >
              <h2 className="text-xl font-semibold text-purple-300">{app.name}</h2>
              <p className="text-gray-400 text-sm mt-2 text-center break-all">
                Target: {app.targetUrl}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
