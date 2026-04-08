import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

/* Public */
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserHome from "./pages/UserHome";
import Verify from "./pages/Verify";
import About from "./pages/About";
import Support from "./pages/Support";

/* Renter */
import Listing from "./pages/Renter/Listing";
import Setting from "./pages/Renter/Setting";
import VehicleDetail from "./pages/Renter/VehicleDetail";
import Booking from "./pages/Renter/Booking";
import UserEnquiries from "./pages/Renter/UserEnquiries";
import UserReview from "./pages/Renter/UserReview";
import UserBookingPayment from "./pages/Renter/UserBookingPayment";
import UserReservation from "./pages/Renter/UserReservation";

/* Admin */
import AdminLayout from "./pages/admin/components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddChoice from "./pages/admin/AddChoice";
import AddBike from "./pages/admin/AddBike";
import AddVehicle from "./pages/admin/AddVehicle";
import AdminProtectedRoute from "./components/AdminProtectedRoutes";
import AdminSetting from "./pages/admin/AdminSetting";
import OwnerRequests from "./pages/admin/OwnerRequests";
import OwnerVehicles from "./pages/admin/OwnerVehicles";
import OwnerVehicleDetail from "./pages/admin/OwnerVehicleDetail";
import AdminOwnerVehicleFullDetail from "./pages/admin/AdminOwnerVehicleFullDetail";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminOwnerPendingVehicles from "./pages/admin/AdminOwnerPendingVehicles";
import AdminVehicleReviewDetail from "./pages/admin/AdminVehicleReviewDetail";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminVehicleDetail from "./pages/admin/AdminVehicleDetail";
import AdminUserBooking from "./pages/admin/bookings/AdminUserBooking";
import AdminUserBookingVehicle from "./pages/admin/bookings/AdminUserBookingVehicle";
import AdminBookingDetail from "./pages/admin/bookings/AdminBookingDetail";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminReview from "./pages/admin/AdminReview";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminOwnerPayments from "./pages/admin/AdminOwnerPayments";
import Rentals from "./pages/admin/Rentals";
import AdminCreateReservation from "./pages/admin/reservations/AdminCreateReservation";
import AdminReservations from "./pages/admin/reservations/AdminReservations";
import AdminReservationInfo from "./pages/admin/reservations/AdminReservationInfo";
import AdminReservationPayments from "./pages/admin/reservations/AdminReservationPayments";
import AdminQuotation from "./pages/admin/reservations/AdminQuotation";
import AdminReservationAnalytics from "./pages/admin/reservations/AdminReservationAnalytics";

/* Owner */
import OwnerLayout from "./pages/Owner/components/OwnerLayout";
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import OwnerProtectedRoute from "./components/OwnerProtectedRoute";
import OwnerAddChoice from "./pages/Owner/AddChoice";
import OwnerAddBike from "./pages/Owner/AddBike";
import OwnerAddVehicle from "./pages/Owner/AddVehicle";
import OwnerSetting from "./pages/Owner/OwnerSetting"; 
import OwnerMyVehicles from "./pages/Owner/OwnerMyVehicles";
import OwnerMyVehicleDetail from "./pages/Owner/OwnerMyVehicleDetail";
import OwnerVehicleApproval from "./pages/Owner/OwnerVehicleApproval";
import CreateReservation from "./pages/Owner/CreateReservation";
import OwnerReservations from "./pages/Owner/OwnerReservations";
import UserBooking from "./pages/Owner/UserBooking";
import UserBookingVehicle from "./pages/Owner/UserBookingVehicle";
import UpdateUserBooking from "./pages/Owner/UpdateUserBooking";
import OwnerEnquiries from "./pages/Owner/OwnerEnquiries";
import OwnerReview from "./pages/Owner/OwnerReview";
import OwnerUserPayments from "./pages/Owner/OwnerUserPayments";
import OwnerQuotation from "./pages/Owner/OwnerQuotation";
import OwnerReservationInfo from "./pages/Owner/OwnerReservationInfo";
import OwnerReservationPayments from "./pages/Owner/OwnerReservationPayments";

/* Auth */
import ProtectedRoute from "./components/ProtectedRoute";

/* Navbar + Footer */
import UserNavbar from "./components/UserNavbar";
import Footer from "./components/Footer";
import Checkout from "./pages/Renter/Checkout";

