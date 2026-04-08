import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FileText,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function AdminVehicleReviewDetail() {

  const { ownerId, vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/owners/${ownerId}/vehicle/${vehicleId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setVehicle(data);
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/600x400?text=No+Image";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

  const approveVehicle = async () => {

    const confirm = await Swal.fire({
      title: "Approve vehicle?",
      icon: "question",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/vehicles/${vehicleId}/approve`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    Swal.fire("Vehicle Approved", "", "success");
    navigate(-1);
  };


  const rejectVehicle = async () => {

  const { value: reason } = await Swal.fire({
    title: "Reject Vehicle",
    input: "textarea",
    inputLabel: "Enter rejection reason",
    inputPlaceholder: "Write reason here...",
    inputAttributes: {
      "aria-label": "Rejection reason"
    },
    showCancelButton: true,
    confirmButtonText: "Reject",
    confirmButtonColor: "#ef4444",

    // ✅ VALIDATION
    preConfirm: (value) => {
      if (!value || value.trim() === "") {
        Swal.showValidationMessage("Rejection reason is required");
      }
      return value;
    }
  });

  if (!reason) return;

  try {

    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/vehicles/${vehicleId}/reject`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      }
    );

    await Swal.fire({
      title: "Rejected!",
      text: "Vehicle has been rejected",
      icon: "success"
    });

    navigate(-1);

  } catch (err) {
    console.error(err);

    Swal.fire("Error", "Something went wrong", "error");
  }
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
  if (!vehicle)
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        Loading...
      </div>
    );

  return (

<div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-10 transition-colors">

<button
onClick={() => navigate(-1)}
className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-orange-500 mb-8"
>
<ArrowLeft size={18} />
Back to Vehicles
</button>

{/* TOP SECTION */}

<div className="grid lg:grid-cols-2 gap-10 mb-12">

<div className="rounded-3xl overflow-hidden shadow-lg">
<img
src={getImageUrl(vehicle.imageUrl)}
alt={vehicle.name}
className="w-full h-[420px] object-cover"
/>
</div>

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800">

<h1 className="text-3xl font-bold mb-4 dark:text-white">
{vehicle.name}
</h1>

<div className="flex gap-4 mb-6">

<button
onClick={approveVehicle}
className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl"
>
<CheckCircle size={18}/>
Approve
</button>

<button
onClick={rejectVehicle}
className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl"
>
<XCircle size={18}/>
Reject
</button>

</div>

<div className="grid grid-cols-2 gap-6 text-gray-600 dark:text-gray-300">

<div><strong>Brand:</strong> {vehicle.brand}</div>
<div><strong>Model:</strong> {vehicle.model}</div>

<div><strong>Year:</strong> {vehicle.year}</div>
<div><strong>Fuel:</strong> {vehicle.fuel}</div>

<div><strong>Category:</strong> {vehicle.category}</div>
<div><strong>Location:</strong> {vehicle.mainLocation}</div>

<div><strong>Plate:</strong> {vehicle.plateNumber}</div>
<div><strong>Mileage:</strong> {vehicle.mileage}</div>

</div>

{vehicle.pricing && (
<div className="mt-8">

<h2 className="text-xl font-semibold mb-4 dark:text-white">
Pricing
</h2>

<div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">
<div>Daily: ₹{vehicle.pricing.dailyPrice}</div>
<div>Weekly: ₹{vehicle.pricing.weeklyPrice}</div>
<div>Monthly: ₹{vehicle.pricing.monthlyPrice}</div>
<div>Yearly: ₹{vehicle.pricing.yearlyPrice}</div>
<div>Base KM: ₹{vehicle.pricing.baseKm}</div>
<div>Extra KM: ₹{vehicle.pricing.extraKmPrice}</div>
</div>

</div>
)}

</div>

</div>

{/* FEATURES */}

{vehicle.features?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

<h2 className="text-2xl font-semibold mb-6 dark:text-white">
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
<h2 className="text-2xl font-semibold dark:text-white">
Damage Reports
</h2>
</div>

{vehicle.damages.map((d,i)=>(
<div key={i} className="mb-4 border-b pb-3">
<p className="font-semibold dark:text-white">
{d.location} - {d.type}
</p>
<p className="text-gray-500">
{d.description}
</p>
</div>
))}

</div>

)}

{/* DOCUMENTS */}

{vehicle.documents?.length > 0 && (

<div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800">

<div className="flex items-center gap-3 mb-6">
<FileText className="text-green-500"/>
<h2 className="text-2xl font-semibold dark:text-white">
Documents
</h2>
</div>

<div className="grid gap-4">

{vehicle.documents.map((doc,i)=>(

<div
  key={i}
  className="bg-gray-100 dark:bg-gray-800 px-6 py-5 rounded-2xl flex items-center justify-between"
>

  {/* LEFT */}
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
    className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium"
  >
    View
  </button>

</div>
))}

</div>
</div>

)}

</div>

  );
}