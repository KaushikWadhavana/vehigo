import { useState, useRef, useEffect } from "react";
import { auth } from "../../../firebase";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  FileText,
  Mail,
  Users,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  User,
  Search,
  LogOut,
  Crown ,
  Car,
  Star,
  CreditCard,
  ReceiptText,
  Settings,
  BarChart3,   // ✅ MUST be EXACTLY "Settings"
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

export default function AdminNavbar() {

  const [search, setSearch] = useState("");
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const searchRef = useRef(null);
const profileRef = useRef(null);
const [user, setUser] = useState(null);
const [profile, setProfile] = useState({});
const [enquiryCount, setEnquiryCount] = useState(0);

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard /> },

  { label: "Admin Vehicles", path: "/admin/vehicles", icon: <Car /> },

  { label: "Reservations", path: "/admin/reservations", icon: <ClipboardList /> },
  { label: "Quotations", path: "/admin/quotations", icon: <ReceiptText /> },
  { label: "Reservation Payments", path: "/admin/reservation-payments", icon: <CreditCard /> },
  { label: "User Bookings", path: "/admin/user-bookings", icon: <Users /> },

  { label: "Enquiries", path: "/admin/enquiries", icon: <Mail /> },

  { label: "Customers", path: "/admin/customers", icon: <Users /> },
  { label: "Reviews", path: "/admin/reviews", icon: <Star /> },

  { label: "Owner Requests", path: "/admin/owner-requests", icon: <Crown /> },
  { label: "Owner Vehicles", path: "/admin/owners", icon: <Users /> },
  { label: "Owner Payments", path: "/admin/owner-payments", icon: <CreditCard /> },

  { label: "Payments", path: "/admin/payments", icon: <CreditCard /> },

  { label: "Rentals", path: "/admin/rentals", icon: <BarChart3 /> },
  { label: "Reservation Analytics", path: "/admin/reservation-analytics", icon: <BarChart3 /> },

  { label: "Settings", path: "/admin/setting", icon: <Settings /> },
];

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!currentUser) return;

    setUser(currentUser);

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/${currentUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setProfile(data);

    } catch (err) {
      console.log("Navbar profile fetch error:", err);
    }
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const handleProfileUpdate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/profile/${currentUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setProfile(data);
const fetchEnquiryCount = async () => {
  if (!auth.currentUser) return;

  const token = await auth.currentUser.getIdToken();

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/enquiry/admin`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  // ✅ SAFE FIX (VERY IMPORTANT)
  const safeData = Array.isArray(data) ? data : [];

  const unread = safeData.filter(
    (e) => e.status === "Not Opened"
  ).length;

  setEnquiryCount(unread);
};

fetchEnquiryCount();
    } catch (err) {
      console.log("Profile refresh error:", err);
    }
  };

  window.addEventListener("profileUpdated", handleProfileUpdate);

  return () => {
    window.removeEventListener("profileUpdated", handleProfileUpdate);
  };
}, []);

  const navigate = useNavigate(); // ✅ added

  /* ===== STATES ===== */
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  /* ===== DARK MODE ===== */
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((p) => !p);
  };

  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);

  /* ===== DEVICE CHECK ===== */
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

useEffect(() => {
  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 768);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  const isDesktopOpen = isDesktop && (hovered || pinned);
  const menuOpen = isDesktopOpen || mobileOpen;

  /* ===== FORCE CLEAN MOBILE STATE ON FIRST LOAD ===== */
  useEffect(() => {
    if (!isDesktop) {
      setHovered(false);
      setPinned(false);
      setMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    const content = document.getElementById("admin-content");
    if (!content) return;

    const applyPadding = () => {
      if (window.innerWidth >= 768) {
        content.style.paddingLeft = isDesktopOpen ? "260px" : "80px";
      } else {
        content.style.paddingLeft = "0px";
      }
    };

    applyPadding();
    window.addEventListener("resize", applyPadding);
    return () => window.removeEventListener("resize", applyPadding);
  }, [isDesktopOpen]);
useEffect(() => {
  const handleClick = (e) => {

    // 🔍 close search
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSuggestions(false);
    }

    // 👤 close profile (TOP BAR)
    if (profileRef.current && !profileRef.current.contains(e.target)) {
      setProfileOpen(false);
    }

  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);
  /* ===== HOVER INTENT (DESKTOP ONLY) ===== */
  const handleMouseEnter = () => {
    if (!isDesktop || pinned) return;
    clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setHovered(true), 120);
  };

  const handleMouseLeave = () => {
    if (!isDesktop || pinned) return;
    clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 200);
  };

  /* ===== LOGOUT HANDLER (USED BOTH PLACES) ===== */
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  const randomAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${
  profile?.name || user?.email || "Admin"
}`;

const adminImage =
  profile?.profileImage ||
  user?.photoURL ||
  randomAvatar;

  return (
    <>
      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => {
            setMobileOpen(false);
            setHovered(false);
          }}
        />
      )}

      {/* ================= SIDEBAR ================= */}
