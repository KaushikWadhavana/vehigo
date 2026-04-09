const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const profileRoutes = require("./routes/profileRoutes");

const firebaseAuth = require("./middleware/firebaseAuth");

const securityRoutes = require("./routes/securityRoutes");

const vehicleDetailRoutes = require("./routes/vehicleDetailRoutes");
const ownerVehicleRoutes = require("./routes/ownerVehicleRoutes");

const ownerVehicleStatusRoutes = require("./routes/ownerVehicleStatusRoutes");

const reservationRoutes = require("./routes/reservationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const ownerPaymentRoutes = require("./routes/ownerPaymentRoutes");

const ownerDashboard = require("./routes/ownerDashboard");

const app = express();

connectDB();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://vehigo-two.vercel.app"
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options("/*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Public routes (NO TOKEN REQUIRED)
app.use("/api/auth", authRoutes);

app.use("/api/profile", firebaseAuth, profileRoutes);
app.use("/api/security", firebaseAuth, securityRoutes);
app.use("/api/admin", firebaseAuth, adminRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.use("/api/listing",  require("./routes/listingRoutes"));
app.use("/api/vehicle-detail", vehicleDetailRoutes);


app.use("/api/bookings", require("./routes/bookingRoutes"));

app.use("/api/owner", require("./routes/ownerRequestRoutes"));

app.use("/api/owner", ownerVehicleRoutes);

app.use("/api/owner", ownerVehicleStatusRoutes);


app.use("/api/reservations",reservationRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/owner/payment", ownerPaymentRoutes);

app.use("/api/enquiry", require("./routes/enquiryRoutes"));


app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.use("/api/owner-dashboard", ownerDashboard);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
