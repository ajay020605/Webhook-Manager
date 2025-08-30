// src/pages/History.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function History() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | success | failed
  const [showPayload, setShowPayload] = useState({}); // Track expanded payloads

  // Map frontend filter to backend status values
  const filterMap = {
    all: "",        // all success + failed
    delivered: "success",
    failed: "failed",
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("x-authorization");
        if (!token) throw new Error("No auth token found");

        const query = filterMap[filter] ? `?status=${filterMap[filter]}` : "";
        const res = await fetch(`http://localhost:5000/api/webhooks/events${query}`, {
          headers: { "x-authorization": `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();

        // Only keep success or failed events (exclude pending/retrying)
        const filteredData = data.filter(
          (e) => e.status === "success" || e.status === "failed"
        );

        setEvents(filteredData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter]);

  const togglePayload = (id) => {
    setShowPayload((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen overflow-hidden text-white p-6">
      {/* Background space theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-blue-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(white,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-ping"></div>
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-purple-800 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-extrabold mb-8 drop-shadow-lg text-blue-300"
      >
        🌌 Webhook History
      </motion.h1>

      {/* Filter */}
      <div className="flex gap-4 mb-8 z-10 relative">
        {["all", "delivered", "failed"].map((f) => (
          <button
            key={f}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "delivered" ? "Successful" : "Failed"}
          </button>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && <p className="text-gray-400 z-10 relative">Loading events...</p>}
      {error && <p className="text-red-400 z-10 relative">{error}</p>}

      {/* Events Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative w-full">
          {events.length === 0 && <p>No events found for this filter.</p>}

          {events.map((event) => {
            const payload = event.payload || {};
            const objectData = payload.object || {};
            const isExpanded = showPayload[event._id] || false;

            return (
              <motion.div
                key={event._id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-purple-500/40 flex flex-col cursor-pointer transition-all w-full"
              >
                {/* Event type */}
                <h2 className="text-xl font-semibold mb-2 text-purple-300">{event.event || "Unknown Event"}</h2>

                {/* Status */}
                <p className="text-gray-400 text-sm mb-2">
                  Status:{" "}
                  <span
                    className={
                      event.status === "success"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {event.status}
                  </span>
                </p>

                {/* Meeting info */}
                {objectData.topic && (
                  <p className="text-gray-300 text-sm mb-1">Topic: {objectData.topic}</p>
                )}
                {objectData.start_time && (
                  <p className="text-gray-300 text-sm mb-1">
                    Start: {new Date(objectData.start_time).toLocaleString()}
                  </p>
                )}
                {objectData.end_time && (
                  <p className="text-gray-300 text-sm mb-1">
                    End: {new Date(objectData.end_time).toLocaleString()}
                  </p>
                )}
                {objectData.duration !== undefined && (
                  <p className="text-gray-300 text-sm mb-1">Duration: {objectData.duration} sec</p>
                )}

                {/* Target URL */}
                {event.targetUrl && (
                  <p className="text-gray-400 text-xs mt-2 break-all">Target: {event.targetUrl}</p>
                )}

                {/* Toggle payload */}
                <button
                  onClick={() => togglePayload(event._id)}
                  className="mt-2 text-xs text-blue-400 hover:underline self-start"
                >
                  {isExpanded ? "Hide Full Payload" : "Show Full Payload"}
                </button>
                {isExpanded && (
                  <div className="mt-2 w-full p-3 bg-gradient-to-br from-gray-900/80 to-gray-800/60 rounded-xl border border-purple-500/50 shadow-inner overflow-x-auto">
                    <code className="text-gray-200 text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(payload, null, 2)}
                    </code>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
