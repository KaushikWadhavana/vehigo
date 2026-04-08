import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { auth } from "../../../firebase";
import Swal from "sweetalert2";

export default function AdminReservationInfo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [tab, setTab] = useState("info");

  
  const [toll, setToll] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/reservations/${id}`)
      .then(res => res.json())
      .then((resData) => {

  const isLocked =
    resData?.approvalStatus === "approved" &&
    resData?.payment?.status !== "Paid" &&
    resData?.payment?.method !== null &&
    resData?.status !== "completed";

  setData({
    ...resData,
    isLocked
  });
});
  }, [id]);

const handleAddToll = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(`http://localhost:5000/api/reservations/add-toll/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tollAmount: Number(toll)
      })
    });

    const dataRes = await res.json();

if (!res.ok) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: dataRes.message
  });
  return;
}

Swal.fire({
  icon: "success",
  title: "Success",
  text: "Toll added successfully"
});

    setData(dataRes);
    setToll("");

  } catch (err) {
    console.error(err);
  }
};

const handleMarkPaid = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `http://localhost:5000/api/reservations/mark-paid/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    const dataRes = await res.json();

if (!res.ok) {

  const msg = dataRes.message || "";

  // 🔥 SAME LOGIC AS USER RESERVATION
  if (
    msg.includes("already booked") ||
    msg.includes("already reserved") ||
    msg.includes("Vehicle")
  ) {

    Swal.fire("Too Late 😢", msg, "error");

    // 🔥 OPTIONAL: update UI status
    setData(prev => ({
      ...prev,
      approvalStatus: "rejected"
    }));

    return;
  }

  Swal.fire("Error", msg || "Something went wrong", "error");
  return;
}

    Swal.fire("Success", "Payment marked as Paid", "success");

    setData(dataRes);

  } catch (err) {
    console.error(err);
  }
};

  if (!data) return <div className="p-6">Loading...</div>;

  /* ================= HISTORY LOGIC ================= */
const history = [];

/* CREATED */
if (data.createdAt) {
  history.push({
    title: "Reservation created",
    date: data.createdAt
  });
}

/* APPROVED */
if (data.approvalStatus === "approved" && data.approvedAt) {
  history.push({
    title: "Updated: status changed to confirmed",
    date: data.approvedAt
  });
}

/* PAYMENT DONE */
/* PAYMENT DONE (ONLINE) */
if (data.payment?.method === "razorpay" && data.payment?.status === "Paid") {
  history.push({
    title: "Payment completed online",
    date: data.updatedAt
  });
}

/* PICKUP PAYMENT */
if (data.payment?.method === "pickup") {
  history.push({
    title: "Payment method: Pay at Pickup selected",
    date: data.createdAt
  });
}
/* CHECK-IN START */
if (data.status === "in_rental" || data.status === "completed") {
  history.push({
    title: "Check-in started",
    date: data.startDate
  });
}

/* CHECK-IN COMPLETED */
if (
  data.status === "completed" ||
  new Date(data.endDate) < new Date()
) {
  history.push({
    title: "Check in completed",
    date: data.endDate
  });
}

/* TOLL ADDED */
if ((data.tollAmount || data.pricing?.tollAmount || 0) > 0) {
  history.push({
    title: `Toll added (₹${data.tollAmount || data.pricing?.tollAmount})`,
    date: data.updatedAt
  });
}

/* SORT (OLD → NEW like your UI) */
history.sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3 text-gray-600">
        <ArrowLeft size={18} onClick={() => navigate(-1)} className="cursor-pointer" />
        <span className="text-lg font-medium">Reservation</span>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl shadow">

        {/* TOP */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h1 className="text-xl font-semibold">Reservation Details</h1>

          <span className="px-3 py-1 text-xs rounded-full bg-orange-100 text-orange-600">
            {data.approvalStatus}
          </span>
        </div>

        {/* TABS */}
        <div className="flex gap-3 px-6 py-4">
          <button
            onClick={() => setTab("info")}
            className={`px-4 py-2 rounded-lg text-sm ${
              tab === "info" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            Reservation Info
          </button>

          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-lg text-sm ${
              tab === "history" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            History
          </button>
        </div>

        <div className="p-6">

          {/* ================= INFO ================= */}
          {tab === "info" && (
            <div className="space-y-6">

              {/* VEHICLE */}
              <div className="flex justify-between border rounded-xl p-4">
                <div className="flex gap-3">
                  <img src={data.vehicle?.image} className="w-16 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm text-gray-500">{data.vehicle?.category}</p>
                    <p className="font-semibold">{data.vehicle?.brand} {data.vehicle?.model}</p>
                  </div>
                </div>
                <div className="text-right">
  <p className="text-sm text-gray-500">Total</p>
  <p className="font-semibold">₹{data.totalAmount ?? data.pricing?.total ?? 0}</p>

  <p className="text-xs text-gray-400 mt-1">
    Toll: ₹{data.tollAmount ?? data.pricing?.tollAmount ?? 0}
  </p>
</div>
              </div>

              {/* DATES */}
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p>{new Date(data.pickup.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">End Date</p>
                  <p>{new Date(data.drop.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Rental Period</p>
                  <p>{data.rentalDays} Days</p>
                </div>
                <div>
                  <p className="text-gray-500">Driving Type</p>
                  <p>{data.rentalType}</p>
                </div>
              </div>

              {/* LOCATIONS */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-100 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm">Pickup Location</p>
                  <p>{data.pickup.location}</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm">Return Location</p>
                  <p>{data.drop.location}</p>
                </div>
              </div>

              {/* CUSTOMER */}
              <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                <div>
                  <p className="font-medium mb-2">Customer</p>
                  <div className="flex gap-3">
                    <img
  src={
    data.customer?.image ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${data.customer?.name || "User"}`
  }
  className="w-10 h-10 rounded-full"
/>
                    <div>
                      <p>{data.customer.name}</p>
                      <p className="text-sm text-gray-500">{data.customer.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">Payment</p>
                  <p>
  {data.isLocked
    ? "Too Late"
    : `${data.payment?.method || "Not Selected"} (${data.payment?.status || "Pending"})`
  }
</p>
                </div>
              </div>

{/* PRICING */}
<div className="border-t pt-4 space-y-2 text-sm">

  {/* EXTRAS */}
  {(data.pricing?.extras || [])
  .filter(e => e.key !== "toll") // 🔥 REMOVE DEFAULT TOLL
  .map((e, i) => (
    <div key={i} className="flex justify-between">
      <span>{e.key}</span>
      <span>₹{e.price}</span>
    </div>
  ))}

  {/* TOLL */}
  <div className="flex justify-between">
    <span>Toll</span>
    <span>₹{data.tollAmount ?? data.pricing?.tollAmount ?? 0}</span>
  </div>

  {/* SECURITY */}
  <div className="flex justify-between">
    <span>Security Deposit</span>
    <span>₹{data.pricing.securityDeposit}</span>
  </div>

  {/* TOTAL */}
  <div className="flex justify-between font-semibold text-lg pt-2">
    <span>Total Price</span>
    <span>₹{data.totalAmount ?? data.pricing?.total ?? 0}</span>
  </div>

</div>

{/* ✅ ADD HERE */}
{data.payment?.method === "pickup" &&
 data.payment?.status !== "Paid" &&
 !data.isLocked && (
  <div className="border rounded-xl p-4 mt-4">
    <p className="text-sm font-semibold mb-2">
      Pickup Payment
    </p>

    <button
      onClick={handleMarkPaid}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
    >
      Mark as Paid
    </button>
  </div>
)}
{(
  (data.status === "completed" ||
  new Date(data.endDate) < new Date())
)&& !(data.tollAmount ?? data.pricing?.tollAmount) && (
  <div className="border rounded-xl p-4">
    <p className="text-sm font-semibold mb-2">Add Toll</p>

    <input
      type="number"
      value={toll}
      onChange={(e) => setToll(e.target.value)}
      placeholder="Enter toll amount"
      className="border px-3 py-2 rounded w-full"
    />

    <button
      onClick={handleAddToll}
      className="mt-3 w-full bg-black text-white py-2 rounded-lg"
    >
      Update Toll
    </button>
  </div>
)}
            </div>
          )}

          {/* ================= HISTORY ================= */}
          {tab === "history" && (
            <div className="space-y-4">

              {history.map((h, i) => {
                const d = new Date(h.date);

                return (
                  <div key={i} className="flex gap-4">

                    <div className="bg-gray-100 rounded-xl px-3 py-2 text-center">
                      <p className="font-semibold">{d.getDate()}</p>
                      <p className="text-xs text-gray-500">
                        {d.toLocaleString("default", { month: "short" })}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium">{h.title}</p>
                      <p className="text-xs text-gray-500">
                        {d.toLocaleTimeString()}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}