import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {

  sendEmailVerification,
  
} from "firebase/auth";
import Swal from "sweetalert2";
import { auth } from "../firebase";
import { googleLogin } from "../auth/googleAuth";

import { FcGoogle } from "react-icons/fc";
import "../styles/Auth.css";
import {
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  linkWithCredential,
} from "firebase/auth";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let email = identifier;

      // 📱 Phone number login support
      if (/^[0-9]{10}$/.test(identifier)) {
        const phoneRes = await fetch("http://localhost:5000/api/auth/find-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: identifier }),
});

if (!phoneRes.ok) {
  Swal.fire({
    icon: "error",
    title: "Phone Not Found",
    text: "Phone number not registered",
  });
  setLoading(false);
  return;
}

const phoneData = await phoneRes.json();
email = phoneData.email;

        if (!email) {
          alert("Phone number not registered");
          setLoading(false);
          return;
        }
      }

      const res = await signInWithEmailAndPassword(auth, email, password);

      // ✉️ Email verification check (except Google)
 await res.user.reload();

if (
  !res.user.emailVerified &&
  res.user.providerData[0]?.providerId !== "google.com"
) {
  Swal.fire({
  icon: "warning",
  title: "Email Not Verified",
  text: "Please verify your email before logging in.",
});
  navigate("/verify");
  setLoading(false);
  return;
}

      // 🔐 Sync user with backend & get role
const token = await auth.currentUser.getIdToken(true);
    const syncRes = await fetch("http://localhost:5000/api/auth/sync", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

if (!syncRes.ok) {
  throw new Error("Backend sync failed");
}

const syncData = await syncRes.json();
const user = syncData.user;

      // 🛡️ Role-based redirect
if (user.role === "admin") {
  navigate("/admin");
} else if (user.role === "owner") {
  navigate("/owner");
} else {
  navigate("/userhome");
}
    } catch (err) {
      console.error("Login error:", err);
      Swal.fire({
  icon: "error",
  title: "Login Failed",
  text: "Invalid credentials or user not found",
});
    } finally {
      setLoading(false);
    }
  };


const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();

  try {
    // Try normal Google login
    const result = await signInWithPopup(auth, provider);

    const token = await result.user.getIdToken();
    const checkRes = await fetch("http://localhost:5000/api/auth/check-user", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const checkData = await checkRes.json();
const exists = checkData.exists;
const user = checkData.user;

    if (!exists) {
      await auth.signOut();
      Swal.fire({
  icon: "info",
  title: "Not Registered",
  text: "Account not registered. Please register first.",
});
      navigate("/register");
      return;
    }

if (user.role === "admin") {
  navigate("/admin");
} else if (user.role === "owner") {
  navigate("/owner");
} else {
  navigate("/userhome");
}
  } catch (error) {
    // 🔥 THIS IS IMPORTANT PART
    if (error.code === "auth/account-exists-with-different-credential") {

      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);

      // Check existing sign-in methods
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.includes("password")) {

        const password = prompt(
          "Account already exists with Email/Password.\nEnter your password to link Google:"
        );

        if (!password) return;

        // Login with email/password
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Link Google to same account
        await linkWithCredential(userCredential.user, credential);

        Swal.fire({
  icon: "success",
  title: "Linked Successfully",
  text: "Google account linked successfully!",
});

        const token = await userCredential.user.getIdToken();
        const checkRes = await fetch("http://localhost:5000/api/auth/check-user", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const checkData = await checkRes.json();
const user = checkData.user;

        navigate(user.role === "admin" ? "/admin" : "/userhome");
      }
    } else {
      console.error(error);
      alert("Google login failed.");
    }
  }
};
  return (
    <div className="register-container">
      <button className="back-home" onClick={() => navigate("/")}>
        ← Back to Home
      </button>

      <div className="register-box">
        <div className="brand">
          <img src="/logo.png" alt="Vehigo Logo" className="brand-logo" />
          <h2>Experience Vehigo</h2>
          <p>Where every journey feels premium</p>
        </div>

        <form className="register-form" onSubmit={handleLogin}>
          <input
            placeholder="Email or Phone"
            value={identifier}
            onChange={(e) =>
              setIdentifier(e.target.value.replace(/\s/g, ""))
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <FcGoogle size={20} />
          Continue with Google
        </button>

        <div className="login-link">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </div>
      </div>
    </div>
  );
}

export default Login;