import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { auth } from "../../firebase";  // ✅ adjust path if needed
import LocationPicker from "../../components/LocationPicker";

import axios from "axios";
import {
  ArrowLeft,
  CheckCircle,
  Flame,
  DollarSign,
  Upload,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
  Trash2,
    Wifi,
  Baby,
  Fuel,
  Map,
  Shield,
  Usb,
  Camera,
  Radio,
  Receipt,
  Zap,
  X,
  UploadCloud, FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ================= FEATURES ================= */

const FEATURES = [
  "Air Condition",
  "Climate Control",
  "Climate Control Two Zones",
  "Luxury Climate Control",
  "Sunroof",
  "Panoramic Sunroof",
  "Moonroof",
  "Push-button Start",
  "Keyless Access",
  "Rear Parking Sensors",
  "Parking Sensors",
  "Built-in Sat Nav",
  "Mobile Phone Technology",
  "Bluetooth",
  "Usb",
  "Qi Wireless Charging",
  "Audio/ipod",
  "Cruise Control",
  "Adaptive Cruise Control",
  "Apple Carplay",
  "Android Auto",
  "Forward Collision Warning",
  "Lane Departure Warning",
  "Automatic Emergency Braking",
  "Active Parking Assist",
  "Automatic High Beams",
  "Adaptive Headlights",
  "360-degree Camera",
  "Rearview Camera",
  "Towing Hook",
  "Leather Interior",
  "Fabric Interior",
];

const SERVICES = [
  {
    key: "wifi",
    title: "Wi-Fi Hotspot",
    price: 300,
    type: "one_time",
  },
  {
    key: "childSeat",
    title: "Child Safety Seat",
    price: 250,
    type: "per_day",
  },
  {
    key: "fuel",
    title: "Fuel Pre-Purchase",
    price: 500,
    type: "one_time",
  },
  {
    key: "roadside",
    title: "Roadside Assistance",
    price: 150,
    type: "per_day",
  },

  // 🔥 FIXED TOLL
  {
    key: "toll",
    title: "Toll Charges",
    price: 0,
    type: "dynamic",
    isDynamic: true   // ✅ ADD THIS
  },

  {
    key: "dashcam",
    title: "Dash Cam",
    price: 220,
    type: "per_day",
  },
];
/* ================= MAIN ================= */

// ... imports stay SAME

export default function AddVehicle() {
  const [activeTab, setActiveTab] = useState("Basic");
const [saving, setSaving] = useState(false); // ✅ ADD HERE
const [saveStatus, setSaveStatus] = useState(null); 
  const [basicDone, setBasicDone] = useState(false);
  const [basicPayload, setBasicPayload] = useState(null);
  const [features, setFeatures] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const navigate = useNavigate();

  const [extraServices, setExtraServices] = useState(
  SERVICES.map((s) => ({ ...s, enabled: false }))
);
const [draft, setDraft] = useState({
  basic: null,
  features: [],
  pricing: null,
  extras: [],
  documents: [],
  damages: [],
  faqs: [],
});

const [completed, setCompleted] = useState({
  Basic: false,
  Features: false,
  Pricing: false,
  "Extra Services": false,
  Uploads: false,
  Damages: false,
  FAQ: false,
});

  const tabs = [
    { key: "Basic", icon: CheckCircle },
    { key: "Features", icon: Flame },
    { key: "Pricing", icon: DollarSign },
    { key: "Extra Services", icon: DollarSign },
    { key: "Uploads", icon: Upload },
    { key: "Damages", icon: AlertTriangle },
    { key: "FAQ", icon: HelpCircle },
  ];
const TAB_ORDER = [
  "Basic",
  "Features",
  "Pricing",
  "Extra Services",
  "Uploads",
  "Damages",
  "FAQ",
];

const isTabDisabled = (key) => {
  const currentIndex = TAB_ORDER.indexOf(key);

  // Basic is always enabled
  if (currentIndex === 0) return false;

  // All previous tabs must be completed
  for (let i = 0; i < currentIndex; i++) {
    const prevTab = TAB_ORDER[i];
    if (!completed[prevTab]) {
      return true; // ❌ disable
    }
  }

  return false; // ✅ enable
};

const finishVehicle = async () => {
  try {
    // 🔒 Prevent double submit
    if (saving) return;
    setSaving(true);

    // 🟡 OPEN SINGLE POPUP (progress)
    Swal.fire({
      title: "Saving Vehicle",
      html: "Uploading data, please wait...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // ❌ Validation
    if (!draft.basic || !draft.basic.form || !draft.basic.image) {
      throw new Error("Basic details missing");
    }

    const requiredDocs = ["car", "policy", "puc"];
    const uploadedTypes = draft.documents.map(d => d.docType);
    const missing = requiredDocs.filter(t => !uploadedTypes.includes(t));
    if (missing.length) {
      throw new Error(`Missing documents: ${missing.join(", ")}`);
    }

    // 🧾 FORM DATA
    const fd = new FormData();

    Object.entries(draft.basic.form).forEach(([k, v]) => {
      fd.append(k, v);
    });

    fd.append("image", draft.basic.image);
    fd.append("features", JSON.stringify(draft.features));
    fd.append("pricing", JSON.stringify(draft.pricing));
    fd.append("extras", JSON.stringify(draft.extras));
    fd.append("damages", JSON.stringify(draft.damages));
    fd.append("faqs", JSON.stringify(draft.faqs));

    draft.documents.forEach((doc, i) => {
      if (!(doc.file instanceof File)) return;
      fd.append("documents", doc.file);
      fd.append(`documentsType[${i}]`, doc.docType);
    });

    // 🚀 API CALL
   const user = auth.currentUser;

if (!user) {
  throw new Error("User not authenticated");
}

const token = await user.getIdToken();

await axios.post(
  `${import.meta.env.VITE_API_URL}/api/vehicles`,
  fd,
  {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,  // ✅ REQUIRED
    },
  }
);


    // ✅ SUCCESS (same popup transforms)
    Swal.fire({
      icon: "success",
      title: "Vehicle Added Successfully",
      text: "Your vehicle has been saved",
      timer: 1800,
      showConfirmButton: false,
    });

    setTimeout(() => {
 navigate("/owner/add");
    }, 1800);

  } catch (err) {
    console.error(err);

    // ❌ FAIL (same popup transforms)
    Swal.fire({
      icon: "error",
      title: "Failed to Save Vehicle",
      text: err.message || "Something went wrong",
    });

  } finally {
    setSaving(false);
  }
};


  return (
<div className="space-y-6 px-2 sm:px-4 md:px-6 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <button
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors"
 onClick={() => navigate("/admin/add")}
      >
        <ArrowLeft size={16} /> Back to home
      </button>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap gap-3 border-b pb-4">
          {tabs.map(({ key, icon: Icon }) => (
<button
  key={key}
  disabled={isTabDisabled(key)}
  onClick={() => {
    if (isTabDisabled(key)) return;   // 🚫 HARD BLOCK
    setActiveTab(key);
  }}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
    ${
      isTabDisabled(key)
        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
        : activeTab === key
  ? "bg-black dark:bg-white text-white dark:text-black"
: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
    }
  `}
>


  <Icon size={16} />
  {key}
  {completed[key] && <CheckCircle size={14} className="text-green-400" />}
</button>

          ))}
        </div>

        {activeTab === "Basic" && (
<BasicForm
  onNext={(payload) => {
    setBasicPayload(payload);
    setBasicDone(true);
    setActiveTab("Features");
  }}
  setDraft={setDraft}
  setCompleted={setCompleted}
  setActiveTab={setActiveTab}
  draft={draft}          // ✅ ADD THIS
/>

        )}

        {activeTab === "Features" && (
  <FeaturesTab
  features={features}
  setFeatures={setFeatures}
  setActiveTab={setActiveTab}
  setDraft={setDraft}
  setCompleted={setCompleted}
/>


        )}

        {activeTab === "Pricing" && (
<PricingForm
  payload={basicPayload}
  features={features}
  onCancel={() => setActiveTab("Features")}
  setActiveTab={setActiveTab}
  setDraft={setDraft}
  setCompleted={setCompleted}
  draft={draft}        // ✅ ADD THIS
/>



)}
{activeTab === "Extra Services" && (
<ExtraServicesTab
  servicesData={extraServices}
  setServicesData={setExtraServices}
  setActiveTab={setActiveTab}
  setDraft={setDraft}
  setCompleted={setCompleted}
/>

)}
{activeTab === "Uploads" && (
  <UploadsTab
    vehicleId={vehicleId}
    setActiveTab={setActiveTab}
    setDraft={setDraft}
    setCompleted={setCompleted}
    draft={draft}          // ✅ REQUIRED
  />
)}

{activeTab === "Damages" && (
  <DamagesTab
    vehicleId={vehicleId}
    setActiveTab={setActiveTab}
    setDraft={setDraft}
    setCompleted={setCompleted}
    draft={draft}          // ✅ REQUIRED
  />
)}

{activeTab === "FAQ" && (
<FaqTab
  vehicleId={vehicleId}
  setActiveTab={setActiveTab}
  setDraft={setDraft}
  finishVehicle={finishVehicle}
  draft={draft}
  saving={saving}
/>

)}



      </div>
    </div>
  );
}


/* ================= BASIC FORM ================= */

function BasicForm({ onNext, setDraft, setCompleted, setActiveTab, draft }) {


  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const numberOnly = (value) => value.replace(/\D/g, "");
useEffect(() => {
  if (draft?.basic?.form) {
    setForm(draft.basic.form);
  }

  if (draft?.basic?.image) {
    setImage(draft.basic.image);
    setPreview(URL.createObjectURL(draft.basic.image));
  }
}, [draft]);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    category: "",
    mainLocation: "",
    fuel: "",
    year: "",
    passengers: "",
    seats: "",
    transmission: "",
    mileage: "",
    plateNumber: "",
  });

const validate = () => {
  const e = {};

  Object.entries(form).forEach(([k, v]) => {
    if (!v) e[k] = "Required";
  });

  if (!image) e.image = "Image required";

  // ✅ Year range
  if (form.year && (form.year < 1990 || form.year > new Date().getFullYear())) {
    e.year = "Enter a valid year";
  }

  // ✅ Seats limit
  if (form.seats && Number(form.seats) > 10) {
    e.seats = "Seats cannot exceed 10";
  }

  // ✅ Passengers limit
  if (form.passengers && Number(form.passengers) > 10) {
    e.passengers = "Passengers cannot exceed 10";
  }

  setErrors(e);
  return Object.keys(e).length === 0;
};
const submit = () => {
  if (!validate()) return;

  setDraft(d => ({
    ...d,
    basic: { form, image }
  }));

  setCompleted(c => ({ ...c, Basic: true }));
  setActiveTab("Features");
};


  return (
    <div className="space-y-8">
      {/* IMAGE */}
      <div>
        <h3 className="font-semibold mb-3">Featured Image *</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon />
              )}
            </div>

            {preview && (
              <button
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                }}
                className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>

          <label className="px-4 py-2 bg-black text-white rounded-lg cursor-pointer flex gap-2">
            <ImageIcon size={16} /> Change
            <input
              type="file"
              hidden
              onChange={(e) => {
                setImage(e.target.files[0]);
                setPreview(URL.createObjectURL(e.target.files[0]));
              }}
            />
          </label>
        </div>
        {errors.image && (
          <p className="text-red-500 text-xs mt-1">{errors.image}</p>
        )}
      </div>

      {/* FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.keys(form).map((key) =>
          key === "year" ? (
            <YearSelect
              key={key}
              value={form.year}
              error={errors.year}
              onChange={(v) => setForm({ ...form, year: v })}
            />
          ) : key === "fuel" ? (
            <Select
              key={key}
              label="Fuel *"
              options={["Petrol", "Diesel", "Electric"]}
              value={form.fuel}
              error={errors.fuel}
              onChange={(v) => setForm({ ...form, fuel: v })}
            />
          ) : key === "transmission" ? (
            <Select
              key={key}
              label="Transmission *"
              options={["Manual", "Automatic", "Semi Automatic"]}
              value={form.transmission}
              error={errors.transmission}
              onChange={(v) =>
                setForm({ ...form, transmission: v })
              }
            />
          ) : (
<Input
  key={key}
  label={`${key.replace(/([A-Z])/g, " $1")} *`}
  type="text"
  inputMode={["seats", "passengers", "year", "mileage"].includes(key) ? "numeric" : "text"}
  value={form[key]}
  error={errors[key]}
  onChange={(e) => {
    let value = e.target.value;

    // ✅ Allow ONLY numbers for numeric fields
    if (["seats", "passengers", "year", "mileage"].includes(key)) {
      value = value.replace(/\D/g, "");
    }

    setForm({ ...form, [key]: value });
  }}
/>

          )
        )}
      </div>
  <LocationPicker
    onSelect={(location) => {
      setForm({
        ...form,
        mainLocation: location.address,   // ✅ ONLY ADDRESS
      });
    }}
  />

  {form.mainLocation && (
    <p className="text-sm text-gray-600">
      📍 {form.mainLocation}
    </p>
  )}
      <div className="flex justify-end gap-3">
<button
  onClick={() => window.history.back()}
  className="px-6 py-2 border rounded-lg"
>
  Cancel
</button>

     <button
  onClick={submit}
  className="px-8 py-3 rounded-xl font-semibold text-sm
    bg-gradient-to-r from-orange-500 to-orange-600
    text-white shadow-lg
    hover:shadow-xl hover:scale-[1.02]
    active:scale-95 transition"
>
  Add Features
</button>

      </div>
    </div>
  );
}

/* ================= FEATURES TAB ================= */

function FeaturesTab({ features, setFeatures, setActiveTab, setDraft, setCompleted })
 {
const toggle = (f) => {
  setFeatures(prev =>
    prev.includes(f)
      ? prev.filter(x => x !== f)
      : [...prev, f]
  );
};

const submitFinal = () => {
  if (!features.length) return Swal.fire({
  toast: true,
  position: "top-end",
  icon: "warning",
  title: "Feature required",
  text: "Please select at least one feature to continue.",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: "#ffffff",
  iconColor: "#f59e0b",
  customClass: {
    popup: "shadow-lg rounded-xl border",
    title: "text-sm font-semibold text-gray-900",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});


  setDraft(d => ({
    ...d,
    features
  }));

  setCompleted(c => ({ ...c, Features: true }));
  setActiveTab("Pricing");
};


  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Features & Amenities</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <label key={f} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 rounded flex gap-2 transition">
            <input
              type="checkbox"
              checked={features.includes(f)}
              onChange={() => toggle(f)}
            />
            {f}
          </label>
        ))}
      </div>
      {/* LOCATION PICKER */}
<div className="space-y-3">
  <h3 className="font-semibold">Select Location *</h3>


</div>


     <div className="flex justify-end gap-3">
  <button
    onClick={() => setActiveTab("Basic")}
    className="px-6 py-2 border rounded-lg"
  >
    Cancel
  </button>

  <button
    onClick={submitFinal}
    className="px-6 py-2 bg-orange-500 text-white rounded-lg"
  >
    Add Price
  </button>
</div>

    </div>
  );
}

/* ================= PRICING FORM ================= */
function PricingForm({
  payload,
  features,
  onCancel,
  setActiveTab,
  setDraft,
  setCompleted,
  draft,            // ✅ ADD
}) {
useEffect(() => {
  if (draft?.pricing) {
    setForm(draft.pricing);
  }
}, [draft?.pricing]);

  const [form, setForm] = useState({
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    yearlyPrice: "",
    baseKm: "",
    extraKmPrice: "",
    unlimited: false,
  });

  const [errors, setErrors] = useState({});

  const numberOnly = (v) => v.replace(/\D/g, "");

  const validate = () => {
    const e = {};
    if (!form.dailyPrice) e.dailyPrice = "Required";
    if (!form.weeklyPrice) e.weeklyPrice = "Required";
    if (!form.monthlyPrice) e.monthlyPrice = "Required";
    if (!form.yearlyPrice) e.yearlyPrice = "Required";
    if (!form.unlimited && !form.baseKm) e.baseKm = "Required";
    if (!form.extraKmPrice) e.extraKmPrice = "Required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

const next = () => {
  if (!validate()) return;

  setDraft(d => ({
    ...d,
    pricing: form
  }));

  setCompleted(c => ({ ...c, Pricing: true }));
  setActiveTab("Extra Services");
};


  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Pricing</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {["dailyPrice", "weeklyPrice", "monthlyPrice", "yearlyPrice"].map((k) => (
          <Input
            key={k}
            label={k.replace(/([A-Z])/g, " $1")}
            value={form[k]}
            error={errors[k]}
            inputMode="numeric"
            onChange={(e) =>
              setForm({ ...form, [k]: numberOnly(e.target.value) })
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!form.unlimited && (
          <Input
            label="Base KM Per Day"
            value={form.baseKm}
            error={errors.baseKm}
            inputMode="numeric"
            onChange={(e) =>
              setForm({ ...form, baseKm: numberOnly(e.target.value) })
            }
          />
        )}

        <Input
          label="Extra KM Price"
          value={form.extraKmPrice}
          error={errors.extraKmPrice}
          inputMode="numeric"
          onChange={(e) =>
            setForm({ ...form, extraKmPrice: numberOnly(e.target.value) })
          }
        />
      </div>

      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={form.unlimited}
          onChange={() =>
            setForm({ ...form, unlimited: !form.unlimited })
          }
        />
        Unlimited KM
      </label>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={next}
          className="px-8 py-3 bg-orange-500 text-white rounded-xl"
        >
          Add Extra Services
        </button>
      </div>
    </div>
  );
}
const EXTRA_ICONS = {
  wifi: Wifi,
  childSeat: Baby,
  fuel: Fuel,
  roadside: Shield,
  toll: Receipt,
  dashcam: Camera,
};
function ExtraServicesTab({
  servicesData,
  setServicesData,
  setActiveTab,
  setDraft,
  setCompleted
})
 {
  const [editOpen, setEditOpen] = useState(false);

  const toggleService = (key) => {
    setServicesData((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Extra Services</h3>

        <button
          onClick={() => setEditOpen(true)}
          className="text-orange-600 font-medium"
        >
          Edit Price
        </button>
      </div>

      {/* SERVICES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {servicesData.map((s) => (
          <div
            key={s.key}
className={`border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-4 flex gap-4 items-start cursor-pointer transition
  ${s.enabled ? "border-orange-400 bg-orange-50 dark:bg-orange-900/30" : ""}
`}
            onClick={() => toggleService(s.key)}
          >
            <div className="p-2 rounded-lg bg-black dark:bg-white text-white dark:text-black">
              {(() => {
  const Icon = EXTRA_ICONS[s.key];
  return Icon ? <Icon size={20} /> : null;
})()}            </div>

            <div className="flex-1">
              <h4 className="font-semibold">{s.title}</h4>
              <p className="text-xs text-gray-500">{s.desc}</p>

              <div className="mt-2 text-sm font-medium">
                {s.type === "dynamic" ? "Dynamic Price" : `₹${s.price}`} · {
  s.type === "per_day"
    ? "Per Day"
    : s.type === "dynamic"
    ? "On Usage"
    : "One Time"
}
              </div>
            </div>

            <input type="checkbox" checked={s.enabled} readOnly />
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setActiveTab("Pricing")}
          className="px-6 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={() => {
setDraft(d => ({
  ...d,
  extras: servicesData
    .filter(s => s.enabled)
    .map(s => ({
      key: s.key,
      title: s.title,
      price: s.type === "dynamic" ? 0 : s.price,   // 🔥 FIX
      type: s.type,
      isDynamic: s.type === "dynamic"              // 🔥 FIX
    }))
}));

setCompleted(c => ({ ...c, "Extra Services": true }));
setActiveTab("Uploads");

          }}
          className="px-8 py-3 bg-orange-500 text-white rounded-xl"
        >
          Continue
        </button>
      </div>

      {/* EDIT MODAL */}
      {editOpen && (
        <EditExtraPricingModal
          services={servicesData}
          setServices={setServicesData}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
function EditExtraPricingModal({ services, setServices, onClose }) {
  const updateService = (key, field, value) => {
    setServices((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, [field]: value } : s
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl p-6 space-y-4 relative border border-gray-200 dark:border-gray-700">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Pricing</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* TABLE */}
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {services.map((s) => (
            <div
              key={s.key}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-3"
            >
              <div className="font-medium">{s.title}</div>

              <select
                value={s.type}
                onChange={(e) =>
                  updateService(s.key, "type", e.target.value)
                }
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2"
              >
                <option value="per_day">Per Day</option>
                <option value="one_time">One Time</option>
              </select>

              <input
                type="number"
                value={s.price}
                onChange={(e) =>
                  updateService(s.key, "price", Number(e.target.value))
                }
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2"
                placeholder="₹ Price"
              />
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onClose}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadsTab({ vehicleId, setActiveTab, setDraft, setCompleted, draft }) {
  const [docs, setDocs] = useState([]);

  // ✅ RESTORE DATA WHEN TAB OPENS
  useEffect(() => {
    if (draft.documents?.length) {
      setDocs(
        draft.documents.map(d => ({
          name: d.file.name,
          type: d.docType,
          progress: 100,
        }))
      );
    }
  }, [draft.documents]);

  const uploadDoc = (file, docType) => {
    setDraft(d => {
      const filtered = d.documents.filter(doc => doc.docType !== docType);
      return { ...d, documents: [...filtered, { file, docType }] };
    });

    setDocs(prev => {
      const filtered = prev.filter(d => d.type !== docType);
      return [...filtered, { name: file.name, type: docType, progress: 100 }];
    });
  };

  const deleteDoc = (docType) => {
    setDraft(d => ({
      ...d,
      documents: d.documents.filter(doc => doc.docType !== docType),
    }));
    setDocs(prev => prev.filter(d => d.type !== docType));
  };

  // ❌ UI BELOW IS UNCHANGED


  const renderUploadBox = (title, docType) => (
    <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      <UploadCloud className="text-orange-500" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-gray-400">PDF / DOC (Max 50MB)</p>

  <input
  type="file"
  hidden
  accept=".pdf,.doc,.docx"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) return;

    uploadDoc(file, docType);

    // ✅ CRITICAL FIX
    e.target.value = null;
  }}
/>

    </label>
  );

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold">Upload Documents</h3>

      {/* UPLOAD BOXES */}
      <div className="grid md:grid-cols-3 gap-6">
        {renderUploadBox("RC Book", "car")}
        {renderUploadBox("Insurance Policy", "policy")}
        {renderUploadBox("Pollution Certificate", "puc")}
      </div>

      {/* FILE LIST */}
      {docs.map((d) => (
        <div
          key={`${d.name}-${d.type}`}

          className="border rounded-xl p-4 flex items-center gap-4"
        >
          <FileText className="text-red-500" />

          <div className="flex-1">
            <p className="text-sm font-medium">{d.name}</p>
            <p className="text-xs text-gray-400 capitalize">{d.type}</p>

            <div className="h-2 bg-gray-200 rounded mt-2">
              <div
                className="h-2 bg-green-500 rounded"
                style={{ width: `${d.progress}%` }}
              />
            </div>
          </div>

          <Trash2 onClick={() => deleteDoc(d.type)} className="text-gray-400 cursor-pointer" />
        </div>
      ))}

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={() => setActiveTab("Extra Services")}
          className="px-6 py-2 border rounded-lg"
        >
          Back
        </button>

<button
  onClick={() => {
    const requiredDocs = ["car", "policy", "puc"];
  const uploadedTypes = docs.map(d => d.type);


    const missing = requiredDocs.filter(t => !uploadedTypes.includes(t));

    if (missing.length) {
Swal.fire({
  toast: true,
  position: "top-end",
  icon: "warning",
  title: "Required documents missing",
  html: `
    <span style="font-size:13px;color:#6b7280">
      Please upload:
      <strong style="color:#92400e">
        ${missing.join(", ")}
      </strong>
    </span>
  `,
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: "#ffffff",
  iconColor: "#f59e0b",
  customClass: {
    popup: "shadow-lg rounded-xl border",
    title: "text-sm font-semibold text-gray-900",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});


      return;
    }

    setCompleted(c => ({ ...c, Uploads: true }));
    setActiveTab("Damages");
  }}
  className="px-8 py-3 bg-orange-500 text-white rounded-xl"
>
  Continue →
</button>


      </div>
    </div>
  );
}

function DamagesTab({ vehicleId, setActiveTab, setDraft, setCompleted, draft }) {
  const [damages, setDamages] = useState([]);
  const [open, setOpen] = useState(false);

  // ✅ RESTORE DAMAGES
  useEffect(() => {
    if (draft.damages?.length) {
      setDamages(draft.damages);
    }
  }, [draft.damages]);

  const removeDamage = (id) => {
    setDamages(prev => prev.filter(d => d.tempId !== id));
    setDraft(d => ({
      ...d,
      damages: d.damages.filter(x => x.tempId !== id),
    }));
  };

  // ❌ UI BELOW IS UNCHANGED


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Damages</h3>
          <p className="text-sm text-gray-500">Add Damages On Car</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + Add Damage
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <p className="font-medium mb-3">
          Total Damages : {damages.length}
        </p>

        <div className="space-y-3">
          {damages.map((d) => (
            <div
              key={d.tempId}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between"
            >
              <div>
                <h4 className="font-semibold">
                  {d.type}
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      d.location === "Interior"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {d.location}
                  </span>
                </h4>

                <p className="text-sm text-gray-500">
                  {d.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Trash2
                  size={16}
                  className="text-red-500 cursor-pointer"
                  onClick={() => removeDamage(d.tempId)}
                />
              </div>
            </div>
          ))}

          {!damages.length && (
            <p className="text-sm text-gray-400">
              No damages added yet
            </p>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 pt-6">
        <button
          onClick={() => setActiveTab("Uploads")}
          className="px-6 py-2 border rounded-lg"
        >
          Back
        </button>

     <button
  onClick={() => {
    setCompleted(c => ({ ...c, Damages: true }));
    setActiveTab("FAQ");
  }}
  className="px-8 py-3 bg-orange-500 text-white rounded-xl"
>
  Add FAQ →
</button>

      </div>

  {open && (
  <AddDamageModal
    vehicleId={vehicleId}
    setDamages={setDamages}
    setDraft={setDraft}   // ✅ ADD THIS LINE
    onClose={() => setOpen(false)}
  />
)}

    </div>
  );
}

function AddDamageModal({ vehicleId, setDamages, onClose, setDraft }) {
  const [form, setForm] = useState({
    location: "",
    type: "",
    description: "",
  });

  const submit = async () => {
    if (!form.location || !form.type || !form.description) {
       return Swal.fire({
         toast: true,
         position: "top-end",
         icon: "warning",
         title: "All fields are required",
         showConfirmButton: false,
         timer: 3000,
       });
      
    }

  const newDamage = {
  tempId: crypto.randomUUID(),
  location: form.location,
  type: form.type,
  description: form.description,
};


setDraft(d => ({
  ...d,
  damages: [...d.damages, newDamage]
}));

setDamages(prev => [...prev, newDamage]);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 dark:text-white w-full max-w-xl rounded-2xl p-6 relative border border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-500"
        >
          <X />
        </button>

        <h3 className="text-lg font-semibold mb-6">
          Add New Damage
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Damage Location *
            </label>
            <select
              className="w-full mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2"
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            >
              <option value="">Select</option>
              <option value="Interior">Interior</option>
              <option value="Exterior">Exterior</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Damage Type *
            </label>
            <select
              className="w-full mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2"
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="">Select</option>
              <option>Scratch</option>
              <option>Dent</option>
              <option>Crack</option>
              <option>Clip</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl"
          >
            Create New
          </button>
        </div>
      </div>
    </div>
  );
}

function FaqTab({
  vehicleId,
  setActiveTab,
  setDraft,
  finishVehicle,
  draft,
  saving,        // ✅ RECEIVE IT
}) {
const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(false);

  // ✅ RESTORE FAQS
  useEffect(() => {
    if (draft.faqs?.length) {
      setFaqs(draft.faqs);
    }
  }, [draft.faqs]);

  const removeFaq = (id) => {
    setFaqs(prev => prev.filter(f => f.tempId !== id));
    setDraft(d => ({
      ...d,
      faqs: d.faqs.filter(f => f.tempId !== id),
    }));
  };

  // ❌ UI BELOW IS UNCHANGED

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold">FAQ</h3>
          <p className="text-sm text-gray-500">Add FAQ of your Car</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + Add FAQ
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="font-medium mb-4">Total FAQ : {faqs.length}</p>

          {faqs.map(f => (
            <div key={f.tempId} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between">
            <div>
              <h4 className="font-semibold">{f.question}</h4>
              <p className="text-sm text-gray-500">{f.answer}</p>
            </div>

            <Trash2
              className="text-red-500 cursor-pointer"
              onClick={() => removeFaq(f.tempId)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setActiveTab("Damages")}
          className="px-6 py-2 border rounded-lg"
        >
          Back
        </button>
<button
  onClick={finishVehicle}
  disabled={saving}
  className={`px-10 py-3 rounded-xl font-semibold text-sm
    flex items-center justify-center gap-2
    transition-all
    ${
      saving
        ? "bg-gray-300 cursor-not-allowed"
        : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-[1.02]"
    }
  `}
>
  {saving ? "Saving..." : "Finish ✓"}
</button>





      </div>

    {open && (
  <AddFaqModal
    vehicleId={vehicleId}
    setFaqs={setFaqs}
    setDraft={setDraft}   // ✅ ADD THIS LINE
    onClose={() => setOpen(false)}
  />
)}

    </div>
  );
}
function AddFaqModal({ vehicleId, setFaqs, onClose, setDraft }) {

  const [form, setForm] = useState({ question: "", answer: "" });

  const submit = async () => {
    if (!form.question || !form.answer) { 
      return Swal.fire({
        toast: true,
        position: "top-end",  
        icon: "warning",
        title: "Both question and answer are required",
        showConfirmButton: false,
        timer: 3000,
      });
    }

const newFaq = {
  tempId: crypto.randomUUID(),
  question: form.question,
  answer: form.answer,
};


setDraft(d => ({
  ...d,
  faqs: [...d.faqs, newFaq]
}));

setFaqs(prev => [...prev, newFaq]);



    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 max-w-xl w-full p-6 rounded-2xl relative border border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-red-500">
          <X />
        </button>

        <h3 className="text-lg font-semibold mb-6 ">Create FAQ</h3>

        <Input
          label="Question *"
          value={form.question}
          onChange={e => setForm({ ...form, question: e.target.value })}
        />

        <textarea
          className="w-full border rounded-lg mt-4 px-3 py-2 bg-white dark:bg-gray-900 dark:text-white"
          rows={4}
          placeholder="Answer"
          onChange={e => setForm({ ...form, answer: e.target.value })}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
            Cancel
          </button>
          <button onClick={submit} className="px-8 py-3 bg-orange-500 text-white rounded-xl">
            Create New
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */
const Input = ({ label, value, onChange, type = "text", inputMode, error }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
      {label}
    </label>
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
className={`w-full rounded-xl px-4 py-2.5 text-sm
  border bg-white dark:bg-gray-900 dark:text-white shadow-sm
        focus:outline-none focus:ring-2 focus:ring-orange-500
${error ? "border-red-500 ring-1 ring-red-400" : "border-gray-200 dark:border-gray-700"}      `}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);


const Select = ({ label, options, value, onChange, error }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl px-4 py-2.5 text-sm
        border bg-white dark:bg-gray-900 dark:text-white shadow-sm
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
        transition
        ${error ? "border-red-500 ring-1 ring-red-400" : "border-gray-200 dark:border-gray-700"}
      `}
    >
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const YearSelect = ({ value, onChange, error }) => {
  const RANGE = 12;
  const currentYear = new Date().getFullYear();
  const initial =
    value && !isNaN(value)
      ? Math.floor(Number(value) / RANGE) * RANGE
      : Math.floor(currentYear / RANGE) * RANGE;

  const [open, setOpen] = useState(false);
  const [startYear, setStartYear] = useState(initial);
  const years = Array.from({ length: RANGE }, (_, i) => startYear + i);

  return (
    <div className="relative">
      <label className="text-sm font-medium">Year *</label>
      <div
        onClick={() => setOpen(!open)}
        className={`w-full mt-1 border rounded-lg px-3 py-2 flex justify-between cursor-pointer ${
          error ? "border-red-500" : ""
        }`}
      >
        <span>{value || "Select Year"}</span> 📅
      </div>

      {open && (
        <div className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-2 p-4 w-full">
          <div className="flex justify-between mb-3">
            <button onClick={() => setStartYear(startYear - RANGE)}>◀</button>
            <span className="font-medium">
              {startYear} – {startYear + RANGE - 1}
            </span>
            <button onClick={() => setStartYear(startYear + RANGE)}>▶</button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => {
                  onChange(String(y));
                  setOpen(false);
                }}
                className={`py-2 rounded-lg text-sm ${
                  String(value) === String(y)
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};
