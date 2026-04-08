import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import { MoreVertical, Eye, Trash2 } from "lucide-react";
import { Star } from "lucide-react";

export default function UserReview() {

  const [reviews, setReviews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openMenu, setOpenMenu] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  /* ================= FETCH REVIEWS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchReviews = async () => {
      try {
        const token = await user.getIdToken();

        const res = await axios.get(
          `http://localhost:5000/api/vehicle-detail/user/my-reviews?userId=${user.uid}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setReviews(res.data);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [user]);

  /* ================= FILTER ================= */
  const filtered = reviews
    .filter((r) => {
      const created = new Date(r.createdAt);
      const now = new Date();

      if (dateFilter === "week") {
        const d = new Date();
        d.setDate(now.getDate() - 7);
        return created >= d;
      }

      if (dateFilter === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }

      if (dateFilter === "30days") {
        const d = new Date();
        d.setDate(now.getDate() - 30);
        return created >= d;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * itemsPerPage;
  const current = filtered.slice(indexOfLast - itemsPerPage, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Review?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = await auth.currentUser.getIdToken();

await axios.delete(
  `http://localhost:5000/api/vehicle-detail/user/review/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReviews((prev) => prev.filter((r) => r._id !== id));

    Swal.fire({
  icon: "success",
  title: "Deleted",
  timer: 1200,
  showConfirmButton: false,
});
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6 flex-wrap gap-3">

          <h1 className="text-2xl font-semibold">
            My Reviews
          </h1>

          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="30days">Last 30 Days</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-gray-50 border rounded-xl p-4">

          <h2 className="font-semibold mb-4">
            All Reviews ({filtered.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">

              <thead className="border-b text-gray-600">
                <tr>
                  <th className="p-3 text-left">Vehicle</th>
                  <th className="p-3 text-left">Review</th>
                  <th className="p-3 text-left">Rating</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {current.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-100">

                <td className="p-3">
  <div className="flex items-center gap-3">

    <img
      src={
        r.vehicleId?.imageUrl ||
        "https://via.placeholder.com/60"
      }
      className="w-14 h-14 rounded-lg object-cover"
    />

    <div>
      <p className="font-semibold text-gray-800">
        {r.vehicleId?.name || "Vehicle"}
      </p>

      <p className="text-xs text-gray-500">
        {r.vehicleType === "Bike" ? "Bike" : "Car"}
      </p>
    </div>

  </div>
</td>
       <td className="p-3 text-gray-600 max-w-[250px] truncate">
  {r.comment}
</td>

          <td className="p-3">
  <div className="flex items-center gap-1 text-orange-500">

    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={16}
        fill={
          star <= Math.round(r.rating)
            ? "currentColor"
            : "none"
        }
        stroke="currentColor"
      />
    ))}

    <span className="text-gray-600 ml-1 text-sm">
      ({r.rating})
    </span>

  </div>
</td>

                    <td className="p-3 text-xs">
                      {new Date(r.createdAt).toDateString()}
                    </td>

                    <td className="p-3 relative">

<button
  className="p-2 rounded-lg hover:bg-gray-100 transition"
  onClick={(e) => {
    e.stopPropagation();
    setOpenMenu(openMenu === r._id ? null : r._id);
  }}
>
  <MoreVertical size={18} />
</button>

                      {openMenu === r._id && (
               <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">

  <button
    onClick={() => {
      setSelectedReview(r);
      setOpenMenu(null);
    }}
    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-2"
  >
    <Eye size={16} /> View
  </button>

  <button
    onClick={() => handleDelete(r._id)}
    className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-500 flex items-center gap-2"
  >
    <Trash2 size={16} /> Delete
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
 <div className="flex justify-between items-center mt-4 text-sm text-gray-600">

  {/* LEFT TEXT */}
  <p>
    Showing{" "}
    {filtered.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1}{" "}
    to{" "}
    {Math.min(currentPage * itemsPerPage, filtered.length)}{" "}
    of {filtered.length} entries
  </p>

  {/* RIGHT PAGINATION */}
  <div className="flex gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
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
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>

</div>

        </div>
      </div>

      {/* ================= POPUP ================= */}
{selectedReview && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">

    <div className="bg-white w-[600px] max-w-[95%] rounded-2xl shadow-2xl p-6 relative animate-fadeIn">

      {/* CLOSE */}
      <button
        onClick={() => setSelectedReview(null)}
        className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="flex items-center gap-4 border-b pb-4 mb-4">

        <img
          src={selectedReview.vehicleId?.imageUrl || "/default-car.png"}
          className="w-16 h-16 rounded-xl object-cover border"
        />

        <div>
          <h2 className="text-lg font-semibold">
            {selectedReview.vehicleId?.name || "Vehicle"}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedReview.vehicleType}
          </p>
        </div>

      </div>

      {/* REVIEW */}
      <div className="mb-5">

        <p className="text-gray-700 leading-relaxed">
          {selectedReview.comment}
        </p>

        {/* STARS */}
        <div className="flex gap-1 mt-3 text-orange-500">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              fill={
                star <= Math.round(selectedReview.rating)
                  ? "currentColor"
                  : "none"
              }
              stroke="currentColor"
            />
          ))}
        </div>

      </div>

      {/* REPLIES */}
      <div>

        <h3 className="font-semibold text-gray-800 mb-3">
          Replies
        </h3>

        {selectedReview.replies?.length > 0 ? (
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">

            {selectedReview.replies.map((rep, i) => (
              <div
                key={i}
                className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl border"
              >

                <img
                  src={rep.profileImage || "/default-avatar.png"}
                  className="w-9 h-9 rounded-full object-cover"
                />

                <div className="flex-1">

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-800">
                      {rep.name}
                    </p>

                    <span className="text-xs text-gray-400">
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {rep.message}
                  </p>

                </div>

              </div>
            ))}

          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm py-6">
            No replies yet
          </div>
        )}

      </div>

      {/* FOOTER BUTTON */}
      <button
        onClick={() => setSelectedReview(null)}
        className="w-full mt-6 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
      >
        Close
      </button>

    </div>
  </div>
)}

    </div>
  );
}