<aside
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  style={{ scrollbarWidth: "none" }}
  className={`
    fixed top-0 left-0 h-screen z-50
    bg-white dark:bg-[#020617]
    transition-[width,transform]
    duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]

    overflow-y-auto overflow-x-hidden
    [scrollbar-width:none] [-ms-overflow-style:none]

    ${menuOpen ? "w-[260px]" : "w-[80px]"}
    ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
>
        {/* LOGO */}
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.png" className="h-9 shrink-0" />
            {menuOpen && (
              <span className="text-xl font-bold text-orange-500 whitespace-nowrap">
                Vehigo
              </span>
            )}
          </div>

          <button onClick={() => setPinned(!pinned)} className="hidden md:block">
            <Menu />
          </button>

          <button
            className="md:hidden"
            onClick={() => {
              setMobileOpen(false);
              setHovered(false);
            }}
          >
            <X />
          </button>
        </div>

        {/* SEARCH */}
        {menuOpen && (
          <div className="px-4 pb-4">
  <div className="relative" ref={searchRef}>
  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

  <input
    placeholder="Search menu..."
    value={search}
onChange={(e) => {
  const value = e.target.value;
  setSearch(value);

  if (!value.trim()) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  const filtered = menuItems
    .filter((item) =>
      item.label.toLowerCase().includes(value.toLowerCase())
    );

  setSuggestions(filtered);
  setShowSuggestions(true);
}}
    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl
    bg-white dark:bg-white/10
    border border-gray-200 dark:border-white/10"
  />

  {/* 🔥 SUGGESTIONS */}
{showSuggestions && (
  <div className="absolute mt-2 w-full bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">

    {suggestions.length > 0 ? (
      suggestions.map((s, i) => (
        <div
          key={i}
          onClick={() => {
            navigate(s.path);

            // ✅ CLOSE EVERYTHING
            setShowSuggestions(false);
            setSearch("");
          }}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer 
          hover:bg-gray-100 dark:hover:bg-white/10 transition"
        >
          {/* 🔥 ICON */}
          <div className="text-gray-500 dark:text-gray-300">
            {s.icon}
          </div>

          {/* 🔥 TEXT */}
          <span className="text-sm">{s.label}</span>
        </div>
      ))
    ) : (
      <div className="px-3 py-3 text-sm text-gray-400">
        No results found
      </div>
    )}
  </div>
)}
</div>
          </div>
        )}

        {/* MENU */}
        <nav className="mt-4 px-3 space-y-6 text-sm">
<Section title="MAIN" open={menuOpen}>
  <Item
    icon={<LayoutDashboard />}
    label="Dashboard"
    to="/admin"
    open={menuOpen}
  />

  <Item
    icon={<Car />}
    label="Admin Vehicles"
    to="/admin/vehicles"
    open={menuOpen}
  />
</Section>

<Section title="BOOKINGS" open={menuOpen}>
  <Item icon={<ClipboardList />} label="Reservations" to="/admin/reservations" open={menuOpen} />
  
  <Item icon={<FileText />} label="Quotations" to="/admin/quotations" open={menuOpen} />

  {/* 🔥 ADD THIS */}
  <Item icon={<CreditCard />} label="Reservation Payments" to="/admin/reservation-payments" open={menuOpen} />

  <Item icon={<Mail />} label="Enquiries" to="/admin/enquiries" open={menuOpen} badge={enquiryCount} />

  <Item icon={<Users />} label="User Bookings" to="/admin/user-bookings" open={menuOpen} />
</Section>
          {/* ================= USER TO OWNER ================= */}
<Section title="USER TO OWNER" open={menuOpen}>
  <Item
    icon={<Crown />}
    label="Owner Requests"
    to="/admin/owner-requests"
    open={menuOpen}
  />
  <Item
  icon={<Users />}
  label="Owner Vehicles"
  to="/admin/owners"
  open={menuOpen}
/>
<Item
  icon={<CreditCard />}
  label="Owner Payments"
  to="/admin/owner-payments"
  open={menuOpen}
/>
</Section>

          <Section title="MANAGE" open={menuOpen}>
            <Item icon={<Users />} label="Customers" to="/admin/customers" open={menuOpen} />
<Item
  icon={<Star />}
  label="Reviews"
  to="/admin/reviews"
  open={menuOpen}
/>
          </Section>
<Section title="FINANCE & ACCOUNTS" open={menuOpen}>

  <Item
    icon={<CreditCard />}
    label="Payments"
    to="/admin/payments"
    open={menuOpen}
  />
</Section>

<Section title="REPORT" open={menuOpen}>

  <Item
    icon={<BarChart3 />}
    label="Rentals"
    to="/admin/rentals"
    open={menuOpen}
  />
  <Item
  icon={<BarChart3 />}
  label="Reservation Analytics"
  to="/admin/reservation-analytics"
  open={menuOpen}
/>

</Section>

          <Section title="SETTINGS" open={menuOpen}>
            <Item icon={<Settings />} label="Settings" to="/admin/setting" open={menuOpen} />
          </Section>

          <Section title="HELP" open={menuOpen}>
          

            {/* ✅ SIDEBAR LOGOUT FIXED */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              <LogOut />
              {menuOpen && <span>Logout</span>}
            </button>
          </Section>
        </nav>
      </aside>

      {/* ================= TOPBAR ================= */}
      <header
        className={`
          fixed top-0 right-0 h-16 z-40
          bg-white dark:bg-[#020617]
          transition-all duration-300
          left-0
          ${isDesktopOpen ? "md:left-[260px]" : "md:left-[80px]"}
        `}
      >
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu />
            </button>

            {/* ✅ NOT REMOVED */}
<button
  onClick={() => navigate("/admin/reservations/new")}
  className="hidden md:block bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-medium"
>
  + New Reservation
</button>
</div>

          <div className="flex items-center gap-4 relative">
  

            {/* ===== PROFILE + DROPDOWN (ONLY ADDITION) ===== */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
  setProfileOpen((prev) => !prev);
  setShowSuggestions(false); // close search if open
}}
                className="flex items-center gap-2"
              >
 
 <img
  src={adminImage}
  onError={(e) => {
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=Fallback`;
  }}
  className="w-8 h-8 rounded-full object-cover"
  alt="admin"
