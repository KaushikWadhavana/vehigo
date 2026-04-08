import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";
import axios from "axios";

export default function OwnerProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  const unsub = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const token = await currentUser.getIdToken();

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/${currentUser.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.role === "owner") {
        setIsOwner(true);
      }
    } catch (err) {
      console.log("Owner role check failed");
    }

    setLoading(false);
  });

  return () => unsub();
}, []);

  if (loading) return <div className="p-10">Checking access...</div>;

  if (!isOwner) return <Navigate to="/userhome" />;

  return children;
}