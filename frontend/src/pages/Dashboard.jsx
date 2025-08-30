// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("x-authorization");
        if (!token) throw new Error("No auth token found");

        const res = await fetch("http://localhost:5000/api/webhooks/events", {
          headers: { "x-authorization": `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();

        // Only keep events that are pending or retrying
        setEvents(data.filter((e) => e.status === "pending" || e.status === "retrying"));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleReplay = async (id) => {
    try {
      const token = localStorage.getItem("x-authorization");
      if (!token) throw new Error("No auth token found");

      // Optimistically update UI to show "retrying"
      setEvents((prev) =>
        prev.map((e) =>
          e._id === id ? { ...e, status: "retrying" } : e
        )
      );

      const res = await fetch(`http://localhost:5000/api/webhooks/replay/${id}`, {
        method: "POST",
        headers: { "x-authorization": `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to replay event");

      alert(`Event ${id} queued for replay`);
    } catch (err) {
      alert(err.message);
      // Mark event as failed and remove from Dashboard
      setEvents((prev) => prev.filter((e) => e._id !== id));
    }
  };

  // Automatically remove events that are no longer pending/retrying
  const filteredEvents = events.filter(
    (e) => e.status === "pending" || e.status === "retrying"
  );

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen overflow-hidden text-white p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-blue-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(white,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-ping"></div>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-800 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-extrabold mb-8 drop-shadow-lg text-blue-300 z-10 relative"
      >
        🌌 Dashboard
      </motion.h1>

      {loading && <p className="text-gray-400 z-10 relative">Loading events...</p>}
      {error && <p className="text-red-400 z-10 relative">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative w-full">
          {filteredEvents.length === 0 && (
            <p>No events to replay. Webhooks will appear here once they fail or are pending!</p>
          )}

          {filteredEvents.map((event) => {
            const appName = event.app?.name || "Unknown App";
            const isRetrying = event.status === "retrying";

            return (
              <motion.div
                key={event._id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-blue-500/40 flex flex-col transition-all"
              >
                <h2 className="text-xl font-semibold mb-2 text-blue-300">{appName}</h2>

                <p className="text-gray-400 text-sm mb-2">
                  Status:{" "}
                  <span
                    className={
                      event.status === "pending"
                        ? "text-yellow-400"
                        : event.status === "delivered"
                        ? "text-green-400"
                        : event.status === "retrying"
                        ? "text-orange-400"
                        : "text-red-400"
                    }
                  >
                    {event.status}
                  </span>
                </p>

                <p className="text-gray-400 text-xs mb-2">
                  {new Date(event.createdAt).toLocaleString()}
                </p>

                {!isRetrying && (
                  <button
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-all"
                    onClick={() => handleReplay(event._id)}
                  >
                    Replay
                  </button>
                )}

                {isRetrying && (
                  <button
                    disabled
                    className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg cursor-not-allowed"
                  >
                    Replaying...
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