/>

                <span className="hidden md:block">
{profile?.name || user?.displayName || "Admin User"}

                </span>
              </button>

             {profileOpen && (
  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#020617] rounded-xl shadow-lg overflow-hidden">
    
    <NavLink
      to="/admin"
      onClick={() => setProfileOpen(false)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      <LayoutDashboard size={18} />
      Dashboard
    </NavLink>

    {/* ✅ NEW SETTINGS */}
    <NavLink
      to="/admin/setting"
      onClick={() => setProfileOpen(false)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      <Settings size={18} />
      Settings
    </NavLink>

    <button
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      <LogOut size={18} />
      Logout
    </button>

  </div>
)}

            </div>
          </div>
        </div>
      </header>
    </>
  );
}

/* ===== HELPERS ===== */

function Section({ title, open, children }) {
  return (
    <div>
      {open && <p className="text-xs text-gray-400 mb-2 px-2">{title}</p>}
      {children}
    </div>
  );
}

function Item({ icon, label, to, open, badge }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin"} // ⭐ MAIN FIX
      className={({ isActive }) => `
        flex items-center justify-between px-3 py-3 rounded-lg
        ${
          isActive
            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
            : "text-gray-700 dark:text-gray-200"
        }
        hover:bg-gray-100 dark:hover:bg-white/10
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        {open && <span>{label}</span>}
      </div>

      {badge > 0 && open && (
        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
function IconButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center"
    >
      {children}
    </button>
  );
}
