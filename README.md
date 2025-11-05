# ✈️ Airline Reservation System

A full-stack **Airline Reservation System** built using **React (frontend)**, **Node.js + Express (backend)**, and **SQLite (database)**.  
This platform allows users to search for flights, register/login, book tickets, manage bookings, and add optional services like meals or baggage.

---

## 🚀 Live Demo

- **Frontend (React):** [https://airline-reservation-frontend.onrender.com](https://airline-reservation-system-tmm6.onrender.com)
- **Backend (Express API):** [https://airline-backend-ruzi.onrender.com](https://airline-backend-ruzi.onrender.com)

---

## 🏗️ Project Structure

Airline_Reservation/
│
├── backend/ # Express.js + SQLite backend
│ ├── models/ # Sequelize models (User, Flight, Booking, etc.)
│ ├── routes/ # REST API route definitions
│ ├── utils/ # Helper utilities (cancellation scheduler, etc.)
│ ├── server.js # Express app entry point
│ └── .env # Environment variables for backend
│
└── my-airline-app/ # React frontend (Tailwind + lucide-react icons)
├── src/
│ ├── api/ # API helper functions
│ ├── components/ # UI components
│ ├── App.jsx # Main React component
│ └── index.css # TailwindCSS setup
└── .env # Frontend API base URL config


---

## 💡 Key Features

### 🧑‍💻 User Features
- Register and log in securely with JWT authentication
- Search **domestic and international** flights
- Book up to **100 passengers per reservation**
- Add-on services: meals, baggage, hotel, travel insurance
- Manage, cancel, and view existing bookings
- Create and track support tickets

### 🖥️ Frontend
- Built with **React + TailwindCSS**
- Modern icons via **lucide-react**
- Responsive design across all devices
- Reusable components with smooth transitions

### ⚙️ Backend
- RESTful API using **Express.js**
- **Sequelize ORM** for SQLite database
- Secure password storage with **bcryptjs**
- **JWT tokens** for authentication
- Background task scheduler for flight cancellations

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, Tailwind CSS, Lucide React |
| Backend | Node.js, Express.js |
| Database | SQLite (via Sequelize ORM) |
| Authentication | JWT (JSON Web Token) |
| Deployment | Render (Frontend + Backend) |

---

## ⚙️ Local Development Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/Airline_Reservation.git
cd Airline_Reservation
