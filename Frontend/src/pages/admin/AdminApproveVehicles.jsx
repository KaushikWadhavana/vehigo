import { useEffect,useState } from "react";
import { auth } from "../../firebase";
import Swal from "sweetalert2";
import { Search } from "lucide-react";

export default function AdminApproveVehicles(){

const [vehicles,setVehicles]=useState([]);
const [search,setSearch]=useState("");

useEffect(()=>{
fetchVehicles();
},[]);

const fetchVehicles=async()=>{

const token=await auth.currentUser.getIdToken();

const res=await fetch(
`${import.meta.env.VITE_API_URL}/api/admin/vehicles/pending`,
{
headers:{Authorization:`Bearer ${token}`}
}
);

const data=await res.json();

setVehicles([...data.vehicles,...data.bikes]);
};

const approve=async(id)=>{

const confirm = await Swal.fire({
title:"Approve vehicle?",
icon:"question",
showCancelButton:true
});

if(!confirm.isConfirmed) return;

const token=await auth.currentUser.getIdToken();

await fetch(
`${import.meta.env.VITE_API_URL}/api/admin/vehicles/${id}/approve`,
{
method:"PUT",
headers:{Authorization:`Bearer ${token}`}
}
);

Swal.fire("Approved!","","success");

fetchVehicles();
};

const reject=async(id)=>{

const confirm = await Swal.fire({
title:"Reject vehicle?",
icon:"warning",
showCancelButton:true
});

if(!confirm.isConfirmed) return;

const token=await auth.currentUser.getIdToken();

await fetch(
`${import.meta.env.VITE_API_URL}/api/admin/vehicles/${id}/reject`,
{
method:"PUT",
headers:{Authorization:`Bearer ${token}`}
}
);

Swal.fire("Rejected!","","success");

fetchVehicles();
};

const filtered = vehicles.filter(v =>
v.name.toLowerCase().includes(search.toLowerCase())
);

return(

<div className="p-10 min-h-screen bg-gray-50 dark:bg-gray-950">

<h1 className="text-3xl font-bold mb-8 dark:text-white">
Approve Vehicles
</h1>

{/* SEARCH */}

<div className="relative mb-8">

<Search className="absolute left-4 top-4 text-gray-400"/>

<input
placeholder="Search vehicle"
className="pl-12 pr-4 py-4 w-full rounded-xl border bg-white dark:bg-gray-900 dark:text-white"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{filtered.length===0 &&(

<div className="text-center text-gray-500 py-20">
No pending vehicles
</div>

)}

<div className="grid md:grid-cols-3 gap-6">

{filtered.map(v=>(

<div
key={v._id}
className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 border dark:border-gray-800"
>

<img
src={v.imageUrl}
className="h-40 w-full object-cover rounded"
/>

<h2 className="mt-3 font-semibold dark:text-white">
{v.name}
</h2>

<p className="text-sm text-gray-500">
{v.brand} {v.model}
</p>

<div className="flex gap-3 mt-4">

<button
onClick={()=>approve(v._id)}
className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded"
>
Approve
</button>

<button
onClick={()=>reject(v._id)}
className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
>
Reject
</button>

</div>

</div>

))}

</div>

</div>
);
}