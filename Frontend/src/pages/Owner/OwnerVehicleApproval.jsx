import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Car,
  Plus,
  ArrowLeft
} from "lucide-react";

import { useNavigate } from "react-router-dom";
export default function OwnerVehicleApproval() {

  const [vehicles,setVehicles] = useState([]);
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("approved");
const [selectedVehicle, setSelectedVehicle] = useState(null);
const [showPopup, setShowPopup] = useState(false);
const navigate = useNavigate();
  
useEffect(()=>{
    fetchVehicles();
  },[]);

  const fetchVehicles = async () => {

    try{

      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/owner/vehicle-status`,
        {
          headers:{ Authorization:`Bearer ${token}` }
        }
      );

      const data = await res.json();
      setVehicles(data);

    }catch(err){
      console.error(err);
    }

  };

  const getImageUrl = (img) => {
    if(!img) return "https://placehold.co/600x400?text=Vehicle";
    if(img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

  const approved = vehicles.filter(v=>v.status==="approved").length;
  const pending = vehicles.filter(v=>v.status==="pending").length;
  const rejected = vehicles.filter(v=>v.status==="rejected").length;

  const filtered = vehicles
  .filter(v => v.status === filter)
  .filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase())
  );

const handleVehicleClick = (vehicle) => {
  setSelectedVehicle(vehicle);
  setShowPopup(true);
};

  return (

<div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">

{/* HEADER */}
<div className="mb-10 flex flex-col gap-6">

{/* BACK BUTTON */}

<button
onClick={()=>navigate("/owner")}
className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition"
>
<ArrowLeft size={18}/>
Back to Dashboard
</button>

{/* HEADER + ADD VEHICLE */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between">

<div>

<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
Vehicle Approval Status
</h1>

<p className="text-gray-500 dark:text-gray-400 mt-2">
Track approval status of your submitted vehicles
</p>

</div>

<button
onClick={()=>navigate("/owner/add")}
className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-xl hover:bg-orange-600 mt-4 md:mt-0"
>
<Plus size={18}/>
Add Vehicle
</button>

</div>

</div>

{/* STATS */}

<div className="grid md:grid-cols-3 gap-6 mb-10">

<StatCard
title="Approved"
value={approved}
icon={<CheckCircle className="text-green-500"/>}
active={filter==="approved"}
onClick={()=>setFilter("approved")}
/>

<StatCard
title="Pending"
value={pending}
icon={<Clock className="text-yellow-500"/>}
active={filter==="pending"}
onClick={()=>setFilter("pending")}
/>

<StatCard
title="Rejected"
value={rejected}
icon={<XCircle className="text-red-500"/>}
active={filter==="rejected"}
onClick={()=>setFilter("rejected")}
/>

</div>

{/* SEARCH */}

<div className="relative mb-10">

<Search className="absolute left-4 top-4 text-gray-400" size={18}/>

<input
placeholder="Search vehicle by name..."
className="pl-12 pr-4 py-4 w-full rounded-xl border border-gray-200
dark:border-gray-700 bg-white dark:bg-gray-900
dark:text-white focus:ring-2 focus:ring-orange-500"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* VEHICLE GRID */}

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

{filtered.map(v=>(

<div
  key={v._id}
  onClick={() => handleVehicleClick(v)}
  className="group cursor-pointer bg-white dark:bg-gray-900 border dark:border-gray-800
  rounded-3xl overflow-hidden shadow hover:shadow-xl transition"
>
{/* IMAGE */}

<img
src={getImageUrl(v.imageUrl)}
className="w-full h-48 object-cover group-hover:scale-105 transition"
/>

{/* CONTENT */}

<div className="p-6">

<div className="flex items-center gap-2 mb-2">

<Car size={18} className="text-orange-500"/>

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
: v.status==="pending"
? "text-yellow-500"
: "text-red-500"
}`}>

{v.status}

</span>
<p className="text-xs text-gray-500 mt-1">
  Approved:{" "}
  {v.updatedAt
    ? new Date(v.updatedAt).toLocaleString()
    : "N/A"}
</p>
</p>

</div>

</div>

))}

</div>

{/* EMPTY STATE */}

{filtered.length === 0 && (

<div className="text-center mt-20 text-gray-400">

<Car size={50} className="mx-auto mb-4 opacity-40"/>

<p>No vehicles found</p>

</div>

)}
{showPopup && selectedVehicle && (

<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  onClick={() => setShowPopup(false)} // click outside close
>

  <div
    className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-[90%] max-w-lg shadow-2xl relative"
    onClick={(e) => e.stopPropagation()} // prevent close inside click
  >

    {/* CLOSE BUTTON */}
    <button
      onClick={() => setShowPopup(false)}
      className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
    >
      ✕
    </button>

    {/* TITLE */}
    <h2 className="text-2xl font-bold mb-4 dark:text-white">
      {selectedVehicle.name}
    </h2>

    {/* STATUS */}
    <p className="mb-4 text-sm">
      Status:
      <span className={`ml-2 font-semibold ${
        selectedVehicle.status === "approved"
          ? "text-green-500"
          : selectedVehicle.status === "pending"
          ? "text-yellow-500"
          : "text-red-500"
      }`}>
        {selectedVehicle.status}
      </span>
    </p>

    {/* CONDITIONAL CONTENT */}

    {selectedVehicle.status === "rejected" && (
      <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl">
        <p className="text-red-600 font-medium">Rejection Reason:</p>
        <p className="mt-2 text-sm text-red-500">
          {selectedVehicle.rejectionReason || "No reason provided"}
        </p>
      </div>
    )}

    {selectedVehicle.status === "approved" && (
      <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl">
        <p className="text-green-600 font-medium">
          ✅ Your vehicle is approved
        </p>
      </div>
    )}

    {selectedVehicle.status === "pending" && (
      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl">
        <p className="text-yellow-600 font-medium">
          ⏳ Vehicle is under review
        </p>
      </div>
    )}

    {/* ACTION BUTTON */}
    <button
      onClick={() => setShowPopup(false)}
      className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800"
    >
      Close
    </button>

  </div>

</div>

)}
</div>

  );

}

/* STAT CARD */

function StatCard({title,value,icon,onClick,active}){

return(

<div
onClick={onClick}
className={`cursor-pointer p-6 rounded-2xl flex items-center gap-4
border transition
${active
? "bg-orange-50 dark:bg-orange-900/20 border-orange-400"
: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
}`}
>

<div>{icon}</div>

<div>
<p className="text-sm text-gray-500">{title}</p>
<p className="text-2xl font-bold dark:text-white">{value}</p>
</div>

</div>

);

}