import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export default function OwnerMyVehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);

  const [editMode, setEditMode] = useState(false);
const [form, setForm] = useState({
  mileage: "",
  pricing: {},
});
const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicle();
  }, []);
  useEffect(() => {
  if (vehicle) {
    setForm({
      mileage: vehicle.mileage || "",
      pricing: vehicle.pricing || {},
    });
  }
}, [vehicle]);


  const fetchVehicle = async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/owner/vehicles/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setVehicle(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/600x400";
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_API_URL}/${img}`;
  };

  if (!vehicle)
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        Loading...
      </div>
    );
const handleSave = async () => {
  try {
    setLoading(true);

    const token = await auth.currentUser.getIdToken();

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/vehicles/${id}/update-basic`,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-10">

      {/* BACK BUTTON */}
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

                <div>
  Weekly:
  {editMode ? (
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
  )}
</div>
                <div>
  Monthly:
  {editMode ? (
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
  )}
</div>
                <div>
  Yearly:
  {editMode ? (
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
  )}
</div>

                <div>Base KM: {editMode ? (
    <input
      value={form.pricing?.baseKm || "" }
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
    vehicle.pricing.baseKm
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

      {/* FEATURES */}

      {vehicle.features?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
            Features
          </h2>

          <div className="flex flex-wrap gap-3">

            {vehicle.features.map((f, i) => (
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
            <AlertTriangle className="text-red-500" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Damage Reports
            </h2>
          </div>

          {vehicle.damages.map((d, i) => (
            <div key={i} className="mb-4 border-b dark:border-gray-700 pb-3">

              <p className="font-semibold">
                {d.location} - {d.type}
              </p>

              <p className="text-gray-500">
                {d.description}
              </p>

            </div>
          ))}

        </div>
      )}

      {/* FAQ */}

      {vehicle.faqs?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800 mb-8">

          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              FAQ
            </h2>
          </div>

          {vehicle.faqs.map((f, i) => (
            <div key={i} className="mb-4">

              <p className="font-semibold">
                {f.question}
              </p>

              <p className="text-gray-500">
                {f.answer}
              </p>

            </div>
          ))}

        </div>
      )}

      {/* DOCUMENTS */}

      {vehicle.documents?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border dark:border-gray-800">

          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-green-500" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Documents
            </h2>
          </div>

          <div className="grid gap-6">

            {vehicle.documents.map((doc, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl"
              >

                <p className="font-semibold mb-3">
                  📄 {doc.name}
                </p>

                <iframe
                  src={`https://docs.google.com/gview?url=${doc.url}&embedded=true`}
                  className="w-full h-[500px] rounded-xl border"
                />

                <a
                  href={doc.url}
                  target="_blank"
                  className="text-orange-500 mt-3 inline-block"
                >
                  Open Document
                </a>

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