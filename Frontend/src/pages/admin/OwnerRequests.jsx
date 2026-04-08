import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import {
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ArrowLeft
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
const [activeFilter, setActiveFilter] = useState("all");

const [openMenuId, setOpenMenuId] = useState(null);

  /* ================= WAIT FOR AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      fetchRequests();
    }
  }, [firebaseUser]);

useEffect(() => {
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  window.addEventListener("click", handleClickOutside);

  return () => window.removeEventListener("click", handleClickOutside);
}, []);

  /* ================= FETCH ================= */
  const fetchRequests = async () => {
    try {
      setLoading(true);

      const token = await firebaseUser.getIdToken();

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/owner/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load requests", "error");
      setLoading(false);
    }
  };

  /* ================= APPROVE / REJECT ================= */
const handleAction = async (id, status) => {
  let reason = "";

  if (status === "rejected") {
    const result = await Swal.fire({
      title: "Reject Reason",
      input: "textarea",
      inputPlaceholder: "Enter reason for rejection...",
      inputAttributes: {
        maxlength: 200,
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed || !result.value) {
      return Swal.fire("Error", "Reason is required", "error");
    }

    reason = result.value;
  } else {
    const confirm = await Swal.fire({
      title: `Confirm ${status}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
    });

    if (!confirm.isConfirmed) return;
  }

  try {
    const token = await firebaseUser.getIdToken();

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/owner/status/${id}`,
      { status, reason }, // ✅ SEND REASON
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Swal.fire("Updated Successfully", "", "success");
    fetchRequests();

  } catch (err) {
    Swal.fire("Error", "Action failed", "error");
  }
};

  /* ================= STATS ================= */
  const total = requests.length;
  const pending = requests.filter(r => r.status === "pending").length;
  const approved = requests.filter(r => r.status === "approved").length;
  const rejected = requests.filter(r => r.status === "rejected").length;

  const paid = requests.filter(r => r.payment?.status === "success").length;

const paymentPending = requests.filter(
  r => r.status === "approved" && r.payment?.status !== "success"
).length;

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading Owner Requests...
      </div>
    );
  }
const filteredRequests = requests.filter((r) => {
  if (activeFilter === "all") return true;
  if (activeFilter === "pending") return r.status === "pending";
  if (activeFilter === "approved") return r.status === "approved";
  if (activeFilter === "rejected") return r.status === "rejected";
  if (activeFilter === "paid") return r.payment?.status === "success";
  if (activeFilter === "paymentPending")
    return r.status === "approved" && r.payment?.status !== "success";

  return true;
});
  return (
    
<div className="p-6 md:p-10 space-y-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">

{/* ================= HEADER ================= */}
<div className="flex flex-col gap-6">

  {/* BACK BUTTON */}
  <button
    onClick={() => window.location.href = "/admin"}
    className="flex items-center gap-2 text-gray-500 dark:text-gray-300 hover:text-orange-500 transition w-fit"
  >
    <ArrowLeft size={18} />
    Back to Dashboard
  </button>

  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="flex items-center gap-3">
      <Crown className="text-orange-500" size={28} />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Owner Access Requests
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Review and manage owner applications
        </p>
      </div>
    </div>
  </div>

</div>

      {/* ================= RESPONSIVE STATS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        <StatCard title="Total" value={total} active={activeFilter==="all"} onClick={()=>setActiveFilter("all")} />
<StatCard title="Pending" value={pending} color="yellow" active={activeFilter==="pending"} onClick={()=>setActiveFilter("pending")} />
<StatCard title="Approved" value={approved} color="green" active={activeFilter==="approved"} onClick={()=>setActiveFilter("approved")} />
<StatCard title="Rejected" value={rejected} color="red" active={activeFilter==="rejected"} onClick={()=>setActiveFilter("rejected")} />
<StatCard title="Paid" value={paid} color="green" active={activeFilter==="paid"} onClick={()=>setActiveFilter("paid")} />
<StatCard title="Payment Pending" value={paymentPending} color="yellow" active={activeFilter==="paymentPending"} onClick={()=>setActiveFilter("paymentPending")} />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border dark:border-gray-800 overflow-hidden transition">

        {requests.length === 0 ? (
          <div className="p-10 text-center text-gray-400 dark:text-gray-500">
            No owner requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs md:text-sm transition">
                <tr>
                  <th className="p-4 text-left min-w-[230px]">User</th>
                  <th className="text-left min-w-[230px]">Owner Email</th>
                  <th className="text-left min-w-[130px]">Date</th>
<th className="text-left min-w-[130px]">Status</th>
<th className="text-left min-w-[130px]">Payment</th>
<th className="text-center ">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map(req => (
                  <tr
                    key={req._id}
                    className="border-t dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="p-4">
                      <p className="font-semibold">{req.name}</p>
                      <p className="text-gray-500 text-xs md:text-sm">
                        {req.currentEmail}
                      </p>
                    </td>

                    <td className="font-medium">
                      {req.requestedEmail}
                    </td>

                    <td>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <StatusBadge status={req.status} />
                    </td>
<td>
  {req.payment?.status === "success" ? (
    <span className="text-green-600 font-medium">Paid</span>
  ) : req.status === "approved" ? (
    <span className="text-yellow-600">Pending</span>
  ) : (
    "-"
  )}
</td>
<td className="text-center relative">
  <div className="relative inline-block text-left">

    {/* 3 DOT BUTTON ALWAYS */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === req._id ? null : req._id);
      }}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      ⋮
    </button>

    {/* DROPDOWN */}
    {openMenuId === req._id && (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 shadow-lg rounded-xl border dark:border-gray-700 z-50"
      >

        {/* 🔥 PENDING */}
        {req.status === "pending" && (
          <>
            <button
              onClick={() => handleAction(req._id, "approved")}
              className="w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-xl"
            >
              Approve
            </button>

            <button
              onClick={() => handleAction(req._id, "rejected")}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
            >
              Reject
            </button>
          </>
        )}

        {/* 🔥 APPROVED */}
        {req.status === "approved" && (
          <div className="px-4 py-2 text-green-600 font-medium">
            ✅ Already Approved
          </div>
        )}

        {/* 🔥 REJECTED */}
        {req.status === "rejected" && (
          <div className="px-4 py-2 text-red-600 font-medium">
            ❌ Already Rejected
          </div>
        )}

      </div>
    )}
  </div>
</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */
function StatCard({ title, value, color = "gray", active, onClick }) {
  const colors = {
    gray: "from-gray-100 to-gray-200 text-gray-800",
    green: "from-green-100 to-green-200 text-green-700",
    yellow: "from-yellow-100 to-yellow-200 text-yellow-700",
    red: "from-red-100 to-red-200 text-red-700",
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl p-5 border shadow-sm transition-all duration-200
        ${active 
          ? "bg-black text-white scale-105 shadow-lg" 
          : `bg-gradient-to-br ${colors[color]} hover:scale-105`
        }`}
    >
      <p className="text-sm opacity-70">{title}</p>
      <h2 className="text-2xl font-bold mt-1">{value}</h2>
    </div>
  );
}
function StatusBadge({ status }) {
  const styles = {
    approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}