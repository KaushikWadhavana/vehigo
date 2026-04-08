import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Search, Layers, Car, Bike } from "lucide-react";

export default function AdminVehicles() {
const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  const [data,setData] = useState({
    vehicles:[],
    bikes:[]
  });

  const [search,setSearch] = useState("");

  useEffect(()=>{
    fetchVehicles();
  },[]);

  const fetchVehicles = async () => {

    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/vehicles`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const result = await res.json();
    
    setData({
  vehicles: result?.vehicles || [],
  bikes: result?.bikes || []
});
  };

  const getImageUrl = (img)=>{
    if(!img) return "https://via.placeholder.com/600x400";
    if(img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

const combined = [
  ...(data?.vehicles || []),
  ...(data?.bikes || [])
];

const filteredVehicles = combined
  .filter(v => {
    const matchSearch = v.name?.toLowerCase().includes(search.toLowerCase());

    if (filterType === "car") {
      return matchSearch && v.type === "Vehicle";
    }

    if (filterType === "bike") {
      return matchSearch && v.type === "Bike";
    }

    return matchSearch;
  });
   return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* HEADER */}
        <div className="mb-10">

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Admin Vehicle Management
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Monitor all vehicles registered on the platform
          </p>

        </div>

        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-6 mb-10">

<StatCard
  icon={<Layers />}
  title="Total Vehicles"
  value={combined.length}
  active={filterType === "all"}
  onClick={() => setFilterType("all")}
/>
<StatCard
  icon={<Car />}
  title="Cars"
  value={data.vehicles.length}
  active={filterType === "car"}
  onClick={() => setFilterType("car")}
/>

<StatCard
  icon={<Bike />}
  title="Bikes"
  value={data.bikes.length}
  active={filterType === "bike"}
  onClick={() => setFilterType("bike")}
/>
        </div>

        {/* SEARCH */}

        <div className="relative mb-12">

          <Search className="absolute left-4 top-4 text-gray-400" size={18}/>

          <input
            placeholder="Search vehicle..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="pl-12 pr-4 py-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500"
          />

        </div>

        {/* VEHICLE GRID */}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
{filteredVehicles.length === 0 ? (

  <div className="col-span-full text-center py-20">
    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
      {filterType === "car"
        ? "No Cars Available 🚗"
        : filterType === "bike"
        ? "No Bikes Available 🏍️"
        : "No Vehicles Available 🚫"}
    </h2>

    <p className="text-gray-500 mt-2">
      Try changing filters or search
    </p>
  </div>

) : (

  filteredVehicles.map(v => (
<div
  key={v._id}
  className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
>

              {/* IMAGE */}

              <div className="relative p-4">

                <div className="relative h-60 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">

                  <img
                    src={getImageUrl(v.imageUrl)}
                    onError={(e)=>{e.target.src="https://via.placeholder.com/600x400"}}
                    alt={v.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>

                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 text-xs px-4 py-1 rounded-full">
                    {v.type}
                  </div>

                </div>

              </div>

              {/* CONTENT */}

              <div className="px-6 pb-6">

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {v.name}
                </h2>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">

                  <p>
                    <span className="font-medium">Brand:</span> {v.brand}
                  </p>

                  <p>
                    <span className="font-medium">Model:</span> {v.model}
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
                      <span className="text-sm text-gray-500">
                        / day
                      </span>
                    </p>

             <button
  onClick={() => navigate(`/admin/vehicle/${v._id}`)}
  className="text-sm text-orange-500 hover:underline"
>
  View →
</button>

                  </div>

                )}
{/* STATUS */}
<p className="text-xs mt-2">
  Status:
  <span className={`ml-2 font-semibold ${
    v.status === "approved"
      ? "text-green-500"
      : v.status === "rejected"
      ? "text-red-500"
      : "text-yellow-500"
  }`}>
    {v.status}
  </span>
</p>

<p className="text-xs">
  Active:
  <span className={`ml-2 font-semibold ${
    v.isActive ? "text-green-500" : "text-red-500"
  }`}>
    {v.isActive ? "Active" : "Inactive"}
  </span>
</p>

{/* TOGGLE BUTTON */}
<button
  onClick={async (e) => {
    e.stopPropagation(); // 🔥 IMPORTANT

    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/vehicles/${v._id}/toggle-active`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    fetchVehicles();
  }}
  className={`mt-4 w-full py-2 rounded-xl text-sm ${
    v.isActive
      ? "bg-red-500 text-white"
      : "bg-green-500 text-white"
  }`}
>
  {v.isActive ? "Deactivate" : "Activate"}
</button>
              </div>

            </div>
     ))
)}
        </div>

      </div>

    </div>
  );
}

function StatCard({ icon, title, value, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md border dark:border-gray-800 flex items-center gap-4 transition ${
        active
          ? "ring-2 ring-orange-500 scale-[1.02]"
          : "hover:shadow-md"
      }`}
    >
      <div className="text-orange-500">{icon}</div>

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}