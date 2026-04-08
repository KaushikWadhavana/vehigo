import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Car, Bike, Eye, Plus, Search, Layers, ArrowUpDown } from "lucide-react";

export default function OwnerMyVehicles() {

  const [vehicles,setVehicles] = useState([]);
  const [search,setSearch] = useState("");
  const navigate = useNavigate();
const [filterType, setFilterType] = useState("all");
const [sortOrder, setSortOrder] = useState("new");
const [openSort, setOpenSort] = useState(false);
  useEffect(()=>{
    fetchVehicles();
  },[]);

  const fetchVehicles = async ()=>{

    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/owner/vehicles`,
      {
        headers:{ Authorization:`Bearer ${token}` }
      }
    );

    const data = await res.json();
    setVehicles(data);
  };

  const getImage = (img)=>{
    if(!img) return "https://placehold.co/600x400?text=No+Image";
    if(img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

const filtered = vehicles
  .filter(v => {
    const matchSearch = v.name?.toLowerCase().includes(search.toLowerCase());

    if (filterType === "car") {
      return matchSearch && v.type === "Vehicle";
    }

    if (filterType === "bike") {
      return matchSearch && v.type === "Bike";
    }

    return matchSearch;
  })
  .sort((a, b) => {
    const dateA = new Date(a.createdAt || a.approvedAt);
    const dateB = new Date(b.createdAt || b.approvedAt);

    return sortOrder === "new"
      ? dateB - dateA
      : dateA - dateB;
  });
  const cars = vehicles.filter(v=>v.type==="Vehicle");
  const bikes = vehicles.filter(v=>v.type==="Bike");

  return(

<div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">

{/* HEADER */}

<div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10">

<div>
<h1 className="text-3xl font-bold dark:text-white">
My Vehicles
</h1>

<p className="text-gray-500 dark:text-gray-400">
Manage vehicles you added
</p>
</div>

<button
onClick={()=>navigate("/owner/add")}
className="mt-4 md:mt-0 flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-xl hover:bg-orange-600"
>
<Plus size={18}/>
Add Vehicle
</button>

</div>

{/* STATS */}

<div className="grid md:grid-cols-3 gap-6 mb-10">

<StatCard 
  icon={<Layers/>} 
  title="Total Vehicles" 
  value={vehicles.length}
  active={filterType === "all"}
  onClick={() => setFilterType("all")}
/>

<StatCard 
  icon={<Car/>} 
  title="Cars" 
  value={cars.length}
  active={filterType === "car"}
  onClick={() => setFilterType("car")}
/>

<StatCard 
  icon={<Bike/>} 
  title="Bikes" 
  value={bikes.length}
  active={filterType === "bike"}
  onClick={() => setFilterType("bike")}
/>
</div>

{/* SEARCH */}

<div className="flex items-center gap-4 mb-12">

  {/* SEARCH */}
  <div className="relative flex-1">
    <Search className="absolute left-4 top-4 text-gray-400" size={18} />

    <input
      placeholder="Search vehicle..."
      className="pl-12 pr-4 py-4 w-full rounded-xl border border-gray-200
      dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white
      focus:ring-2 focus:ring-orange-500"
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
    />
  </div>

  {/* SORT DROPDOWN */}
  <div className="relative">

<button
  onClick={() => setOpenSort(!openSort)}
  className="flex items-center gap-2 px-4 py-3 rounded-xl border 
  bg-white dark:bg-gray-900 dark:text-white hover:shadow"
>
  <ArrowUpDown size={16}/>

  {sortOrder === "new" ? "Newest" : "Oldest"}
</button>

    {openSort && (
      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 
      border dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">

  <button
  onClick={() => {
    setSortOrder("new");
    setOpenSort(false);
  }}
  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
    sortOrder === "new" && "text-orange-500 font-semibold"
  }`}
>
  Newest
</button>

<button
  onClick={() => {
    setSortOrder("old");
    setOpenSort(false);
  }}
  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
    sortOrder === "old" && "text-orange-500 font-semibold"
  }`}
>
  Oldest
</button>
     </div>
    )}

  </div>

</div>
{/* VEHICLE GRID */}

<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">


{filtered.length === 0 ? (

  <div className="col-span-full text-center py-20">

    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
      {filterType === "car"
        ? "No Cars Available 🚗"
        : filterType === "bike"
        ? "No Bikes Available 🏍️"
        : "No Vehicles Available 🚫"}
    </h2>

    <p className="text-gray-500 mt-2">
      Try changing search or filters
    </p>

  </div>

) : (

  filtered.map(v=>(
<div
key={v._id}
className="group bg-white dark:bg-gray-900 border dark:border-gray-800
rounded-3xl overflow-hidden shadow hover:shadow-2xl transition"
>

<img
src={getImage(v.imageUrl)}
className="w-full h-52 object-cover group-hover:scale-105 transition"
/>

<div className="p-6">

<div className="flex items-center gap-2 mb-2">

{v.type==="Bike" ?
<Bike size={18} className="text-orange-500"/> :
<Car size={18} className="text-orange-500"/>
}

<h2 className="font-semibold text-lg dark:text-white">
{v.name}
</h2>

</div>

<p className="text-sm text-gray-500 mb-2">
{v.brand} • {v.model}
</p>

<p className="text-orange-500 font-semibold">
₹{v.pricing?.dailyPrice}/day
</p>

<p className="text-xs mt-2">

Status:
<span className={`ml-2 font-semibold ${
v.status==="approved"
? "text-green-500"
: v.status==="rejected"
? "text-red-500"
: "text-yellow-500"
}`}>
{v.status}
</span>

</p>
<p className="text-xs text-gray-500 mt-1">
  Approved:{" "}
  {v.createdAt
    ? new Date(v.createdAt).toLocaleString()
    : "N/A"}
</p>
<button
onClick={()=>navigate(`/owner/my-vehicles/${v._id}`)}
className="mt-5 w-full flex items-center justify-center gap-2
bg-gray-900 dark:bg-white text-white dark:text-black py-2 rounded-xl"
>
<Eye size={16}/>
View Details
</button>
<button
  onClick={async () => {
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
  className={`mt-3 w-full py-2 rounded-xl ${
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

);

}

function StatCard({ icon, title, value, onClick, active }) {

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white dark:bg-gray-900 p-6 rounded-2xl border 
      dark:border-gray-800 flex items-center gap-4 transition
      ${active 
        ? "ring-2 ring-orange-500 shadow-md scale-[1.02]" 
        : "hover:shadow-md"
      }`}
    >

      <div className="text-orange-500">{icon}</div>

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold dark:text-white">
          {value}
        </p>
      </div>

    </div>
  );
}