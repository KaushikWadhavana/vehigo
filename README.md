# 🚗 Vehigo - Smart Vehicle Rental Platform

Vehigo is a full-stack web-based vehicle rental platform designed to digitalize and streamline the vehicle rental process. It supports both **direct booking** and a **reservation-based system with owner approval**, making it more flexible and realistic than traditional rental systems.

---

## 🌟 Overview

Vehigo connects **Users, Vehicle Owners, and Admins** into a single platform.

The system provides:
- Real-time vehicle search
- Direct booking and reservation workflow
- Secure authentication and payments
- Admin-controlled owner onboarding

---

## 🚀 Key Features

### 🔄 Dual Booking System
Vehigo supports two types of booking:

- **Direct Booking**
  - Instant booking
  - Fixed pricing
  - Immediate payment

- **Reservation System**
  - User sends request
  - Owner approves/rejects
  - User proceeds to payment

✔ Prevents conflicts  
✔ Enables owner interaction  

---

### 📩 Reservation-Based Workflow

1. User sends reservation request  
2. Owner reviews and responds  
3. User completes payment  
4. Booking is confirmed  

---

### 🔐 Owner Access System (Admin Controlled)

Users cannot directly become vehicle owners.

Process:
1. User submits owner request  
2. Admin verifies and approves  
3. User makes activation payment  
4. User becomes owner using same email  

✔ Ensures trust  
✔ Prevents fake listings  

---

### ⚠️ Conflict Handling System

- Prevents double booking  
- Reservation validation logic  
- Handles **“Too Late” cases** when vehicle already booked  

---

### 💰 Payment System

- Razorpay integration  
- Pay at pickup option  
- Security deposit included  
- Payment status tracking  

---

### 👨‍💼 Multi-Role System

#### 👤 User
- Search vehicles  
- Book or reserve vehicles  
- Make payments  

#### 🧑‍💼 Owner
- Manage vehicles  
- Approve reservation requests  
- Track bookings and earnings  

#### 🛠 Admin
- Approves owner requests  
- Manages users and vehicles  
- Monitors system activity  

---

## 🛠 Tech Stack

### Frontend
- React.js
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- Firebase Authentication

### Payment Integration
- Razorpay

### Cloud Storage
- Cloudinary

---

