import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMessage, setChangeMessage] = useState(null);

  const token = localStorage.getItem("x-authorization");

  // ================= FETCH USER PROFILE =================
  const fetchProfile = async () => {
    try {
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch("http://localhost:5000/auth/profile", {
        headers: { "x-authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error(err);
      localStorage.removeItem("x-authorization");
      navigate("/");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("x-authorization");
    navigate("/");
  };

  // ================= CHANGE PASSWORD =================
  const requestChangePassword = async () => {
    try {
      setChangeLoading(true);
      setChangeMessage(null);

      const res = await fetch("http://localhost:5000/auth/change-password-request", {
        method: "POST",
        headers: { "x-authorization": `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setChangeMessage("OTP sent to your email");
    } catch (err) {
      setChangeMessage(err.message);
    } finally {
      setChangeLoading(false);
    }
  };

  const submitChangePassword = async () => {
    if (!otp || !newPassword || !confirmNewPassword) {
      setChangeMessage("Please fill all fields");
      return;
    }

    try {
      setChangeLoading(true);
      setChangeMessage(null);

      const res = await fetch("http://localhost:5000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ otp, newPassword, confirmNewPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setChangeMessage("Password changed successfully!");
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowChangePassword(false);
    } catch (err) {
      setChangeMessage(err.message);
    } finally {
      setChangeLoading(false);
    }
  };

  if (!user) return <p className="text-white">Loading profile...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-6">Your Profile</h1>
      <p className="mb-4">
        Username: <span className="font-semibold">{user.username}</span>
      </p>
      <p className="mb-4">
        Email: <span className="font-semibold">{user.email}</span>
      </p>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowChangePassword(!showChangePassword)}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg"
        >
          {showChangePassword ? "Cancel" : "Change Password"}
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {showChangePassword && (
        <div className="flex flex-col gap-3 w-[320px]">
          <button
            onClick={requestChangePassword}
            disabled={changeLoading}
            className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded-lg"
          >
            Request OTP
          </button>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          />
          <button
            onClick={submitChangePassword}
            disabled={changeLoading}
            className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-lg"
          >
            {changeLoading ? "Processing..." : "Change Password"}
          </button>
          {changeMessage && <p className="text-green-300 mt-2 text-sm">{changeMessage}</p>}
        </div>
      )}
    </div>
  );
}
