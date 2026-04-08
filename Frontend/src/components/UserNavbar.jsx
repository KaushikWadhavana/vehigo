import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import {
  Bell,
  User,
  Menu,
  X,
  Home,
  Car,
  CalendarCheck,
  CalendarClock,
  LayoutDashboard,
  Settings,
  ChevronDown,
  MessageCircle,
  Star,
  CreditCard,
  LogOut
} from "lucide-react";

export default function UserNavbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const [bookingOpen, setBookingOpen] = useState(false);
const bookingRef = useRef(null);

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

  const location = useLocation();

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
    });
    return () => unsub();
  }, []);

  /* ================= FETCH PROFILE FROM DB ================= */
useEffect(() => {
  if (!firebaseUser) return;

  const fetchProfile = async () => {
    try {
      const token = await firebaseUser.getIdToken();

      const res = await axios.get(
        `http://localhost:5000/api/profile/${firebaseUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(res.data);

    } catch (err) {
      console.error(
        "Profile fetch error:",
        err.response?.data || err.message
      );
    }
  };

  fetchProfile();

  const handleProfileUpdate = () => {
    fetchProfile();
  };

  window.addEventListener("profileUpdated", handleProfileUpdate);

  return () => {
    window.removeEventListener("profileUpdated", handleProfileUpdate);
  };

}, [firebaseUser]);

/* ================= CLOSE DROPDOWN OUTSIDE ================= */
useEffect(() => {
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setProfileOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (bookingRef.current && !bookingRef.current.contains(event.target)) {
      setBookingOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

const randomAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${
  profile?.name || firebaseUser?.email || "User"
}`;

const displayImage =
  profile?.profileImage ||
  firebaseUser?.photoURL ||
  randomAvatar;

const displayName = profile?.name || firebaseUser?.displayName || "User";

  return (
    <>
      {/* ================= NAVBAR ================= */}
<nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
  <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-2 font-semibold">
            <button className="md:hidden" onClick={() => setDrawerOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>

            <img src="/logo.png" className="h-8" alt="Vehigo" />
            <span className="font-bold text-xl">Vehigo</span>
          </div>

          {/* CENTER */}

<div className="hidden md:flex items-center gap-3 bg-gray-100/70 backdrop-blur rounded-full p-1">

  <NavItem
    to="/"
    label="Home"
    icon={<Home size={16} />}
    active={location.pathname === "/"}
  />

  <NavItem
    to="/listing"
    label="Listings"
    icon={<Car size={16} />}
    active={location.pathname === "/listing"}
  />

<div className="relative" ref={bookingRef}>

<button
  onClick={() => setBookingOpen(!bookingOpen)}
  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
location.pathname.startsWith("/bookings") ||
location.pathname.startsWith("/reservations") ||   // ✅ ADD
location.pathname.startsWith("/enquiries") ||
location.pathname.startsWith("/reviews") ||
location.pathname.startsWith("/user-payments")
      ? "bg-white shadow text-orange-500"
      : "text-gray-600 hover:bg-white hover:shadow"
  }`}
>

{location.pathname.startsWith("/reviews")
  ? <Star size={16} />
  : location.pathname.startsWith("/enquiries")
  ? <MessageCircle size={16} />
  : location.pathname.startsWith("/user-payments")
  ? <CreditCard size={16} />
  : location.pathname.startsWith("/reservations")
  ? <CalendarClock  size={16} />   // ✅ SAME ICON OR CHANGE IF YOU WANT
  : <CalendarCheck size={16} />}
  {/* ✅ DYNAMIC TEXT */}
{location.pathname.startsWith("/reviews")
  ? "Reviews"
  : location.pathname.startsWith("/enquiries")
  ? "Enquiries"
  : location.pathname.startsWith("/user-payments")
  ? "Payments"
  : location.pathname.startsWith("/reservations")
  ? "Reservations"
  : "Bookings"}
  <ChevronDown
    size={14}
    className={`transition-transform ${
      bookingOpen ? "rotate-180" : ""
    }`}
  />
</button>
  {bookingOpen && (
<div className="absolute top-12 left-0 w-52 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">

  <Link
    to="/bookings"
    onClick={() => setBookingOpen(false)}
    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
  >
    <CalendarCheck size={16} className="text-gray-500" />
    My Bookings
  </Link>

  <Link
    to="/enquiries"
    onClick={() => setBookingOpen(false)}
    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
  >
    <MessageCircle size={16} className="text-gray-500" />
    Enquiries
  </Link>
  <Link
  to="/reviews"
  onClick={() => setBookingOpen(false)}
  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
>
  <Star size={16} className="text-gray-500" />
  Reviews
</Link>

  <Link
  to="/user-payments"
  onClick={() => setBookingOpen(false)}
  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
>
  <CreditCard size={16} className="text-gray-500" />
  Payments
</Link>
<Link
  to="/reservations"
  onClick={() => setBookingOpen(false)}
  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
>
  <CalendarClock  size={16} className="text-gray-500" />
  Reservations
</Link>
</div>
  )}
</div>

</div>
          {/* RIGHT */}
          <div className="flex items-center gap-5">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-2 py-1 rounded-full hover:bg-gray-100 transition"
              >
<img
  src={displayImage}
  onError={(e) => {
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=Fallback`;
  }}
  className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-400 hover:ring-orange-500 transition"
  alt="profile"
/>

                <span className="hidden md:block font-medium">
                  {displayName}
                </span>
              </button>

              {profileOpen && (
<div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

  {/* USER INFO */}
  <div className="px-4 py-3 border-b bg-gray-50">
    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
    <p className="text-xs text-gray-500 truncate">
      {firebaseUser?.email}
    </p>
  </div>

  <Link
    to="/userhome"
    onClick={() => setProfileOpen(false)}
    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
  >
    <LayoutDashboard size={16}/>
    Dashboard
  </Link>

  <Link
    to="/renter/setting"
    onClick={() => setProfileOpen(false)}
    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
  >
    <Settings size={16}/>
    Settings
  </Link>

  <button
    onClick={handleLogout}
    className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full"
  >
    <LogOut size={16}/>
    Logout
  </button>

</div>
              )}
            </div>
          </div>
        </div>
        
      </nav>

      {/* ================= MOBILE DRAWER ================= */}
      <div className={`fixed inset-0 z-50 ${drawerOpen ? "visible" : "invisible"}`}>

        <div
          className={`absolute inset-0 bg-black/50 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />

        <div
          className={`absolute left-0 top-0 h-full w-80
          bg-gradient-to-b from-[#0f172a] to-[#020617]
          text-white transition-transform duration-300
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="h-7" alt="Vehigo" />
              <span className="font-bold text-lg">Vehigo</span>
            </div>
            <button onClick={() => setDrawerOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

<nav className="mt-2 flex flex-col">

  <DrawerBtn icon={<LayoutDashboard />} label="Dashboard" onClick={() => {
    navigate("/");
    setDrawerOpen(false);

  }} />

  <DrawerBtn icon={<Car />} label="Listings" onClick={() => {navigate("/listing");
    setDrawerOpen(false);
  }} />

  <DrawerBtn icon={<CalendarCheck />} label="My Bookings" onClick={() => {navigate("/bookings"); 
    setDrawerOpen(false);
  }} />

  {/* ✅ NEW: Enquiries */}
<DrawerBtn
  icon={<MessageCircle />}
  label="Enquiries"
  onClick={() => {
    navigate("/enquiries");
    setDrawerOpen(false);
  }}
/>
  {/* ✅ NEW: Reviews */}
  <DrawerBtn icon={<Star />} label="Reviews" onClick={() =>{
    navigate("/reviews");
    setDrawerOpen(false);
  }} />
<DrawerBtn
  icon={<CreditCard />}
  label="Payments"
  onClick={() => {
    navigate("/user-payments");
    setDrawerOpen(false);
  }}
/>
<DrawerBtn
  icon={<CalendarCheck />}
  label="Reservations"
  onClick={() => {
    navigate("/reservations");
    setDrawerOpen(false);
  }}
/>
  <DrawerBtn icon={<Settings />} label="Settings" onClick={() => {navigate("/renter/setting");
    setDrawerOpen(false);
  }} />

            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}

function DrawerBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={() => {
        onClick();
        document.body.click(); // optional trigger
      }}
      className="flex items-center gap-4 px-6 py-4 border-b border-white/10 hover:bg-white/5"
    >
      <span className="text-gray-300">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function NavItem({ to, label, icon, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-white shadow text-orange-500"
          : "text-gray-600 hover:bg-white hover:shadow"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}