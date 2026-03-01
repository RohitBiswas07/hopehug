# HopeHug

A transparent donation platform powered by Mitali Foundation.

Donors can contribute to verified causes, track exactly how their money is used, and receive real-time updates as NGOs upload proof of work.

🌐 **Live:** [hopehug-production.up.railway.app](https://hopehug-production.up.railway.app)

---

## Features

- Donor registration and login
- Browse and donate to active causes via UPI QR
- Upload payment screenshot and UTR ID as proof
- Admin verifies each donation manually
- Real-time donation status tracking for donors
- NGO panel to manage causes and upload fund utilization proof
- Admin dashboard for platform management
- All images stored in MongoDB (no filesystem dependency)

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Framer Motion  
**Backend:** Node.js, Express  
**Database:** MongoDB Atlas  
**Hosting:** Railway (monolithic deployment)  
**Auth:** JWT (role-based: donor, ngo, admin)  
**Real-time:** Socket.io  
**Email:** Nodemailer  

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Git

### Clone the repository

```bash
git clone https://github.com/RohitBiswas07/hopehug.git
cd hopehug
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
HopeHug/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── index.html
├── package.json
└── README.md
```

---

## Deployment

This project is deployed as a **monolithic app on Railway**. The backend serves the React frontend build and handles all API routes.

**Railway Environment Variables:**
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT secret key
- `EMAIL_USER` — Email for sending notifications
- `EMAIL_PASS` — Email app password

---

## Environment Variables

Never commit your `.env` file. Create it manually using the format above.

---

## License

This project is built for educational and social impact purposes.  
Powered by Mitali Foundation.
