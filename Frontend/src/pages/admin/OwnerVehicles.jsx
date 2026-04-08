import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Search, Users, ChevronRight } from "lucide-react";
import { ArrowLeft } from "lucide-react";
export default function OwnerVehicles() {
  const [owners, setOwners] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

useEffect(() => {
  fetchOwners();

  const interval = setInterval(() => {
    fetchOwners();
  }, 5000);

  return () => clearInterval(interval);
}, []);

  const fetchOwners = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/owners`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    setOwners(data);
  };

  const filtered = owners.filter((o) =>
    o.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.email?.toLowerCase().includes(search.toLowerCase())
  );


return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black transition-colors p-6">
<button
  onClick={() => navigate("/admin")}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-500 transition"
>
  <ArrowLeft size={16} />
  Back to Dashboard
</button>
    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Owner Vehicles
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and monitor all registered vehicle owners
        </p>
      </div>

      {/* STATS CARD */}
      <div className="mt-4 md:mt-0 bg-white dark:bg-gray-900 shadow-md dark:shadow-none px-6 py-3 rounded-2xl flex items-center gap-3 border dark:border-gray-800 transition">
        <Users className="text-orange-500" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Owners
          </p>
          <p className="font-bold text-lg text-gray-800 dark:text-white">
            {owners.length}
          </p>
        </div>
      </div>
    </div>

    {/* SEARCH BAR */}
    <div className="relative mb-8">
      <Search
        className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500"
        size={18}
      />
      <input
        placeholder="Search owner by name or email..."
        className="pl-10 pr-4 py-3 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* OWNER LIST */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((owner) => (
        <div
          key={owner._id}
          onClick={() => navigate(`/admin/owners/${owner._id}`)}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-none p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-orange-400 group"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg text-gray-800 dark:text-white group-hover:text-orange-500 transition">
                {owner.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {owner.email}
              </p>
            </div>

            <ChevronRight className="text-gray-400 group-hover:text-orange-500 transition" />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Click to manage vehicles
            </span>
            <span className="text-orange-500 font-medium group-hover:translate-x-1 transition">
              View →
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* EMPTY STATE */}
    {filtered.length === 0 && (
      <div className="text-center mt-16 text-gray-400 dark:text-gray-500">
        <Users size={50} className="mx-auto mb-4 opacity-40" />
        <p>No owners found.</p>
      </div>
    )}
  </div>
);
}