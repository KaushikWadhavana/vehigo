import { useEffect,useState } from "react";
import { auth } from "../../firebase";
import { useParams,useNavigate } from "react-router-dom";
import { Search,ArrowLeft,Layers } from "lucide-react";

export default function AdminOwnerPendingVehicles(){

const { ownerId } = useParams();
const navigate = useNavigate();

const [vehicles,setVehicles] = useState([]);
const [search,setSearch] = useState("");

useEffect(()=>{
fetchVehicles();
},[]);

const fetchVehicles = async()=>{

const token = await auth.currentUser.getIdToken();

const res = await fetch(
`${import.meta.env.VITE_API_URL}/api/admin/owners/${ownerId}/pending-vehicles`,
{
headers:{Authorization:`Bearer ${token}`}
}
);

const data = await res.json();

setVehicles([...(data.vehicles||[]),...(data.bikes||[])]);

};

const getImageUrl = (img)=>{
if(!img) return "https://via.placeholder.com/600x400";
if(img.startsWith("http")) return img;
return `${import.meta.env.VITE_API_URL}/${img}`;
};

const filtered = vehicles.filter(v=>
v.name?.toLowerCase().includes(search.toLowerCase())
);

return(

<div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

<div className="max-w-7xl mx-auto px-8 py-12">

{/* BACK BUTTON */}

<button
onClick={()=>navigate(-1)}
className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white mb-8 transition"

>

<ArrowLeft size={18}/>
Back
</button>

{/* HEADER */}

<div className="mb-10 flex items-center justify-between">

<div>

<h1 className="text-4xl font-bold text-gray-900 dark:text-white">
Pending Vehicle Approvals
</h1>

<p className="text-gray-500 dark:text-gray-400 mt-2">
Vehicles submitted by this owner awaiting admin approval
</p>

</div>

<div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl px-6 py-4 shadow-md flex items-center gap-3">

<Layers className="text-orange-500"/>

<div>
<p className="text-xs text-gray-500 dark:text-gray-400">
Pending Vehicles
</p>

<p className="text-lg font-semibold text-orange-500">
{vehicles.length}
</p>
</div>

</div>

</div>

{/* SEARCH */}

<div className="relative mb-12">

<Search
className="absolute left-4 top-4 text-gray-400"
size={18}
/>

<input
placeholder="Search vehicle by name..."
className="pl-12 pr-4 py-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500 transition"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* VEHICLE GRID */}

<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">

{filtered.map(v=>(

<div
key={v._id}
onClick={()=>navigate(`/admin/owners/${ownerId}/review/${v._id}`)}
className="group bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
>

{/* IMAGE FRAME */}

<div className="relative p-4">

<div className="relative h-60 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">

<div className="absolute inset-0 p-2">

<div className="w-full h-full rounded-xl overflow-hidden">

<img
src={getImageUrl(v.imageUrl)}
onError={(e)=>{e.target.src="https://via.placeholder.com/600x400"}}
alt={v.name}
className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
/>

</div>

</div>

<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>

<div className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-4 py-1.5 rounded-full shadow">
Pending
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
<span className="font-medium text-gray-800 dark:text-gray-300">
Brand:
</span> {v.brand}
</p>

<p>
<span className="font-medium text-gray-800 dark:text-gray-300">
Model:
</span> {v.model}
</p>
<p className="text-xs text-gray-500 mt-1">
  Created:{" "}
  {v.createdAt
    ? new Date(v.createdAt).toLocaleString()
    : "N/A"}
</p>
</div>

{v.pricing?.dailyPrice &&(

<div className="mt-4 flex justify-between items-center">

<p className="text-orange-500 font-semibold text-lg">
₹{v.pricing.dailyPrice}
<span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
 / day
</span>
</p>

<span className="text-sm text-gray-400 group-hover:text-orange-500 transition">
Review →
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
