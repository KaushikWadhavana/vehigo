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
  Settings,
  Star,
  MessageCircle,
  CreditCard,
 
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export default function OwnerNavbar() {
  const [user, setUser] = useState(null);
const [profile, setProfile] = useState(null);
  const navigate = useNavigate(); // ✅ added

  /* ===== STATES ===== */
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
const profileRef = useRef(null);
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
  const isDesktop = window.innerWidth >= 768;
  const isDesktopOpen = isDesktop && (hovered || pinned);
  const menuOpen = isDesktopOpen || mobileOpen;
const [enquiryCount, setEnquiryCount] = useState(0);


const [search, setSearch] = useState("");
const [suggestions, setSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const searchRef = useRef(null);
const menuItems = [
  { label: "Dashboard", path: "/owner", icon: <LayoutDashboard /> },

  { label: "Vehicles", path: "/owner/my-vehicles", icon: <Users /> },
  { label: "Vehicle Approval", path: "/owner/vehicle-approval", icon: <FileText /> },
  { label: "Vehicle Reviews", path: "/owner/reviews", icon: <Star /> },

  { label: "Reservations", path: "/owner/reservations", icon: <ClipboardList /> },
  { label: "Quotations", path: "/owner/quotation", icon: <FileText /> },
  { label: "Reservation Payments", path: "/owner/reservation-payments", icon: <CreditCard /> }, // 🔥 ADD THIS

  { label: "Enquiries", path: "/owner/enquiries", icon: <MessageCircle /> },

  { label: "User Bookings", path: "/owner/user-bookings", icon: <Users /> },
  { label: "User Payments", path: "/owner/user-payments", icon: <CreditCard /> },

  { label: "Settings", path: "/owner/setting", icon: <Settings /> },
];
  /* ===== FORCE CLEAN MOBILE STATE ON FIRST LOAD ===== */
  useEffect(() => {
    if (!isDesktop) {
      setHovered(false);
      setPinned(false);
      setMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    const content = document.getElementById("owner-content");
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
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowSuggestions(false);
    }

    if (profileRef.current && !profileRef.current.contains(e.target)) {
      setProfileOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  useEffect(() => {
  const fetchProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `http://localhost:5000/api/profile/${auth.currentUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setProfile(data);
      setUser(auth.currentUser);

    } catch (err) {
      console.error("Navbar profile error", err);
    }
  };

  fetchProfile();
const fetchEnquiryCount = async () => {
  if (!auth.currentUser) return;

  const token = await auth.currentUser.getIdToken();

  const res = await fetch(
    "http://localhost:5000/api/enquiry/owner",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

const data = await res.json();

const safeData = Array.isArray(data) ? data : [];

const unread = safeData.filter(e => e.status === "Not Opened").length;

  setEnquiryCount(unread);
};

fetchEnquiryCount();
  // 🔥 Listen to profile update event
  const handleProfileUpdate = () => {
    fetchProfile();
  };

  window.addEventListener("profileUpdated", handleProfileUpdate);

  return () =>
    window.removeEventListener("profileUpdated", handleProfileUpdate);
}, []);

useEffect(() => {
  const handleClick = (e) => {
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
  profile?.name || user?.email || "Owner"
}`;

const navbarImage =
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

    overflow-y-auto overflow-x-hidden
    [scrollbar-width:none] [-ms-overflow-style:none]

    transition-[width,transform]
    duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]

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
   <div className="relative" ref={searchRef}>
  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

  <input
    placeholder="Search menu..."
    value={search}
  onChange={(e) => {
  const value = e.target.value;
  setSearch(value);

  const term = value.trim().toLowerCase();

  if (!term) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  const filtered = menuItems
    .map((item) => {
      const label = item.label.toLowerCase();

      if (label === term) return { ...item, score: 3 }; // exact
      if (label.startsWith(term)) return { ...item, score: 2 }; // start
      if (label.includes(term)) return { ...item, score: 1 }; // include

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // optional limit

  setSuggestions(filtered);
  setShowSuggestions(true);
}}
    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl
    bg-white dark:bg-white/10
    border border-gray-200 dark:border-white/10"
  />

  {/* 🔥 Suggestions */}
  {showSuggestions && (
    <div className="absolute mt-2 w-full bg-white dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">

      {suggestions.length > 0 ? (
        suggestions.map((s, i) => (
          <div
            key={i}
            onClick={() => {
              navigate(s.path);
              setShowSuggestions(false);
              setSearch("");
            }}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer 
            hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <div className="text-gray-500 dark:text-gray-300">
              {s.icon}
            </div>

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
        )}

        {/* MENU */}
        <nav className="mt-4 px-3 space-y-6 text-sm">
<Section title="MAIN" open={menuOpen}>
  <Item 
    icon={<LayoutDashboard />} 
    label="Dashboard" 
    to="/owner" 
    open={menuOpen} 
  />

  {/* ✅ SETTINGS ADDED HERE */}
  <Item 
    icon={<Settings />} 
    label="Settings" 
    to="/owner/setting" 
    open={menuOpen} 
  />
</Section>
<Section title="OWNER VEHICLE" open={menuOpen}>
  <Item
    icon={<Users />}
    label="Vehicles"
    to="/owner/my-vehicles"
    open={menuOpen}
  />
<Item
  icon={<FileText />}
  label="Vehicle Approval"
  to="/owner/vehicle-approval"
  open={menuOpen}
/>
<Item
  icon={<Star />}
  label="Vehicle Reviews"
  to="/owner/reviews"
  open={menuOpen}
/>
</Section>
          <Section title="BOOKINGS" open={menuOpen}>
            <Item icon={<ClipboardList />} label="Reservations" to="/owner/reservations" open={menuOpen} />
            <Item icon={<FileText />} label="Quotations" to="/owner/quotation" open={menuOpen} />
       <Item
    icon={<CreditCard />}
    label="Reservation Payments"
    to="/owner/reservation-payments"
    open={menuOpen}
  />       
<Item
  icon={<MessageCircle />}
  label="Enquiries"
  to="/owner/enquiries"
  open={menuOpen}
  badge={enquiryCount}
/>
          </Section>
<Section title="USER BOOKINGS" open={menuOpen}>
            <Item
  icon={<Users />}
  label="User Bookings"
  to="/owner/user-bookings"
  open={menuOpen}
/>
<Item
  icon={<CreditCard />}
  label="User Payments"
  to="/owner/user-payments"
  open={menuOpen}
/>
          </Section>


<Section title="MANAGE" open={menuOpen}>

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
  onClick={() => navigate("/owner/create")}
  className="hidden md:block bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-medium"
>
  + New Reservation
</button>
          </div>

          <div className="flex items-center gap-4 relative">
 

            {/* ===== PROFILE + DROPDOWN (ONLY ADDITION) ===== */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2"
              >
<img
  src={navbarImage}
  onError={(e) => {
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=Fallback`;
  }}
  className="w-8 h-8 rounded-full object-cover"
/>
                <span className="hidden md:block">
               {profile?.name || "Owner"}
                </span>
              </button>

{profileOpen && (
  <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#020617] rounded-xl shadow-lg overflow-hidden">

    <NavLink
      to="/owner"
      onClick={() => setProfileOpen(false)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      <LayoutDashboard size={18} />
      Dashboard
    </NavLink>

    <NavLink
      to="/owner/setting"
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
  end={to === "/owner"} // ⭐ FIX
      className={({ isActive }) => `
        flex items-center justify-between px-3 py-3 rounded-lg
        ${isActive
          ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500"
          : "text-gray-700 dark:text-gray-200"}
        hover:bg-gray-100 dark:hover:bg-white/10
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        {open && <span>{label}</span>}
      </div>

      {/* 🔴 BADGE */}
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
