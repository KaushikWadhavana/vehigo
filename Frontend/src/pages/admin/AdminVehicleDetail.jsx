import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

export default function AdminVehicleDetail() {

const { vehicleId } = useParams();
const navigate = useNavigate();

const [vehicle,setVehicle] = useState(null);
const [editMode, setEditMode] = useState(false);
const [form, setForm] = useState({
  mileage: "",
  pricing: {},
});
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (vehicle) {
    setForm({
      mileage: vehicle.mileage || "",
      pricing: vehicle.pricing || {},
    });
  }
}, [vehicle]);
const handleSave = async () => {
  try {
    setLoading(true);

    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/vehicles/${vehicleId}/update-basic`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      }
    );

    setEditMode(false);
    fetchVehicle();

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
useEffect(()=>{
 fetchVehicle();
},[]);

const fetchVehicle = async () => {

 const token = await auth.currentUser.getIdToken();

 const res = await fetch(
 `${import.meta.env.VITE_API_URL}/api/admin/vehicle/${vehicleId}`,
 {
 headers:{ Authorization:`Bearer ${token}` }
 });

 const data = await res.json();
 setVehicle(data);
};

const getImageUrl = (img)=>{
 if(!img) return "https://via.placeholder.com/600x400";
 if(img.startsWith("http")) return img;
 return `${import.meta.env.VITE_API_URL}/${img}`;
};
const openDoc = (url) => {
  Swal.fire({
    title: "Document",
    html: `
      <iframe 
        src="https://docs.google.com/gview?url=${url}&embedded=true" 
        style="width:100%; height:500px; border-radius:10px;"
      ></iframe>
    `,
    width: 800,
    showCloseButton: true,
    showConfirmButton: false,
  });
};


if(!vehicle)

  
 return(

<div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
 Loading...
 </div>
 );

return(

<div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-10">

<div className="flex justify-between items-center mb-8">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
  >
    <ArrowLeft size={18} />
    Back
  </button>

  <button
    onClick={() => setEditMode(!editMode)}
    className="bg-orange-500 text-white px-5 py-2 rounded-xl"
  >
    {editMode ? "Cancel" : "Edit"}
  </button>
</div>

{/* TOP SECTION */}

<div className="grid lg:grid-cols-2 gap-10 mb-12">

{/* IMAGE */}

<div className="rounded-3xl overflow-hidden shadow-lg">
<img
src={getImageUrl(vehicle.imageUrl)}
alt={vehicle.name}
className="w-full h-[420px] object-cover"
/>
</div>

{/* BASIC INFO */}

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800">

<h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
{vehicle.name}
</h1>

<div className="grid grid-cols-2 gap-6 text-gray-600 dark:text-gray-300">

<div><strong>Brand:</strong> {vehicle.brand}</div>
<div><strong>Model:</strong> {vehicle.model}</div>

<div><strong>Year:</strong> {vehicle.year}</div>
<div><strong>Fuel:</strong> {vehicle.fuel}</div>

<div><strong>Category:</strong> {vehicle.category}</div>
<div><strong>Location:</strong> {vehicle.mainLocation}</div>

<div><strong>Plate:</strong> {vehicle.plateNumber}</div>
<div>
  <strong>Mileage:</strong>
  {editMode ? (
    <input
      value={form.mileage}
      onChange={(e) =>
        setForm({ ...form, mileage: e.target.value })
      }
      className="border px-2 py-1 rounded ml-2"
    />
  ) : (
    vehicle.mileage
  )}
</div>

{vehicle.transmission && (
<div><strong>Transmission:</strong> {vehicle.transmission}</div>
)}

{vehicle.passengers && (
<div><strong>Passengers:</strong> {vehicle.passengers}</div>
)}

</div>

{/* PRICING */}

{vehicle.pricing && (

<div className="mt-8">

<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
Pricing
</h2>

<div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">

<div>
  Daily:
  {editMode ? (
    <input
      value={form.pricing?.dailyPrice || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            dailyPrice: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.dailyPrice}`
  )}