/* ================= USER LAYOUT ================= */
function UserLayout() {
  return (
    <>
      <UserNavbar />
      <Outlet />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/about" element={<About />} />
        <Route path="/support" element={<Support />} />

        {/* ================= USER (WITH STABLE NAVBAR) ================= */}
        <Route
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/userhome" element={<UserHome />} />
          <Route path="/renter/setting" element={<Setting />} />
          <Route path="/listing" element={<Listing />} />
          <Route path="/listing/:id" element={<VehicleDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />

          <Route path="/bookings" element={<Booking />} />
<Route path="/enquiries" element={<UserEnquiries />} />

<Route path="/reviews" element={<UserReview />} />
<Route path="/user-payments" element={<UserBookingPayment />} />
<Route path="/reservations" element={<UserReservation />} />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
            
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="add" element={<AddChoice />} />
          <Route path="add-bike" element={<AddBike />} />
          <Route path="add-vehicle" element={<AddVehicle />} />
          <Route path="setting" element={<AdminSetting />} />
          <Route path="owner-requests" element={<OwnerRequests />} />
          <Route path="owners" element={<OwnerVehicles />} />
<Route path="owners/:ownerId" element={<OwnerVehicleDetail />} />
  <Route 
  path="owners/:ownerId/vehicle/:vehicleId" 
  element={<AdminOwnerVehicleFullDetail />} 
/>

<Route
path="/admin/owners/:ownerId/pending"
element={<AdminOwnerPendingVehicles/>}
/>
<Route
path="/admin/owners/:ownerId/review/:vehicleId"
element={<AdminVehicleReviewDetail/>}
/>

<Route path="/admin/vehicles" element={<AdminVehicles />} />

<Route path="vehicle/:vehicleId" element={<AdminVehicleDetail />} />

  <Route path="customers" element={<AdminCustomers />} />
  <Route path="user-bookings" element={<AdminUserBooking />} />

<Route path="user/:id" element={<AdminUserBookingVehicle />} />

<Route path="booking/:id" element={<AdminBookingDetail />} />

<Route path="enquiries" element={<AdminEnquiries />} />

<Route path="reviews" element={<AdminReview />} />

<Route path="payments" element={<AdminPayments />} />

<Route path="owner-payments" element={<AdminOwnerPayments />} />
 
 <Route path="/admin/rentals" element={<Rentals />} />

{/* 🔥 ADMIN RESERVATION SYSTEM */}

<Route path="reservations" element={<AdminReservations />} />

<Route path="reservations/new" element={<AdminCreateReservation />} />

<Route path="reservationinfo/:id" element={<AdminReservationInfo />} />

<Route path="reservation-payments" element={<AdminReservationPayments />} />

<Route path="quotations" element={<AdminQuotation />} />
<Route path="reservation-analytics" element={<AdminReservationAnalytics />} />

        </Route>
{/* ================= OWNER ================= */}
<Route
  path="/owner"
  element={
    <OwnerProtectedRoute>
      <OwnerLayout />
    </OwnerProtectedRoute>
  }
>
  <Route index element={<OwnerDashboard />} />

  <Route path="add" element={<OwnerAddChoice />} />
  <Route path="add-bike" element={<OwnerAddBike />} />
  <Route path="add-vehicle" element={<OwnerAddVehicle />} />

  <Route path="setting" element={<OwnerSetting />} />

  {/* OWNER VEHICLES */}
  <Route path="my-vehicles" element={<OwnerMyVehicles />} />
  <Route path="my-vehicles/:id" element={<OwnerMyVehicleDetail />} />

<Route path="vehicle-approval" element={<OwnerVehicleApproval />} />


<Route path="create" element={<CreateReservation />} />
  <Route path="reservations" element={<OwnerReservations />} />

<Route path="user-bookings" element={<UserBooking />} />

<Route path="user/:id" element={<UserBookingVehicle />} />

<Route path="booking/:id" element={<UpdateUserBooking />} />

<Route path="enquiries" element={<OwnerEnquiries />} />


<Route path="reviews" element={<OwnerReview />} />

<Route path="user-payments" element={<OwnerUserPayments />} 
/>
<Route path="quotation" element={<OwnerQuotation />} />


<Route path="reservationinfo/:id" element={<OwnerReservationInfo />} />


<Route path="reservation-payments" element={<OwnerReservationPayments />} />

</Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
