import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { auth } from "../../firebase";
import { onAuthStateChanged,  updatePassword,
  sendEmailVerification,
  signOut,
 } from "firebase/auth";
 import {
  GoogleAuthProvider,
  linkWithPopup
} from "firebase/auth";

import {
  User,
  Shield,
  Star,
  Bell,
  Plug,
  Camera,
  CheckCircle,
} from "lucide-react";

export default function Setting() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState("profile");
const [googleConnected, setGoogleConnected] = useState(false);

useEffect(() => {
  if (!firebaseUser) return;

  const connected = firebaseUser.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  setGoogleConnected(connected);

}, [firebaseUser]);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  /* ================= FETCH PROFILE ================= */
useEffect(() => {
  if (!firebaseUser) return;

  const fetchData = async () => {
    try {
      const token = await firebaseUser.getIdToken();

      const profileRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/profile/${firebaseUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(profileRes.data);

      setLoading(false);

    } catch (err) {
      console.log("Error fetching data:", err.response?.data || err.message);
    }
  };

  fetchData();
}, [firebaseUser]);
  if (loading) return <div className="p-10">Loading...</div>;

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  /* ================= SAVE PROFILE ================= */
const handleSave = async () => {
  if (!firebaseUser) return;
// ✅ PHONE VALIDATION
if (!/^[0-9]{10}$/.test(profile.phone)) {
  Swal.fire({
    icon: "error",
    title: "Invalid Phone Number",
    text: "Phone number must be exactly 10 digits",
  });
  return;
}

  try {
    const token = await firebaseUser.getIdToken();

    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/profile/${firebaseUser.uid}`,
      profile,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProfile(res.data);

    // 🔥 update navbar instantly
    window.dispatchEvent(new Event("profileUpdated"));

    Swal.fire({
      icon: "success",
      title: "Profile Updated Successfully",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (err) {
    console.error("Update error:", err);

    Swal.fire({
      icon: "error",
      title: err.response?.data?.message || err.message || "Update Failed",
    });
  }
};

const handleConnectGoogle = async () => {
  if (!firebaseUser) return;

  try {
    const provider = new GoogleAuthProvider();

    const result = await linkWithPopup(firebaseUser, provider);

    // 🔥 Force reload updated provider data
    await result.user.reload();

    setGoogleConnected(true); // immediate UI update

    Swal.fire({
      icon: "success",
      title: "Google Connected Successfully",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (err) {
    if (err.code === "auth/provider-already-linked") {
      setGoogleConnected(true);
      Swal.fire("Already connected to Google");
    } else {
      Swal.fire("Error", err.message, "error");
    }
  }
};


  /* ================= IMAGE UPLOAD ================= */
const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try {
    const token = await firebaseUser.getIdToken();

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/profile/upload-image/${firebaseUser.uid}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProfile(res.data);
    window.dispatchEvent(new Event("profileUpdated"));

    Swal.fire({
      icon: "success",
      title: "Profile Image Updated",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: err.response?.data?.message || "Upload Failed",
    });
  }
};

const randomAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${
  profile.name || firebaseUser?.email || "User"
}`;

const displayImage =
  profile.profileImage ||
  firebaseUser?.photoURL ||
  randomAvatar;

    const handleChangePassword = async () => {
  const { value } = await Swal.fire({
    title: "New Password",
    input: "password",
    showCancelButton: true,
  });

  if (value) {
    await updatePassword(firebaseUser, value);
    Swal.fire("Password Updated", "", "success");
  }
};

const handleVerifyEmail = async () => {
  await sendEmailVerification(firebaseUser);
  Swal.fire("Verification Email Sent");
};


const handleDeleteAccount = async () => {
  const confirm = await Swal.fire({
    title: "Delete Account?",
    text: "This action cannot be undone",
    icon: "warning",
    showCancelButton: true,
  });

  if (confirm.isConfirmed) {
    try {
      const token = await firebaseUser.getIdToken();

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/security/delete/${firebaseUser.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await signOut(auth);

      await Swal.fire("Deleted!", "Account removed", "success");

      window.location.href = "/";

    } catch (err) {
      Swal.fire("Error", err.response?.data?.message, "error");
    }
  }
};


const handleDeactivate = async () => {
  const confirm = await Swal.fire({
    title: "Deactivate Account?",
    text: "You can reactivate later by logging in.",
    icon: "warning",
    showCancelButton: true,
  });

  if (!confirm.isConfirmed) return;

  try {
    const token = await firebaseUser.getIdToken();

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/security/deactivate/${firebaseUser.uid}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    await signOut(auth);

    await Swal.fire("Account Deactivated");

    window.location.href = "/";

  } catch (err) {
    Swal.fire("Error", err.response?.data?.message, "error");
  }
};

const isGoogleConnected = firebaseUser?.providerData?.some(
  (provider) => provider.providerId === "google.com"
);

  return (
    <>

<div id="admin-content" className="pt-20 p-8 bg-gray-100 min-h-screen">
       <div className="max-w-7xl mx-auto">

          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <div className="grid md:grid-cols-4 gap-8">

        {/* ================= LEFT SIDEBAR ================= */}
<div className="bg-white rounded-lg shadow-sm p-4 h-fit">

  <p className="text-xs font-semibold text-gray-400 uppercase mb-4">
    Account Setting
  </p>

  <div className="space-y-1">

    <SidebarItem
      icon={<User size={16} />}
      label="Profile"
      active={activeTab === "profile"}
      onClick={() => setActiveTab("profile")}
    />

    <SidebarItem
      icon={<Shield size={16} />}
      label="Security"
      active={activeTab === "security"}
      onClick={() => setActiveTab("security")}
    />


  </div>
</div>

            {/* ================= RIGHT CONTENT ================= */}
            <div className="md:col-span-3 space-y-8">
  {activeTab === "profile" && (
    <>

              {/* BASIC INFORMATION */}
              <div className="bg-white rounded-xl shadow">

                <div className="border-b px-6 py-4">
                  <h2 className="text-lg font-semibold">
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Information about user
                  </p>
                </div>

                <div className="p-6 space-y-6">

                  {/* PROFILE IMAGE */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
             <img
  src={displayImage}
  onError={(e) => {
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=Fallback`;
  }}
  alt="Profile"
                        className="w-24 h-24 rounded-lg object-cover"
                      />

                      <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
                        <input
                          type="file"
                          hidden
                          onChange={handleImageChange}
                        />
                        <Camera size={16} />
                      </label>
                    </div>

                    <div>
                      <h3 className="font-medium">
                        Profile picture
                      </h3>
                      <p className="text-sm text-gray-500">
                        PNG, JPEG under 15 MB
                      </p>
                    </div>
                  </div>

                  {/* NAME */}
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <input
                      name="name"
                      value={profile.name || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-2 mt-1"
                      placeholder="Enter Name"
                    />
                  </div>

                  {/* PHONE */}
                  <div>
                    <label className="text-sm font-medium">Phone *</label>
                 <input
  name="phone"
  type="tel"
  maxLength={10}
  pattern="[0-9]{10}"
  value={profile.phone || ""}
  onChange={(e) => {
    const onlyNumbers = e.target.value.replace(/\D/g, "");
    setProfile({ ...profile, phone: onlyNumbers });
  }}
  className="w-full border rounded-lg px-4 py-2 mt-1"
  placeholder="Enter 10 digit phone"
/>

                  </div>

                  {/* EMAIL (READ ONLY) */}
                  <div>
                    <label className="text-sm font-medium">Email *</label>
                    <input
                      value={profile.email || ""}
                      readOnly
                      className="w-full border rounded-lg px-4 py-2 mt-1 bg-gray-100"
                    />
                  </div>

                </div>
              </div>

              {/* ADDRESS INFORMATION */}
              <div className="bg-white rounded-xl shadow">

                <div className="border-b px-6 py-4">
                  <h2 className="text-lg font-semibold">
                    Address Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Information about address of user
                  </p>
                </div>

                <div className="p-6 space-y-6">

                  <div>
                    <label className="text-sm font-medium">Address *</label>
                    <textarea
                      name="addressLine"
                      value={profile.addressLine || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-2 mt-1 h-28"
                      placeholder="Enter Address"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Country *</label>
                      <input
                        name="country"
                        value={profile.country || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2 mt-1"
                        placeholder="Enter Country"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">State *</label>
                      <input
                        name="state"
                        value={profile.state || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2 mt-1"
                        placeholder="Enter State"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">City *</label>
                      <input
                        name="city"
                        value={profile.city || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2 mt-1"
                        placeholder="Enter City"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Pincode *</label>
                      <input
                        name="pinCode"
                        value={profile.pinCode || ""}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-4 py-2 mt-1"
                        placeholder="Enter Pincode"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-4">
                <button className="px-6 py-2 bg-black text-white rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-orange-400 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
</>
              )}

      {/* ================= SECURITY TAB ================= */}
  {activeTab === "security" && (
    <div className="bg-white rounded-xl shadow p-6 space-y-6">

      {/* PASSWORD */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <div>
          <h3 className="font-medium">Password</h3>
          <p className="text-sm text-gray-500">
            Set a unique password to secure account
          </p>
        </div>
        <button
          onClick={handleChangePassword}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg"
        >
          Change
        </button>
      </div>

{/* GOOGLE AUTH */}
<div className="flex justify-between items-center border rounded-lg p-4">
  <div>
    <h3 className="font-medium">Google Authentication</h3>
    <p className="text-sm text-gray-500">
      Connect your account to Google
    </p>
  </div>

  {googleConnected ? (
    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-600">
      ● Connected
    </span>
  ) : (
    <button
      onClick={handleConnectGoogle}
      className="px-4 py-2 bg-gray-900 text-white rounded-lg"
    >
      Connect
    </button>
  )}
</div>



      {/* EMAIL VERIFICATION */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <div>
          <h3 className="font-medium">Email Verification</h3>
          <p className="text-sm text-gray-500">
            {firebaseUser?.email}
          </p>
        </div>

        {firebaseUser?.emailVerified ? (
          <span className="flex items-center text-green-600 gap-1">
            <CheckCircle size={16} /> Verified
          </span>
        ) : (
          <button
            onClick={handleVerifyEmail}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Verify
          </button>
        )}
      </div>

 
      {/* DEACTIVATE */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <h3 className="font-medium">Deactivate Account</h3>
        <button
          onClick={handleDeactivate}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg"
        >
          Deactivate
        </button>
      </div>

      {/* DELETE */}
      <div className="flex justify-between items-center border rounded-lg p-4">
        <h3 className="text-red-600 font-medium">
          Delete Account
        </h3>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Delete
        </button>
      </div>

    </div>
  )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