</div>
<div>Weekly: {editMode ? (
    <input
      value={form.pricing?.weeklyPrice || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            weeklyPrice: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.weeklyPrice}`
  )}</div>
<div>Monthly: {editMode ? (
    <input
      value={form.pricing?.monthlyPrice || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            monthlyPrice: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.monthlyPrice}`
  )}</div>

<div>Yearly: {editMode ? (
    <input
      value={form.pricing?.yearlyPrice || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            yearlyPrice: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.yearlyPrice}`
  )}</div>

<div>Base KM: {editMode ? (
    <input
      value={form.pricing?.baseKm || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            baseKm: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.baseKm}`
  )}</div>
<div>Extra KM: {editMode ? (
    <input
      value={form.pricing?.extraKmPrice || ""}
      onChange={(e) =>
        setForm({
          ...form,
          pricing: {
            ...form.pricing,
            extraKmPrice: Number(e.target.value),
          },
        })
      }
      className="border ml-2 px-2 py-1 rounded"
    />
  ) : (
    `₹${vehicle.pricing.extraKmPrice}`
  )}</div>

</div>

</div>

)}

</div>

</div>

{/* EXTRA SERVICES */}

{vehicle.extras?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

<h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
Extra Services
</h2>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

{vehicle.extras.map((e, i) => (

<div
  key={i}
  className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800"
>
  <h4 className="font-semibold text-gray-800 dark:text-white">
    {e.title}
  </h4>

  <p className="text-sm text-gray-500 mt-1">
    {e.type === "per_day" && "Per Day"}
    {e.type === "one_time" && "One Time"}
    {e.type === "dynamic" && "Dynamic (Owner will update)"}
  </p>

  <p className="mt-2 font-medium text-orange-500">
    {e.type === "dynamic" ? "₹ Dynamic" : `₹${e.price}`}
  </p>
</div>

))}

</div>

</div>

)}
{/* FEATURES */}

{vehicle.features?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

<h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
Features
</h2>

<div className="flex flex-wrap gap-3">

{vehicle.features.map((f,i)=>(
<span
key={i}
className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-600 rounded-full text-sm"
>
{f}
</span>
))}

</div>

</div>

)}

{/* DAMAGES */}

{vehicle.damages?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

<div className="flex items-center gap-3 mb-6">
<AlertTriangle className="text-red-500"/>
<h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
Damage Reports
</h2>
</div>

{vehicle.damages.map((d,i)=>(
<div key={i} className="mb-4 border-b dark:border-gray-700 pb-3">
<p className="font-semibold">{d.location} - {d.type}</p>
<p className="text-gray-500">{d.description}</p>
</div>
))}

</div>

)}

{/* FAQ */}

{vehicle.faqs?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

<div className="flex items-center gap-3 mb-6">
<HelpCircle className="text-blue-500"/>
<h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
FAQ
</h2>
</div>

{vehicle.faqs.map((f,i)=>(
<div key={i} className="mb-4">
<p className="font-semibold">{f.question}</p>
<p className="text-gray-500">{f.answer}</p>
</div>
))}

</div>

)}

{/* DOCUMENTS */}

{vehicle.documents?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800">

<div className="flex items-center gap-3 mb-6">
<FileText className="text-green-500"/>
<h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
Documents
</h2>
</div>

<div className="grid gap-4">

{vehicle.documents.map((doc,i)=>(

<div
  key={i}
  className="bg-gray-100 dark:bg-gray-800 px-6 py-5 rounded-2xl flex items-center justify-between"
>

  {/* LEFT SIDE */}
  <div className="flex items-center gap-4">

    <FileText className="text-gray-400" size={22} />

    <div>
      <p className="font-semibold text-gray-800 dark:text-white text-base">
        {doc.name}
      </p>
      <p className="text-sm text-gray-500">
        Click to view document
      </p>
    </div>

  </div>

  {/* RIGHT BUTTON */}
  <button
    onClick={() => openDoc(doc.url)}
    className="bg-black text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90"
  >
    View
  </button>

</div>

))}
</div>

</div>

)}
{editMode && (
  <div className="mt-10 text-center">
    <button
      onClick={handleSave}
      className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl"
    >
      {loading ? "Saving..." : "Save Changes"}
    </button>
  </div>
)}
</div>

);
}