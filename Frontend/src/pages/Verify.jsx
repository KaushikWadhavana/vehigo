import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

import { sendEmailVerification } from "firebase/auth";
import Swal from "sweetalert2";

function Verify() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;

try {
  await user.reload();
} catch (err) {
  console.log("User deleted from Firebase");
  await auth.signOut();
  navigate("/login");
  return;
}

if (user.emailVerified) {
  clearInterval(interval);

  const token = await user.getIdToken(true);

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error("Sync failed");
    return;
  }

  const data = await res.json();
  const syncedUser = data.user;

  if (syncedUser.role === "admin") {
    navigate("/admin");
  } else if (syncedUser.role === "owner") {
    navigate("/owner");
  } else {
    navigate("/userhome");
  }
}
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

const handleResend = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    setResendLoading(true);

    await user.reload(); // ✅ IMPORTANT

    await sendEmailVerification(user, {
      url: "https://vehigo-two.vercel.app/login", // 🔥 REQUIRED
      handleCodeInApp: false,
    });

    setCooldown(30);

    Swal.fire({
      icon: "success",
      title: "Email Sent!",
      text: "Verification email has been resent.",
      timer: 2000,
      showConfirmButton: false,
    });

  } catch (err) {
    console.error(err); // 🔥 add this

    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Failed to resend verification email.",
    });
  } finally {
    setResendLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617] relative">

      {/* Radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md bg-[#020617]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center shadow-[0_50px_120px_rgba(0,0,0,0.8)] animate-[fadeUp_.8s_ease]">

        {/* Loader */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 w-3.5 h-3.5 bg-sky-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_18px_rgba(56,189,248,0.9)]"></div>
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-3">
          Waiting for email verification
        </h2>

        <p className="text-slate-400 text-sm mb-6">
          Verify your email from any device.
        </p>

        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
          <div className="w-1/2 h-full bg-gradient-to-r from-sky-400 to-blue-400 animate-[slide_1.5s_infinite]"></div>
        </div>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resendLoading}
          className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium"
        >
          {resendLoading
            ? "Sending..."
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend Verification Email"}
        </button>

        <p className="text-xs text-slate-500 mt-4">
          This page will redirect automatically once verified.
        </p>
      </div>

      {/* Custom animations */}
      <style>
        {`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default Verify;
