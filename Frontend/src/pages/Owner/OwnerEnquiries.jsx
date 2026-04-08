import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Search, Users, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

export default function OwnerEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [openMenuId, setOpenMenuId] = useState(null);
const [selected, setSelected] = useState(null);
const [replyText, setReplyText] = useState("");
const [loadingReply, setLoadingReply] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);
  const fetchData = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("${import.meta.env.VITE_API_URL}/api/enquiry/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ FILTER + SORT
const filtered = Array.isArray(enquiries)
  ? enquiries
      .filter(
        (e) =>
          e.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.email?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "asc") return a.name.localeCompare(b.name);
        if (sortBy === "desc") return b.name.localeCompare(a.name);
        if (sortBy === "oldest")
          return new Date(a.createdAt) - new Date(b.createdAt);

        return new Date(b.createdAt) - new Date(a.createdAt);
      })
  : [];

  // ✅ PAGINATION
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentData = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // ✅ STATUS UI
  const getStatusStyle = (status) => {
    if (status === "Not Opened") return "bg-red-100 text-red-600";
    if (status === "Opened") return "bg-green-100 text-green-600";
    return "bg-purple-100 text-purple-600";
  };

  // ✅ VIEW
const viewEnquiry = async (e) => {
  setSelected(e);
  setReplyText(e.reply?.message || "");

  // ✅ mark opened
  if (e.status === "Not Opened") {
    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/enquiry/status/${e._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Opened" }),
      }
    );

    // ✅ UPDATE UI INSTANTLY 🔥
    setEnquiries((prev) =>
      prev.map((x) =>
        x._id === e._id ? { ...x, status: "Opened" } : x
      )
    );

    // ✅ ALSO UPDATE MODAL
    setSelected((prev) => ({
      ...prev,
      status: "Opened",
    }));
  }
};
const sendReply = async () => {

  // ✅ VALIDATION
  if (!replyText.trim()) {
    return Swal.fire({
      icon: "warning",
      title: "Empty Reply",
      text: "Please enter a reply message",
    });
  }

  if (replyText.length < 3) {
    return Swal.fire({
      icon: "warning",
      title: "Too Short",
      text: "Reply must be at least 3 characters",
    });
  }

  if (replyText.length > 250) {
    return Swal.fire({
      icon: "warning",
      title: "Too Long",
      text: "Reply cannot exceed 250 characters",
    });
  }

  const token = await auth.currentUser.getIdToken();

  try {
    setLoadingReply(true); // ✅ START LOADING

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/enquiry/reply/${selected._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText }),
      }
    );

    const updated = await res.json();

    // ✅ KEEP OLD listingId (VERY IMPORTANT)
    setEnquiries(prev =>
      prev.map(e =>
        e._id === updated._id
          ? { ...updated, listingId: e.listingId }
          : e
      )
    );

    // ✅ UPDATE MODAL DATA ALSO (FIX 🔥)
    setSelected(prev => ({
      ...prev,
      ...updated,
      listingId: prev.listingId
    }));

    Swal.fire({
      icon: "success",
      title: "Reply Sent",
      text: "Your reply has been saved",
      timer: 1500,
      showConfirmButton: false
    });

    setSelected(null);

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to send reply",
    });
  } finally {
    setLoadingReply(false); // ✅ STOP LOADING
  }
};


  // ✅ REPLY
  const markReplied = async (id) => {
    const token = await auth.currentUser.getIdToken();

    await fetch(`${import.meta.env.VITE_API_URL}/api/enquiry/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "Replied" }),
    });

    setEnquiries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status: "Replied" } : e)),
    );
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Enquiry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    const token = await auth.currentUser.getIdToken();

    await fetch(`${import.meta.env.VITE_API_URL}/api/enquiry/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setEnquiries((prev) => prev.filter((e) => e._id !== id));
  };

  
  return (
    <div className="min-h-screen w-full px-4 sm:px-8 lg:px-16 py-8 bg-gray-100 dark:bg-black">
      {/* BACK */}
      <button
        onClick={() => navigate("/owner")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow hover:text-orange-500"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
            Enquiries
          </h1>
          <p className="text-gray-500">Customer enquiries</p>
        </div>

        <div className="bg-white rounded-2xl px-6 py-3 shadow flex items-center gap-3">
          <Users className="text-orange-500" />
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-lg">{enquiries.length}</p>
          </div>
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            placeholder="Search enquiry..."
            className="pl-10 pr-4 py-3 w-full rounded-2xl border bg-white shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 rounded-2xl border bg-white shadow"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
<div className="overflow-x-auto w-full">
<table className="min-w-[1000px] w-full text-sm table-fixed">
<thead className="bg-gray-50 border-b text-gray-600">
  <tr className="text-left whitespace-nowrap">
    <th className="px-4 py-3 w-[220px]">Car</th>
    <th className="w-[150px]">Customer</th>
    <th className="w-[220px]">Email</th>
    <th className="w-[140px]">Phone</th>
    <th className="w-[180px]">Date</th>
    <th className="w-[100px] text-center">Enquiry</th>
    <th className="w-[120px] text-center">Status</th>
    <th className="w-[60px]"></th>
  </tr>
</thead>

            <tbody>
              {currentData.map((e) => (
                <tr key={e._id} className="border-b hover:bg-gray-50">
                  {/* ✅ CAR COLUMN */}
<td className="px-4 py-4">
  <div className="flex items-center gap-3">
    <img
      src={e.listingId?.imageUrl || "/no-image.png"}
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
    />
    <div className="overflow-hidden">
      <p className="font-medium truncate">
        {e.listingId?.name || "N/A"}
      </p>
      <p className="text-xs text-gray-400">
        {e.listingType}
      </p>
    </div>
  </div>
</td>

<td className="truncate">{e.name}</td>
<td className="truncate max-w-[180px]">{e.email}</td>
<td>{e.phone}</td>
<td className="text-sm">
  {new Date(e.createdAt).toLocaleString()}
</td>
                  {/* ENQUIRY ICON */}
<td className="text-center">
  <button
    onClick={() => viewEnquiry(e)}
    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
  >
    📄
  </button>
</td>
<td className="text-center">
  <span
    className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(e.status)}`}
  >
    {e.status}
  </span>
</td>

<td className="px-4 py-4 text-center relative">                    {/* 3 DOT BUTTON */}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(openMenuId === e._id ? null : e._id);
                      }}
                      className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      ⋮
                    </button>

                    {/* DROPDOWN */}
                    {openMenuId === e._id && (
                      <div
                        onClick={(e) => e.stopPropagation()} // 🔥 prevent closing inside click
                        className="absolute right-4 mt-2 w-32 bg-white shadow-lg rounded-lg border z-50"
                      >
                        <button
                          onClick={() => {
                            handleDelete(e._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            Showing {indexOfFirst + 1} to{" "}
            {Math.min(indexOfLast, filtered.length)} of {filtered.length}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 ? "bg-teal-600 text-white" : "border"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="text-center mt-16 text-gray-400">
          <Users size={50} className="mx-auto mb-4 opacity-40" />
          <p>No enquiries found</p>
        </div>
      )}

{selected && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white w-[500px] max-w-[95%] rounded-2xl p-6 relative shadow-xl animate-fadeIn">

      {/* CLOSE */}
      <button
        onClick={() => setSelected(null)}
        className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
      >
        ✕
      </button>

      {/* TITLE */}
      <h2 className="text-xl font-semibold mb-4">
        Enquiry Details
      </h2>

      {/* VEHICLE INFO */}
      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-lg mb-4">
        <img
          src={selected.listingId?.imageUrl || "/no-image.png"}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
    <p className="font-semibold">
  {selected.listingId?.name || "Vehicle not available"}
</p>
          <p className="text-sm text-gray-500">
            {selected.listingType}
          </p>
        </div>
      </div>

      {/* USER INFO */}
      <div className="space-y-1 text-sm mb-3">
        <p><b>Name:</b> {selected.name}</p>
        <p><b>Email:</b> {selected.email}</p>
        <p><b>Phone:</b> {selected.phone}</p>
      </div>

      <hr className="my-3"/>

      {/* MESSAGE */}
      <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
        {selected.message}
      </div>

      {/* REPLY */}
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write your reply..."
        className="w-full border rounded-lg p-3 h-24"
      />

      <p className="text-right text-xs text-gray-400 mt-1">
        {replyText.length}/250
      </p>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 mt-5">

        <button
          onClick={() => setSelected(null)}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

<button
  onClick={sendReply}
  disabled={loadingReply}
  className="px-5 py-2 bg-[#e6a24a] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
>
  {loadingReply ? "Sending..." : selected.reply ? "Update Reply" : "Send Reply"}
</button>

      </div>

    </div>
  </div>
)}
    </div>

    
  );
}
