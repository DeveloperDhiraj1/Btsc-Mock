# BTSC & Competitive Technical Exams - AI Mock Platform

An enterprise-grade, highly scalable, and secure AI-Powered MERN Online Mock Test SaaS Platform built specifically for competitive technical and state-government exams (BTSC JE, SSC JE, Railway RRB, BPSC AE, Polytechnic Entrance).

## 🚀 Key Features

* **AI Exam Constructor (Gemini AI):** Automated generation of highly specific technical MCQs, topic notes sheets, and step-by-step wrong answer solution walkthroughs.
* **Proctored Anti-Cheating System:** Active visibility tab-switch tracking, right-click locking, clipboard blocking, and automated exam submits on violation thresholds.
* **Real-time boards (Socket.io):** Top list rankings updated instantly using WebSocket broadcasts.
* **Premium Billing (Razorpay):** Direct gateway support for mock packages purchases.
* **Fail-Safe Caching (Redis):** Caching architecture featuring dynamic in-memory fallback queues for offline operation.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Tailwind CSS, Redux Toolkit, Framer Motion, Recharts, React Hook Form
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, BullMQ, Winston Logger
* **AI:** Google Gemini API
* **Caching & Queue:** Redis, BullMQ
* **Documentation & Build:** Swagger UI OpenAPI, Docker, GitHub Actions CI/CD

---

## 📦 Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Question, Test, Payments, AI Controllers
│   │   ├── routes/           # Routing nodes
│   │   ├── models/           # Mongoose schemas (User, Question, Test, Result, Subscription)
│   │   ├── middlewares/      # Security guards, Auth & error handlers
│   │   ├── services/         # Gemini, NodeMailer, Multer, Cloudinary, Redis clients
│   │   ├── jobs/             # BullMQ task queues & workers
│   │   └── docs/             # Swagger spec
│   ├── server.js             # Express startup file
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components (ToastContainer)
│   │   ├── layouts/          # Dashboard layouts
│   │   ├── pages/            # View pages (Dashboard, MockTestInterface, ResultPage, etc.)
│   │   ├── store/            # Redux store & state slices
│   │   └── services/         # Axios client configurations
│   ├── index.html
│   └── Dockerfile
└── docker-compose.yml
```

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisite Installations
* Node.js (v18+)
* MongoDB & Redis (Optional - falls back to memory mocks if offline)

### 2. Setup Environment Variables
Initialize variables inside `backend/.env.development`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/btsc_mock
JWT_SECRET=super_secret_jwt_access_key_123!@#
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_456!@#
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
USE_GEMINI_MOCK=true
USE_REDIS_MOCK=true
USE_CLOUDINARY_MOCK=true
USE_EMAIL_MOCK=true
USE_RAZORPAY_MOCK=true
```

For Firebase on the frontend, copy `frontend/.env.example` to `frontend/.env` and fill these values from your Firebase project settings:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

To enable Google sign-in, turn on Google as a provider in Firebase Authentication and add the same web API key to the backend environment:

```env
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
```

### 3. Spin up services

**Run using Docker Compose:**
```bash
docker-compose up --build
```

**Run manually:**

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit the app at `http://localhost:5173`. Login with mock credentials (or register a mock profile and verify with any 6-digit OTP code).

---

## 🧪 Testing

To run backend validation suites:
```bash
cd backend
npm test
```

## Environment Setup

Copy the example environment files and update with your own secrets:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local development, use the mock toggle variables to avoid requiring third-party services immediately:

```env
USE_GEMINI_MOCK=true
USE_REDIS_MOCK=true
USE_CLOUDINARY_MOCK=true
USE_EMAIL_MOCK=true
USE_RAZORPAY_MOCK=true
```

## Deployment Notes

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`
- Docker Compose starts MongoDB, Redis, backend, and frontend together
- Swagger documentation is available at `http://localhost:5000/api-docs`

## Features Included

- Full JWT auth with refresh token flow
- Admin and student role-based APIs
- AI-powered question generation, mock creation, notes, and explanations
- Redis caching with in-memory fallback
- BullMQ background jobs for email, CSV import, AI generation, and analytics
- Socket.io real-time leaderboard updates
- Razorpay payment checkout and subscription activation
- Cloudinary file upload support
- Swagger/OpenAPI API docs
- Docker + Docker Compose support
- GitHub Actions CI for backend and frontend validation

---

## ☁️ Deployment Guide

### Backend (Render / Heroku)
1. Link your GitHub repository.
2. Setup environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.) inside the Render dashboard.
3. Configure:
   * **Build Command:** `cd backend && npm install`
   * **Start Command:** `cd backend && npm start`

### Frontend (Vercel)
1. Configure project target folder: `./frontend`.
2. Add environment config: `VITE_API_URL` matching your Render domain address.
3. Deploy! Vercel handles configuration routing automatically.
