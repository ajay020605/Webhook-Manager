import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true);
  const [step, setStep] = useState("form"); // "form" | "otp" | "forgot" | "reset"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("x-authorization") || null);

  // Form states
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ================= SIGNUP =================
      if (isSignup && step === "form") {
        const res = await fetch("http://localhost:5000/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");

        setStep("otp");
        return;
      }

      // ================= VERIFY SIGNUP OTP =================
      if (isSignup && step === "otp") {
        const res = await fetch("http://localhost:5000/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "OTP verification failed");

        localStorage.setItem("x-authorization", data.token);
        setToken(data.token);
        navigate("/home");
        return;
      }

      // ================= SIGNIN =================
      if (!isSignup && step === "form") {
        const res = await fetch("http://localhost:5000/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signin failed");

        localStorage.setItem("x-authorization", data.token);
        setToken(data.token);
        navigate("/home");
        return;
      }

      // ================= FORGOT PASSWORD REQUEST =================
      if (step === "forgot") {
        const res = await fetch("http://localhost:5000/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");

        setStep("reset");
        return;
      }

      // ================= RESET PASSWORD =================
      if (step === "reset") {
        if (newPassword !== confirmNewPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Reset password failed");

        alert("Password reset successfully! Please login.");
        setIsSignup(false);
        setStep("form");
        setOtp("");
        setNewPassword("");
        setConfirmNewPassword("");
        return;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-blue-900 animate-gradient-x"></div>
      <div className="absolute inset-0 bg-[radial-gradient(white,transparent_2px)] bg-[length:20px_20px] opacity-20 animate-ping"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-700 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-bounce"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>

      {/* Card */}
      <motion.form
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onSubmit={handleSubmit}
        className="relative z-10 bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-[380px] border border-blue-500/30"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold mb-6 text-center text-blue-300 drop-shadow-lg"
        >
          {isSignup
            ? step === "otp"
              ? "📧 Verify OTP"
              : "🚀 Create Account"
            : step === "forgot"
            ? "🔑 Forgot Password"
            : step === "reset"
            ? "🔒 Reset Password"
            : "✨ Welcome Back"}
        </motion.h1>

        {/* Form Inputs */}
        {step === "form" && (
          <>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
            {isSignup && (
              <>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
                  required
                />
              </>
            )}
            {!isSignup && (
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
                required
              />
            )}
          </>
        )}

        {step === "forgot" && (
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 text-white"
            required
          />
        )}

        {step === "otp" && (
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            name="otp"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 text-white"
            required
          />
        )}

        {step === "reset" && (
          <>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 text-white"
              required
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 text-white"
              required
            />
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="password"
              name="confirmNewPassword"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full p-3 mb-6 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 text-white"
              required
            />
          </>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-red-400 mb-4 text-sm text-center animate-pulse">{error}</p>
        )}

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-purple-500 hover:to-blue-500 rounded-lg p-3 font-semibold text-white shadow-lg disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : step === "otp"
            ? "Verify OTP ✅"
            : step === "reset"
            ? "Reset Password 🔒"
            : step === "forgot"
            ? "Send OTP 🔑"
            : isSignup
            ? "Sign Up ✨"
            : "Sign In 🚀"}
        </motion.button>

        {/* Toggle / Forgot */}
        {step === "form" && (
          <p className="text-sm text-center mt-4 text-gray-300">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setStep("form");
              }}
              className="text-blue-400 hover:underline hover:text-blue-300"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        )}

        {!isSignup && step === "form" && (
          <p className="text-sm text-center mt-2 text-gray-300">
            <button
              type="button"
              onClick={() => setStep("forgot")}
              className="text-green-400 hover:underline hover:text-green-300"
            >
              Forgot Password?
            </button>
          </p>
        )}
      </motion.form>
    </div>
  );
}
