import { Outlet } from "react-router-dom";
import OwnerNavbar from "./OwnerNavbar";

export default function OwnerLayout() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <OwnerNavbar />

      {/* MAIN CONTENT */}
      <main
        id="owner-content"   // ⚠️ IMPORTANT: keep same id (your navbar uses this)
        className="
          pt-20
          transition-all duration-300
          pl-0 md:pl-[80px]
          bg-gray-100 dark:bg-[#0b1220]
          min-h-screen
        "
      >
        <div className="px-6 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}