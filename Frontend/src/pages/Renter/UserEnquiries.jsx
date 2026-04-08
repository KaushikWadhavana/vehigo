import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

export default function UserEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
const [sortBy, setSortBy] = useState("newest");
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/enquiry/user`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    // ✅ NOW SAFE
    if (Array.isArray(data) && data.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Enquiries",
        text: "You haven't made any enquiries yet",
        timer: 1500,
        showConfirmButton: false,
      });
    }

    setEnquiries(Array.isArray(data) ? data : []);

  } catch (err) {
    console.error(err);
  }
};

  // ✅ FILTER
const filtered = Array.isArray(enquiries)
  ? enquiries
      .filter((e) =>
        e.listingId?.name?.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "asc") return a.listingId?.name?.localeCompare(b.listingId?.name);
        if (sortBy === "desc") return b.listingId?.name?.localeCompare(a.listingId?.name);
        if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);

        return new Date(b.createdAt) - new Date(a.createdAt); // newest
      })
  : [];

  const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;
const currentData = filtered.slice(indexOfFirst, indexOfLast);
const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getStatusStyle = (status) => {
    if (status === "Not Opened") return "bg-red-100 text-red-600";
    if (status === "Opened") return "bg-green-100 text-green-600";
    return "bg-purple-100 text-purple-600";
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 lg:px-16 py-8 bg-gray-100">

      {/* BACK */}
      <button
        onClick={() => navigate("/userhome")}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* HEADER */}
      <div className="mt-6 mb-6">
        <h1 className="text-3xl font-bold">My Enquiries</h1>
        <p className="text-gray-500">Track your enquiries & replies</p>
      </div>

      {/* SEARCH */}
<div className="flex flex-col sm:flex-row gap-3 mb-6">

  {/* SEARCH */}
  <div className="relative flex-1">
    <Search className="absolute left-4 top-3 text-gray-400" size={18} />
    <input
      placeholder="Search vehicle..."
      className="pl-10 pr-4 py-3 w-full rounded-xl border bg-white shadow"
      value={search}
      onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1); // 🔥 ADD THIS
}}
    />
  </div>

  {/* SORT */}
  <select
    value={sortBy}
    onChange={(e) => {
  setSortBy(e.target.value);
  setCurrentPage(1); // 🔥 ADD
}}
    className="px-4 py-3 rounded-xl border bg-white shadow"
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
<table className="min-w-[1000px] w-full text-sm table-auto">

    <thead className="bg-gray-50 border-b text-gray-600">
      <tr className="text-left whitespace-nowrap">
        <th className="px-4 py-3 w-[220px]">Vehicle</th>
        <th className="w-[180px]">Date</th>
        <th className="w-[120px] text-center">Status</th>
        <th className="w-[100px] text-center">View</th>
      </tr>
    </thead>

    <tbody>
      {currentData.map((e) => (
        <tr key={e._id} className="border-b hover:bg-gray-50">

          {/* VEHICLE */}
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

          {/* DATE */}
<td className="whitespace-nowrap">
  {new Date(e.createdAt).toLocaleString()}
</td>
          {/* STATUS */}
          <td className="text-center">
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(e.status)}`}>
              {e.status}
            </span>
          </td>

          {/* VIEW */}
          <td className="text-center">
            <button
              onClick={() => {
  setSelected(e);

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: "Opening enquiry...",
    showConfirmButton: false,
    timer: 800,
  });
}}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <MessageCircle size={16} />
            </button>
          </td>

        </tr>
      ))}
    </tbody>

  </table>
  <div className="p-4 flex justify-between items-center text-sm text-gray-500">

  <div>
    Showing {indexOfFirst + 1} to{" "}
    {Math.min(indexOfLast, filtered.length)} of{" "}
    {filtered.length}
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
          currentPage === i + 1
            ? "bg-teal-600 text-white"
            : "border"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() =>
        setCurrentPage((p) =>
          Math.min(p + 1, totalPages)
        )
      }
      disabled={currentPage === totalPages}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>

  </div>
</div>
</div>
      </div>

      {/* EMPTY */}
{filtered.length === 0 && (
  <div className="text-center mt-16 text-gray-400">
    <MessageCircle size={50} className="mx-auto mb-4 opacity-40" />
    <p>No enquiries found</p>
  </div>
)}
      {/* MODAL */}
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

      {/* VEHICLE */}
      <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-lg mb-4">
        <img
          src={selected.listingId?.imageUrl || "/no-image.png"}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <p className="font-semibold">
            {selected.listingId?.name}
          </p>
          <p className="text-sm text-gray-500">
            {selected.listingType}
          </p>
        </div>
      </div>

      {/* MESSAGE */}
<div className="space-y-2 mb-4 text-sm">

  <p>
    <b>Date:</b>{" "}
    {new Date(selected.createdAt).toLocaleString()}
  </p>

  <p>
    <b>Status:</b>{" "}
    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(selected.status)}`}>
      {selected.status}
    </span>
  </p>

</div>

<div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
  {selected.message}
</div>

      {/* REPLY */}
      {selected.reply ? (
        <div className="bg-green-100 p-3 rounded-lg">
          <p className="font-semibold text-green-700 mb-1">
            Owner Reply
          </p>
          <p>{selected.reply.message}</p>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          No reply yet
        </p>
      )}

    </div>
  </div>
)}
    </div>
  );
}