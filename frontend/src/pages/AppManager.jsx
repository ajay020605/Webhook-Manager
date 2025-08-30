import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

export default function AppManager() {
  const { appName } = useParams(); // get app name from route
  const [targetUrl, setTargetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [appExists, setAppExists] = useState(false); // track if app exists

  // Fetch existing app on mount
  useEffect(() => {
    const fetchApp = async () => {
      try {
        const token = localStorage.getItem("x-authorization");
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/apps", {
          headers: { "x-authorization": `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch apps");

        const data = await res.json();
        const existingApp = data.find((app) => app.name === appName);
        if (existingApp) {
          setTargetUrl(existingApp.targetUrl);
          setAppExists(true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchApp();
  }, [appName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("x-authorization");
      if (!token) throw new Error("No auth token found");

      const res = await fetch("http://localhost:5000/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: appName,
          targetUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create/update app");

      // Switch to update mode after creation
      setAppExists(true);
      setSuccess("App saved successfully!");

      // Auto-clear success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-blue-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(white,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-ping"></div>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-800 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>

      <motion.form
        onSubmit={handleSubmit}
        className="relative z-10 bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-[380px] border border-blue-500/30"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-extrabold mb-6 text-center text-blue-300 drop-shadow-lg"
        >
          {appExists ? "Update App" : "Create App"}
        </motion.h1>

        {/* App Name (read-only) */}
        <motion.input
          type="text"
          value={appName}
          readOnly
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 text-white text-center cursor-not-allowed"
        />

        {/* Target URL input */}
        <motion.input
          type="text"
          placeholder="Enter Target URL"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 transition-all"
          required
        />

        {/* Error */}
        {error && (
          <p className="text-red-400 mb-4 text-sm text-center animate-pulse">{error}</p>
        )}

        {/* Success */}
        {success && (
          <p className="text-green-400 mb-4 text-sm text-center animate-pulse">{success}</p>
        )}

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-purple-500 hover:to-blue-500 transition-all rounded-lg p-3 font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Please wait..." : appExists ? "Update App" : "Create App"}
        </motion.button>
      </motion.form>
    </div>
  );
}
