import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function BookingDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
const [reasonModal, setReasonModal] = useState({
  open: false,
  text: "",
});
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      "http://localhost:5000/api/bookings/owner-bookings",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    const booking = data.find(x => x._id === id);

    setB(booking);

    setForm({
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      paymentMethod: booking.paymentFull?.method,
      paymentStatus: booking.paymentFull?.status,
      status: booking.status,
      tollAmount: booking.tollAmount || 0,
      driver: booking.driver || {},
      billing: booking.billing || {}
    });
  };

  /* ================= EDIT CHECK ================= */
const handleEdit = () => {
  const status = getStatus();

  if (status === "Cancelled" || status === "Rejected") {
    return Swal.fire("Error", "This booking cannot be edited", "error");
  }

  setEdit(true);
};
  /* ================= SAVE ================= */
const save = async () => {
  const status = getStatus();

  if (status === "Cancelled" || status === "Rejected") {
    return Swal.fire("Error", "Cannot update this booking", "error");
  }

  const token = await auth.currentUser.getIdToken();

  const res = await fetch(
    `http://localhost:5000/api/bookings/owner-update/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    }
  );

  const d = await res.json();

  if (!res.ok) return Swal.fire("Error", d.message, "error");

  Swal.fire("Success", "Booking updated", "success");
  setEdit(false);
  load();
};
const getStatus = () => {
  if (!b) return "Unknown";

  if (b.status === "Cancelled") return "Cancelled";
  if (b.status === "Rejected") return "Rejected";

  const now = new Date();
  const pickup = new Date(b.pickupDate);
  const drop = new Date(b.returnDate);

  if (now < pickup) return "Upcoming";
  if (now >= pickup && now <= drop) return "In Progress";
  return "Completed";
};
  if (!b) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
<div className="flex items-center mb-4">

  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 bg-white shadow px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
  >
    ← Back
  </button>

</div>

      {/* MAIN GRID */}
<div className="grid lg:grid-cols-3 gap-6">

  {/* LEFT SIDE */}
  <div className="lg:col-span-2 space-y-6">

    {/* 🔥 IMAGE CARD (LIKE YOUR SCREENSHOT) */}
    <div className="bg-white rounded-3xl shadow-md p-3">

      <div className="relative rounded-2xl overflow-hidden h-[240px] md:h-[280px]">

        <img
          src={b.vehicleImage}
        className="w-full h-full object-contain bg-gray-100"
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* TEXT */}
        <div className="absolute bottom-4 left-5 text-white">
          <h1 className="text-xl font-bold">{b.vehicleName}</h1>
          <p className="text-sm opacity-80">
            Booking #{b.bookingId}
          </p>
        </div>

        {/* ✅ STATUS BADGE (ADD HERE) */}
   <span
  className={`absolute top-3 left-3 px-3 py-1 text-xs rounded-full shadow ${
    getStatus() === "Completed"
      ? "bg-green-100 text-green-600"
      : getStatus() === "Cancelled"
      ? "bg-red-100 text-red-600"
      : getStatus() === "Rejected"
      ? "bg-red-200 text-red-700"
      : getStatus() === "Upcoming"
      ? "bg-blue-100 text-blue-600"
      : "bg-yellow-100 text-yellow-600"
  }`}
>
  {getStatus()}
</span>
{b.status === "Rejected" && b.rejectReason && (
  <button
    onClick={() =>
      setReasonModal({
        open: true,
        text: b.rejectReason,
      })
    }
    className="absolute bottom-3 right-3 bg-red-100 text-red-700 text-xs px-3 py-1 rounded-lg shadow hover:bg-red-200"
  >
    View Reason
  </button>
)}
        {/* EDIT BUTTON */}
<button
  onClick={edit ? save : handleEdit}
className={`absolute top-3 right-3 px-4 py-1 rounded-xl text-sm shadow ${
  ["Cancelled", "Rejected"].includes(getStatus())
    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
    : "bg-white/90"
}`}
>
  {edit ? "Save" : "Edit"}
</button>
      </div>
    </div>

    {/* ALL YOUR EXISTING SECTIONS BELOW */}

    <Section title="🚗 Vehicle Info">
      <Row label="Type" value={b.listingType}/>
      <Row label="Name" value={b.vehicleName}/>
      <Row label="Location" value={b.location}/>
    </Section>

    <Section title="📅 Booking Details">
      <EditRow label="Pickup" edit={edit && getStatus() === "Upcoming"}
        value={form.pickupLocation}
        onChange={v=>setForm({...form,pickupLocation:v})}/>

      <EditRow label="Return" edit={edit}
        value={form.returnLocation}
        onChange={v=>setForm({...form,returnLocation:v})}/>

      <Row label="Pickup Time" value={format(b.pickupDate)}/>
      <Row label="Return Time" value={format(b.returnDate)}/>
      <Row label="Plan" value={b.planType}/>
      <Row label="Delivery" value={b.deliveryType}/>
    </Section>

    <Section title="🧑 Driver">
      <EditRow label="Mobile" edit={edit}
        value={form.driver?.mobile}
        onChange={v=>setForm({...form,driver:{...form.driver,mobile:v}})}
      />
      <Row label="Age" value={b.driver?.age}/>
      <Row label="License" value={b.driver?.licenseNumber}/>
      
    </Section>
{b.driver?.photo && (
  <Section title="📄 Driver Document">

    <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl">

      <div>
        <p className="font-semibold">Driving License</p>
        <p className="text-sm text-gray-500">
          Click to view document
        </p>
      </div>

      <button
        onClick={() => openDoc(b.driver.photo)}
        className="bg-black text-white px-4 py-2 rounded-lg text-sm"
      >
        View
      </button>

    </div>

  </Section>
)}
    <Section title="➕ Extras">
      {b.extras?.length > 0 ? (
        b.extras.map((e,i)=>(
          <Row
  key={i}
  label={e.title}
  value={
    e.key === "toll"
      ? (b.tollAmount ? `₹ ${b.tollAmount}` : "Pending")
      : `₹ ${e.price}`
  }
/>
        ))
      ) : (
        <p className="text-gray-400 text-sm">No extras</p>
      )}
    </Section>
    {edit && getStatus() === "Completed" && b.extras?.some(e => e.key === "toll") && (
  <div className="mt-3">
    <p className="text-sm text-gray-500">Toll Amount</p>
    <input
      type="number"
      value={form.tollAmount || ""}
      onChange={(e) =>
        setForm({ ...form, tollAmount: e.target.value })
      }
      className="border rounded-lg px-3 py-2 w-full mt-1"
    />
  </div>
)}

    <Section title="📄 Billing">
      <EditRow label="Name" edit={edit}
        value={form.billing?.name}
        onChange={v=>setForm({...form,billing:{...form.billing,name:v}})}
      />
      <EditRow label="Email" edit={edit}
        value={form.billing?.email}
        onChange={v=>setForm({...form,billing:{...form.billing,email:v}})}
      />
      <EditRow label="Phone" edit={edit}
        value={form.billing?.phone}
        onChange={v=>setForm({...form,billing:{...form.billing,phone:v}})}
      />

      <Row label="City" value={b.billing?.city}/>
      <Row label="State" value={b.billing?.state}/>
      <Row label="Country" value={b.billing?.country}/>
    </Section>

  </div>

  {/* RIGHT SIDE */}
  <div className="space-y-6">

    {/* PAYMENT CARD */}
    <div className="bg-white rounded-3xl shadow-md p-6">

      <h2 className="font-semibold mb-4">💳 Payment</h2>

      <Row label="Method" value={b.paymentFull?.method} />
<Select
  edit={
    edit &&
    b.paymentFull?.method === "pickup" &&
    b.paymentFull?.status !== "Paid"
  }
  label="Payment Status"
  value={form.paymentStatus}
  options={["Pending","Paid"]}
  onChange={v=>setForm({...form,paymentStatus:v})}
/>
      <div className="mt-4 border-t pt-4 space-y-2">
        <Row label="Base" value={`₹ ${b.basePrice}`}/>
        <Row label="Tax" value={`₹ ${b.taxAmount}`}/>
        <Row label="Delivery" value={`₹ ${b.deliveryCharge}`}/>
        <Row label="Deposit" value={`₹ ${b.refundableDeposit}`}/>
{/* ================= EXTRA SERVICES ================= */}
{b.extras?.length > 0 && (
  <>
    <div className="border-t pt-3 mt-3">
      <p className="font-semibold text-sm mb-2 text-gray-700">
        Extra Services
      </p>

      {b.extras.map((e, i) => (
        <div key={i} className="flex justify-between text-sm text-gray-600">

          <span>{e.title}</span>

          <span>
            {e.key === "toll"
              ? b.tollAmount > 0
                ? `₹ ${b.tollAmount}`
                : "Pending"
              : `₹ ${e.price}`}
          </span>

        </div>
      ))}
    </div>
  </>
)}
        <div className="flex justify-between font-bold text-lg mt-2">
          <span>Total</span>
          <span>₹ {b.totalAmount}</span>
        </div>
      </div>

    </div>

  </div>

</div>

{reasonModal.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">

    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={() => setReasonModal({ open: false, text: "" })}
    />

    {/* MODAL */}
    <div
      className="relative bg-white w-[90%] max-w-md rounded-3xl shadow-2xl p-6"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
          ⚠️
        </div>

        <h2 className="text-lg font-semibold text-gray-800">
          Rejection Reason
        </h2>
      </div>

      <div className="bg-gray-50 border rounded-xl p-4 max-h-[200px] overflow-y-auto text-sm text-gray-700">
        {reasonModal.text}
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={() => setReasonModal({ open: false, text: "" })}
          className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}

/* ================= UI ================= */

const Section = ({ title, children }) => (
  <div className="bg-white rounded-3xl shadow-lg p-6">
    <h2 className="font-semibold mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const Input = ({ label, value, edit, onChange, type="text" }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    {edit ? (
      <input
        type={type}
        value={value || ""}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 mt-1"
      />
    ) : (
      <p className="font-medium">{value || "-"}</p>
    )}
  </div>
);

const Select = ({ label, value, options, edit, onChange }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    {edit ? (
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2 mt-1"
      >
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    ) : (
      <p className="font-medium">{value}</p>
    )}
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-right">{value || "-"}</span>
  </div>
);

const EditRow = ({ label, value, edit, onChange }) => (
  <div className="flex justify-between items-center py-1 gap-4">
    <span className="text-gray-500">{label}</span>

    {edit ? (
      <input
        value={value || ""}
        onChange={(e)=>onChange(e.target.value)}
        className="border rounded-lg px-2 py-1 text-sm w-40 text-right"
      />
    ) : (
      <span className="font-medium text-right">{value || "-"}</span>
    )}
  </div>
);

const format = (date) => {
  if (!date) return "-";

  const d = new Date(date);

  return `${d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const openDoc = (url) => {
  Swal.fire({
    title: "Driver Document",
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