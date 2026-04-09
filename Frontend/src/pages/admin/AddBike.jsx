import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import LocationPicker from "../../components/LocationPicker";
import { auth } from "../../firebase";   // ✅ ADD THIS

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



/* ================= MAIN ================= */

// ... imports stay SAME

export default function AddBike() {
  const [activeTab, setActiveTab] = useState("Basic");
const [saving, setSaving] = useState(false); // ✅ ADD HERE
const [saveStatus, setSaveStatus] = useState(null); 
 
  const navigate = useNavigate();

const [draft, setDraft] = useState({
  basic: null,
  pricing: null,
  documents: [],
  faqs: [],
});

const [completed, setCompleted] = useState({
  Basic: false,
  Pricing: false,
  Uploads: false,
  FAQ: false,
});

  const tabs = [
  { key: "Basic", icon: CheckCircle },
  { key: "Pricing", icon: DollarSign },
  { key: "Uploads", icon: Upload },
  { key: "FAQ", icon: HelpCircle },
];
const TAB_ORDER = ["Basic", "Pricing", "Uploads", "FAQ"];


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

const requiredDocs = ["rc", "policy", "puc"];
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
  fd.append("pricing", JSON.stringify(draft.pricing || {}));
fd.append("faqs", JSON.stringify(draft.faqs || []));
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
  `${import.meta.env.VITE_API_URL}/api/vehicles/bikes`,
  fd,
  {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,   // ✅ ADD THIS
    },
  }
);


    // ✅ SUCCESS (same popup transforms)
    Swal.fire({
      icon: "success",
      title: "Bike Added Successfully",
      text: "Your Bike has been saved",
      timer: 1800,
      showConfirmButton: false,
    });

    setTimeout(() => {
      navigate("/admin/add");
    }, 1800);

  } catch (err) {
    console.error(err);

    // ❌ FAIL (same popup transforms)
    Swal.fire({
      icon: "error",
      title: "Failed to Save Bike",
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

<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6 transition">        <div className="flex flex-wrap gap-3 border-b pb-4">
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
    setDraft={setDraft}
    setCompleted={setCompleted}
    setActiveTab={setActiveTab}
    draft={draft}
  />
)}


  {activeTab === "Pricing" && (
  <PricingForm
    setActiveTab={setActiveTab}
    setDraft={setDraft}
    setCompleted={setCompleted}
    draft={draft}
  />
)}

{activeTab === "Uploads" && (
  <UploadsTab
    setActiveTab={setActiveTab}
    setDraft={setDraft}
    setCompleted={setCompleted}
    draft={draft}
  />
)}



{activeTab === "FAQ" && (
  <FaqTab
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
  bikeType: "",
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

if (!form.bikeType) e.bikeType = "Required";

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
  setActiveTab("Pricing");
};


  return (
    <div className="space-y-8">
      {/* IMAGE */}
      <div>
        <h3 className="font-semibold mb-3">Featured Image *</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200  dark:bg-gray-800 flex items-center justify-center overflow-hidden">
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
          ) :key === "bikeType" ? (
  <Select
    key={key}
    label="Bike Type *"
    options={["Scooter", "Commuter", "Sports", "Cruiser"]}
    value={form.bikeType}
    error={errors.bikeType}
    onChange={(v) => setForm({ ...form, bikeType: v })}
  />
)
: (
<Input
  key={key}
  label={`${key.replace(/([A-Z])/g, " $1")} *`}
  type="text"
  inputMode={["year", "mileage"].includes(key) ? "numeric" : "text"}
  value={form[key]}
  error={errors[key]}
  onChange={(e) => {
    let value = e.target.value;

    // ✅ Allow ONLY numbers for numeric fields
    if (["year", "mileage"].includes(key)) {
      value = value.replace(/\D/g, "");
    }

    setForm({ ...form, [key]: value });
  }}
/>

          )
        )}
      </div>
{/* LOCATION PICKER */}
<div className="space-y-3">
  <h3 className="font-semibold">Select Location *</h3>

<LocationPicker
  onSelect={(location) => {
    setForm({
      ...form,
      mainLocation: location.address,
    });
  }}
/>


  {form.mainLocation && (
    <p className="text-sm text-gray-600">
      📍 {form.mainLocation}
    </p>
  )}
</div>

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
setActiveTab("Uploads");

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
          Add Uploads
        </button>
      </div>
    </div>
  );
}




function UploadsTab({ setActiveTab, setDraft, setCompleted, draft }) {
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
        {renderUploadBox("RC Book", "rc")}
        {renderUploadBox("Insurance Policy", "policy")}
        {renderUploadBox("Pollution Certificate", "puc")}
      </div>

      {/* FILE LIST */}
      {docs.map((d) => (
        <div
          key={`${d.name}-${d.type}`}

          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center gap-4 transition"
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
          onClick={() => setActiveTab("Pricing")}
          className="px-6 py-2 border rounded-lg"
        >
          Back
        </button>

<button
  onClick={() => {
    const requiredDocs = ["rc", "policy", "puc"];
  const uploadedTypes = docs.map(d => d.type);


    const missing = requiredDocs.filter(t => !uploadedTypes.includes(t));

    if (missing.length) {
      alert(
        `Please upload required documents:\n${missing.join(", ")}`
      );
      return;
    }

    setCompleted(c => ({ ...c, Uploads: true }));
    setActiveTab("FAQ");
  }}
  className="px-8 py-3 bg-orange-500 text-white rounded-xl"
>
  Continue →
</button>


      </div>
    </div>
  );
}



function FaqTab({
  
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

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
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
          onClick={() => setActiveTab("uploads")}
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
    setFaqs={setFaqs}
    setDraft={setDraft}
    onClose={() => setOpen(false)}
  />
)}

    </div>
  );
}
function AddFaqModal({  setFaqs, onClose, setDraft }) {

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
      <div className="bg-white dark:bg-gray-900 dark:text-white max-w-xl w-full p-6 rounded-2xl relative border border-gray-200 dark:border-gray-800">
        <button onClick={onClose} className="absolute top-4 right-4 text-red-500">
          <X />
        </button>

        <h3 className="text-lg font-semibold mb-6">Create FAQ</h3>

        <Input
          label="Question *"
          value={form.question}
          onChange={e => setForm({ ...form, question: e.target.value })}
        />

        <textarea
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg mt-4 px-3 py-2"
          rows={4}
          placeholder="Answer"
          onChange={e => setForm({ ...form, answer: e.target.value })}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg">
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
    {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
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
        <div className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lgmt-2 p-4 w-full">
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
