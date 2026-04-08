import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { checkUserExists } from "../api/authApi";

function AdminProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const { user } = await checkUserExists(token);

        
        if (user?.role === "admin") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Role check failed", err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return null;

  if (!auth.currentUser) return <Navigate to="/" />;

  if (!isAdmin) return <Navigate to="/" />;

  return children;
}

export default AdminProtectedRoute;
