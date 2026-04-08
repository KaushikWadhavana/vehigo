import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendEmailVerification,
  updateProfile,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { registerUser } from "../auth/registerAuth";
import { googleLogin } from "../auth/googleAuth";
import { auth } from "../firebase";
import "../styles/Auth.css";
import { FcGoogle } from "react-icons/fc";

import Swal from "sweetalert2";

function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();

    const { name, email, phone, password, confirmPassword } = form;

    if (!name || !email || !phone || !password || !confirmPassword) {
      Swal.fire({
  icon: "warning",
  title: "Missing Fields",
  text: "All fields are required",
});
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
  icon: "error",
  title: "Invalid Email",
  text: "Please enter a valid email address",
});
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
  Swal.fire({
  icon: "warning",
  title: "Invalid Phone",
  text: "Phone number must be exactly 10 digits",
});
      return;
    }

    if (password !== confirmPassword) {
 Swal.fire({
  icon: "warning",
  title: "Password Mismatch",
  text: "Passwords do not match",
});
      return;
    }

try {
  // 🔥 CHECK BEFORE FIREBASE CREATION
const checkRes = await fetch('${import.meta.env.VITE_API_URL}/api/auth/check-owner-email', {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email }),
});

if (!checkRes.ok) {
  const errorData = await checkRes.json();

  if (checkRes.status === 403) {
    Swal.fire({
      icon: "warning",
      title: "Owner Payment Pending",
      text: errorData.message,
    });
    return; // ❌ STOP — no Firebase call
  }

  throw new Error(errorData.message || "Check failed");
}

const user = await registerUser(email, password);


  await updateProfile(user, {
    displayName: name,
  });

await sendEmailVerification(user);
Swal.fire({
  icon: "success",
  title: "Verification Email Sent",
  text: "Please check your email to verify your account.",
  timer: 2000,
  showConfirmButton: false,
});

await user.reload();
const token = await user.getIdToken();

const res = await fetch('${import.meta.env.VITE_API_URL}/api/auth/sync', {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ phone, name }),
});

if (!res.ok) {
  const errorData = await res.json();

  // 🔥 HANDLE OWNER PAYMENT CASE
  if (res.status === 403) {
    Swal.fire({
      icon: "warning",
      title: "Owner Approval Pending Payment",
      text: errorData.message || "Please complete payment before registering",
    });
    return;
  }

  throw new Error(errorData.message || "Backend sync failed");
}

const data = await res.json();
console.log("Synced user:", data);

  localStorage.setItem("pendingPhone", phone);

  nav("/verify");
}
catch (err) {
      if (err.code === "auth/email-already-in-use") {
        try {
          const loginRes = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );

          if (!loginRes.user.emailVerified) {
            await sendEmailVerification(loginRes.user);
            localStorage.setItem("pendingPhone", phone);

         Swal.fire({
  icon: "info",
  title: "Verification Resent",
  text: "Email already registered but not verified. Verification email resent.",
});
            nav("/verify");
            return;
          }
Swal.fire({
  icon: "info",
  title: "Already Verified",
  text: "You are already verified. Please login.",
});
          nav("/login");
        } catch {
            Swal.fire({
  icon: "error",
  title: "Email In Use",
  text: "Email already in use. Please login.",
});
          nav("/login");
        }
      } else {
        Swal.fire({
  icon: "error",
  title: "Registration Error",
  text: err.message,
});
      }
    }
  };

const handleGoogle = async () => {
  try {
    const user = await googleLogin();

    await user.reload();
const token = await user.getIdToken();

    const res = await fetch('${import.meta.env.VITE_API_URL}/api/auth/sync', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: user.displayName,
        email: user.email,
        profileImage: user.photoURL,
        provider: "google",
      }),
    });
if (!res.ok) {
  const errorData = await res.json();

  if (res.status === 403) {
    Swal.fire({
      icon: "warning",
      title: "Owner Approval Pending Payment",
      text: errorData.message || "Complete payment first",
    });
    return;
  }

  throw new Error(errorData.message || "Backend sync failed");
}

    nav("/userhome");
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Google Login Failed",
      text: err.message,
    });
  }
};
return (
  <div className="register-container">

    {/* 🔙 Back to Home */}
    <button className="back-home" onClick={() => nav("/")}>
      ← Back to Home
    </button>

    <div className="register-box">
<div className="brand">
  <img
    src="/logo.png"
    alt="Vehigo Logo"
    className="brand-logo"
 
  />

  <h2>Welcome to Vehigo</h2>
  <p>Smarter rentals. Seamless journeys.</p>
</div>

      <form className="register-form" onSubmit={handleRegister}>
        <input
          name="name"
          placeholder="Full name"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setForm({ ...form, phone: value });
          }}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Create password"
          onChange={handleChange}
          required
        />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          onChange={handleChange}
          required
        />

        <button type="submit">Create Account</button>
      </form>

      <div className="divider">
        <span>OR</span>
      </div>

   <button className="google-btn" onClick={handleGoogle}>
  <FcGoogle size={20} />
  Continue with Google
</button>

      <div className="login-link">
        Already have an account? <span onClick={() => nav("/login")}>Login</span>
      </div>
    </div>
  </div>
);
}

export default Register;
