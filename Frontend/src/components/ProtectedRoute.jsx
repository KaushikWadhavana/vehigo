import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { syncUser } from "../api/authApi";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const userData = await syncUser(token);

        // ✅ ONLY NORMAL USER ALLOWED
        if (userData.role !== "user") {
          setStatus("unauthorized");
        } else {
          setStatus("authorized");
        }

      } catch (err) {
        console.error("Role fetch error", err);
        setStatus("unauthorized");
      }
    });

    return () => unsub();
  }, []);

  if (status === "loading") return null;

  if (status === "unauthenticated") return <Navigate to="/" />;

  if (status === "unauthorized") {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;