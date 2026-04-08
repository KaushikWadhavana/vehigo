import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { syncUser } from "../api/authApi";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import Footer from "../components/Footer";

function Home() {
  const navigate = useNavigate();

const handleEnterPlatform = async () => {
  const user = auth.currentUser;

  if (!user) {
    navigate("/login");
    return;
  }

  try {
    const token = await user.getIdToken();
    const userData = await syncUser(token);

    if (userData.role === "admin") {
      navigate("/admin");
    } else if (userData.role === "owner") {
      navigate("/owner");
    } else {
      navigate("/userhome");
    }

  } catch (err) {
    navigate("/login");
  }
};

  const handleDiscover = () => {
    navigate("/About");
  };

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const userData = await syncUser(token);

      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "owner") {
        navigate("/owner");
      } else {
        navigate("/userhome");
      }

    } catch (err) {
      console.error("Role check failed", err);
    }
  });

  return () => unsub();
}, [navigate]);
  return (
    <>
      <Navbar />

      <div className="neo-wrap">

        <div className="neo-grid"></div>

        <div className="neo-logo"></div>

        <div className="neo-center">
          <h1>VEHIGO</h1>

          <h2>
            Access.
            <span> Move.</span>
            <span> Repeat.</span>
          </h2>

          <p>
            Instant vehicle access, designed for speed,
            simplicity, and everyday use.
          </p>

          <div className="neo-actions">
            <button
              className="neo-primary"
              onClick={handleEnterPlatform}
            >
              Enter Platform
            </button>

            <button
              className="neo-secondary"
              onClick={handleDiscover}
            >
              Discover
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Home;
