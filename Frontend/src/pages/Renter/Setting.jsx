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
  linkWithPopup,
  updateProfile   
} from "firebase/auth";

import {
  User,
  Shield,
  Star,
  Bell,
  Plug,
  Camera,
  CheckCircle,
  Crown,
} from "lucide-react";
import UserNavbar from "../../components/UserNavbar";

export default function Setting() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState("profile");
const [googleConnected, setGoogleConnected] = useState(false);

const [ownerRequest, setOwnerRequest] = useState(null);
const [ownerEmail, setOwnerEmail] = useState("");
const [ownerInfoOpen, setOwnerInfoOpen] = useState(true);


const [payLoading, setPayLoading] = useState(false);

const [remainingTime, setRemainingTime] = useState(0);

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
        `http://localhost:5000/api/profile/${firebaseUser.uid}`,
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

useEffect(() => {
  if (!firebaseUser) return;

  const fetchOwnerRequest = async () => {
    try {
      const token = await firebaseUser.getIdToken();

      const res = await axios.get(
        "http://localhost:5000/api/owner/my-request",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOwnerRequest(res.data);

    } catch (err) {
      console.log("Owner request fetch error");
    }
  };

  fetchOwnerRequest();

}, [firebaseUser]);

useEffect(() => {
  if (!ownerRequest || ownerRequest.status !== "rejected") return;

  const rejectedAt = new Date(
    ownerRequest.rejection?.rejectedAt || ownerRequest.createdAt
  );

  const updateTime = () => {
    const diffMs = Date.now() - rejectedAt.getTime();
    const hoursPassed = diffMs / (1000 * 60 * 60);
    const remaining = Math.max(48 - hoursPassed, 0);

    setRemainingTime(remaining);
  };

  updateTime();

  const interval = setInterval(updateTime, 60000); // update every minute

  return () => clearInterval(interval);
}, [ownerRequest]);

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
      `http://localhost:5000/api/profile/${firebaseUser.uid}`,
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

  // 🔒 Prevent reconnect
  if (firebaseUser.providerData.some(p => p.providerId === "google.com")) {
    Swal.fire({
      icon: "info",
      title: "Google Already Connected",
    });
    return;
  }

  try {
    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await linkWithPopup(firebaseUser, provider);

    // ✅ Extract Google raw profile safely
    const googleProfile = result._tokenResponse?.rawUserInfo
      ? JSON.parse(result._tokenResponse.rawUserInfo)
      : null;

    const googleName =
      googleProfile?.name || result.user.displayName || "";

    const googlePhoto =
      googleProfile?.picture || result.user.photoURL || "";

    const googleEmail = result.user.email;

    // 🔒 Block different email linking
    if (googleEmail !== firebaseUser.email) {
      await result.user.unlink("google.com");

      Swal.fire({
        icon: "error",
        title: "Email Mismatch",
        text: "Google account email must match your current account email.",
      });

      return;
    }

    // ✅ IMPORTANT: Update Firebase user profile
    await updateProfile(firebaseUser, {
      displayName: googleName,
      photoURL: googlePhoto,
    });

    // 🔥 Force refresh Firebase user
    await firebaseUser.reload();

    // ✅ Update backend profile
    const token = await firebaseUser.getIdToken(true);

    const updatedProfile = await axios.put(
      `http://localhost:5000/api/profile/${firebaseUser.uid}`,
      {
        name: googleName,
        profileImage: googlePhoto,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 🔥 Update local state
    setProfile(updatedProfile.data);
    setGoogleConnected(true);

    // 🔥 Update navbar instantly
    window.dispatchEvent(new Event("profileUpdated"));

    Swal.fire({
      icon: "success",
      title: "Google Connected Successfully",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (err) {
    console.error(err);

    if (err.code === "auth/popup-closed-by-user") {
      Swal.fire({
        icon: "warning",
        title: "Google connection cancelled",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Google connection failed",
        text: err.message,
      });
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
      `http://localhost:5000/api/profile/upload-image/${firebaseUser.uid}`,
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
        `http://localhost:5000/api/security/delete/${firebaseUser.uid}`,
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
      `http://localhost:5000/api/security/deactivate/${firebaseUser.uid}`,
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
const handleOwnerRequest = async () => {
  if (ownerRequest?.status === "rejected" && remainingTime > 0) {
    return Swal.fire({
      icon: "warning",
      title: "Please wait",
      text: `You can try again after ${Math.ceil(remainingTime)} hours`,
    });
  }
  if (!ownerEmail) {
    return Swal.fire({
      icon: "warning",
      title: "Owner Email Required",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(ownerEmail)) {
    return Swal.fire({
      icon: "error",
      title: "Invalid Email Format",
    });
  }

  try {
    const token = await firebaseUser.getIdToken();

    const res = await axios.post(
      "http://localhost:5000/api/owner/request",
      { requestedEmail: ownerEmail },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    Swal.fire({
      icon: "success",
      title: "Request Submitted",
      text: res.data.message,
    });

    setOwnerEmail("");

    const refresh = await axios.get(
      "http://localhost:5000/api/owner/my-request",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setOwnerRequest(refresh.data);

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Request Failed",
      text: err.response?.data?.message || "Something went wrong",
    });
  }
};


const handleOwnerPayment = async () => {
  if (payLoading) return;

  try {
    setPayLoading(true);

    const token = await firebaseUser.getIdToken();

    const { data } = await axios.post(
      "http://localhost:5000/api/owner/payment/create-order",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SR3nZhx9Spit96",
      amount: data.amount,
      currency: data.currency,
      order_id: data.id,
      name: "Owner Activation",
      description: "Become Vehicle Owner",

      handler: async function (response) {
        try {
          await axios.post(
            "http://localhost:5000/api/owner/payment/verify",
            response,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          Swal.fire("Success", "Payment Successful", "success");
          // 🔥 REFRESH OWNER REQUEST DATA
const refresh = await axios.get(
  "http://localhost:5000/api/owner/my-request",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

setOwnerRequest(refresh.data);

        } catch (err) {
          Swal.fire("Error", "Verification Failed", "error");
        }
      },

modal: {
  ondismiss: () => {
    setPayLoading(false);
    Swal.fire({
      icon: "info",
      title: "Payment Cancelled",
    });
  },
},
      theme: { color: "#000" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    Swal.fire(
      "Error",
      err.response?.data?.message || "Payment Failed",
      "error"
    );
  } finally {
    setPayLoading(false);
  }
};


  return (
    <>
   

      <div className="bg-gray-100 min-h-screen p-8">
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


    <SidebarItem
  icon={<Star size={16} />}
  label="Owner Request"
  active={activeTab === "owner"}
  onClick={() => setActiveTab("owner")}
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

{activeTab === "owner" && (
  <div className="bg-white rounded-2xl shadow p-6 space-y-6">

    {/* ================= ACCORDION HEADER ================= */}
    <div
      onClick={() => setOwnerInfoOpen(!ownerInfoOpen)}
      className="flex items-center justify-between cursor-pointer"
    >
<h2 className="text-2xl font-bold flex items-center gap-2">
  <Crown className="text-orange-500" size={24} />
  Become a Vehicle Owner
</h2>

      <span className="text-gray-500">
        {ownerInfoOpen ? "▲" : "▼"}
      </span>
    </div>


{/* ================= EMAIL INPUT SECTION ================= */}
{ownerRequest?.status === "rejected" && (
  <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
    <p className="text-red-600 font-medium">
      Your request was rejected ❌
    </p>

    {ownerRequest?.rejection?.reason && (
      <p className="text-sm text-gray-700">
        Reason: {ownerRequest.rejection.reason}
      </p>
    )}

    {remainingTime > 0 ? (
      <p className="text-sm text-gray-600">
        You can reapply in{" "}
        <span className="font-semibold text-red-500">
          {Math.ceil(remainingTime)} hours
        </span>
      </p>
    ) : (
      <p className="text-sm text-green-600 font-medium">
        You can apply again now ✅
      </p>
    )}
  </div>
)}

{/* ✅ INPUT ONLY WHEN ALLOWED */}
{(!ownerRequest ||
  (ownerRequest.status === "rejected" && remainingTime <= 0)) && (

  <div className="space-y-4 pt-4 border-t">

    <h3 className="text-lg font-semibold">
      Submit your email to request owner access.
    </h3>

    <input
      type="email"
      placeholder="Enter owner email"
      value={ownerEmail}
      onChange={(e) => setOwnerEmail(e.target.value)}
      className="w-full border-2 border-black rounded-xl px-4 py-3 text-lg"
    />

    <button
      onClick={handleOwnerRequest}
      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium"
    >
      Request Owner Access
    </button>

  </div>
)}

{/* ================= PENDING / APPROVED MESSAGE ================= */}

{ownerRequest?.status === "pending" && (
  <div className="pt-4 border-t">
    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-xl">
      <p className="text-yellow-700 font-medium">
        Your request is currently under review.
      </p>
      <p className="text-sm text-gray-600">
        You will be notified once admin approves or rejects it.
      </p>
    </div>
  </div>
)}

{ownerRequest?.status === "approved" && (
  <div className="pt-4 border-t space-y-4">
{ownerRequest?.payment && (
  <div
    className={`p-3 rounded-xl ${
      ownerRequest.payment.status === "success"
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    <p className="font-medium">
      Payment Status: {ownerRequest.payment.status}
    </p>

    {ownerRequest.payment.paymentId && (
      <p className="text-sm">
        Payment ID: {ownerRequest.payment.paymentId}
      </p>
    )}
  </div>
)}
    {ownerRequest?.payment?.status !== "success" ? (
      <>
        <div className="bg-green-50 border border-green-300 p-4 rounded-xl">
          <p className="text-green-700 font-medium">
            Your request is approved 🎉
          </p>
          <p className="text-sm text-gray-600">
            Complete payment to activate Owner access.
          </p>
        </div>

<button
  onClick={handleOwnerPayment}
  disabled={payLoading || ownerRequest?.payment?.status === "success"}
  className={`px-6 py-3 rounded-xl text-white ${
    payLoading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
  }`}
>
  {payLoading ? "Processing..." : "Pay ₹999 & Activate Owner"}
</button>
      </>
    ) : (
      <div className="bg-green-100 border p-4 rounded-xl">
        <p className="text-green-700 font-medium">
          Payment successful ✅
        </p>
        <p className="text-sm text-gray-600">
          Logout and register using your owner email.
        </p>
      </div>
    )}

  </div>
)}
    {/* ================= DROPDOWN CONTENT ================= */}
    {ownerInfoOpen && (
      <div className="bg-gray-50 rounded-xl p-6 space-y-6 border">

        <p className="text-gray-600">
          To ensure platform quality and verified vehicle listings,
          Owner access follows a structured approval and activation process.
        </p>

        <div>
          <h3 className="font-semibold text-lg">
            Step 1 — Submit Owner Email
          </h3>
          <p className="text-gray-600 mt-1">
            Enter a new email address that will be used to create your Owner account.
            This email must not already be registered. Once submitted, your request
            will be sent for administrative review.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            Step 2 — Admin Review & Approval
          </h3>
          <p className="text-gray-600 mt-1">
            Our administrative team will review your request. Approval is required
            before proceeding to activation. You will be notified once your request
            status changes.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            Step 3 — Secure Owner Access Payment
          </h3>
          <p className="text-gray-600 mt-1">
            After approval, a secure Owner activation payment will be required.
            This confirms your commitment as a verified vehicle provider.
            The payment option will appear here once approved.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">
            Step 4 — Register as Owner
          </h3>
          <p className="text-gray-600 mt-1">
            After successful payment, you may register using the approved email.
            Your account will automatically receive Owner privileges and access
            to the Owner dashboard and vehicle management tools.
          </p>
        </div>

        {/* PAYMENT POLICY */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-700">
            Payment Failure Policy
          </h4>
          <p className="text-yellow-700 mt-1">
            If payment fails, Owner registration will be temporarily restricted.
            You may retry the payment after 48 hours.
          </p>
        </div>

      </div>
    )}



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
