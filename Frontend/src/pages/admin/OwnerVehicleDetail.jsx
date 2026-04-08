import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, Layers, Car, Bike } from "lucide-react";

export default function OwnerVehicleDetail() {
  const { ownerId } = useParams();
  const navigate = useNavigate();
const [pendingCount,setPendingCount] = useState(0);
  const [data, setData] = useState({ vehicles: [], bikes: [] });
  const [search, setSearch] = useState("");
useEffect(()=>{
fetchData();
fetchPendingCount();
},[]);

  const fetchPendingCount = async () => {

const token = await auth.currentUser.getIdToken();

const res = await fetch(
`${import.meta.env.VITE_API_URL}/api/admin/owners/${ownerId}/pending-vehicles`,
{
headers:{ Authorization:`Bearer ${token}` }
}
);

const data = await res.json();

const total = (data.vehicles?.length || 0) + (data.bikes?.length || 0);

setPendingCount(total);

};


  const fetchData = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/owners/${ownerId}/vehicles`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const result = await res.json();
    setData(result);
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/600x400";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

// 🔥 ORIGINAL DATA (STATIC)
const allVehicles = [...data.vehicles, ...data.bikes];

// 🔥 FILTERED DATA (FOR UI ONLY)
const filteredVehicles = allVehicles.filter((v) =>
  v.name?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      <div className="max-w-8xl mx-auto px-8 py-12">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white mb-8 transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>

{/* HEADER */}
<div className="mb-10 flex items-center justify-between">

  {/* LEFT TEXT */}
  <div>
    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
      Owner Vehicle Details
    </h1>

    <p className="text-gray-500 dark:text-gray-400 mt-2">
      Manage and monitor all vehicles registered by this owner
    </p>
  </div>

  {/* RIGHT BUTTON */}
  <button
    onClick={() => navigate(`/admin/owners/${ownerId}/pending`)}
    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl px-6 py-4 shadow-md flex items-center gap-3 hover:scale-[1.03] transition"
  >
    <div className="text-orange-500">
      <Layers />
    </div>

    <div className="text-left">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Approve Vehicles
      </p>

<p className="text-lg font-semibold text-orange-500">
{pendingCount}
</p>
    </div>
  </button>

</div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
   <StatCard icon={<Layers />} title="Total Vehicles" value={allVehicles.length} />
<StatCard icon={<Car />} title="Cars" value={data.vehicles.length} />
<StatCard icon={<Bike />} title="Bikes" value={data.bikes.length} />       
        </div>

        {/* SEARCH */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-4 text-gray-400" size={18} />
          <input
            placeholder="Search vehicle by name..."
            className="pl-12 pr-4 py-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

{/* VEHICLE GRID */}
<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
  {filteredVehicles.map((v) => (
    <div
      key={v._id}
      onClick={() =>
        navigate(`/admin/owners/${ownerId}/vehicle/${v._id}`)
      }
      className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >

      {/* IMAGE SECTION */}
      <div className="relative p-4">

        {/* Outer image frame */}
        <div className="relative h-60 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">

          {/* Inner wrapper div */}
          <div className="absolute inset-0 p-2">

            {/* Image container div */}
            <div className="w-full h-full rounded-xl overflow-hidden">
           <img
src={getImageUrl(v.imageUrl)}
onError={(e)=>{e.target.src="https://via.placeholder.com/600x400"}}
alt={v.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

          </div>

          {/* Soft overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

          {/* Floating Type Badge */}
          <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs px-4 py-1.5 rounded-full font-medium shadow">
            {v.type}
          </div>

        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="px-6 pb-6">

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {v.name}
        </h2>

        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium text-gray-800 dark:text-gray-300">
              Brand:
            </span>{" "}
            {v.brand}
          </p>

          <p>
            <span className="font-medium text-gray-800 dark:text-gray-300">
              Model:
            </span>{" "}
            {v.model}
          </p>
          <p className="text-xs text-gray-500 mt-1">
  Approved:{" "}
  {v.updatedAt
    ? new Date(v.updatedAt).toLocaleString()
    : "N/A"}
</p>
        </div>

        {v.pricing?.dailyPrice && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-orange-500 font-semibold text-lg">
              ₹{v.pricing.dailyPrice}
              <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                {" "} / day
              </span>
            </p>

            <span className="text-sm text-gray-400 group-hover:text-orange-500 transition">
              View →
            </span>
          </div>
        )}

      </div>

    </div>
  ))}
</div>

      </div>
    </div>
  );
}


/* STAT CARD COMPONENT */
function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border dark:border-gray-800 flex items-center gap-4">
      <div className="text-orange-500">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}