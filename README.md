# AuraNex Server (MediCare Connect Backend)

AuraNex Server is a RESTful API backend built using Node.js, Express, MongoDB, and JSON Web Tokens (JWT) to support the AuraNex medical booking and analytics platform.

## 🔗 Live Links

| Resource | URL |
|---|---|
| 🌐 Live Frontend | [https://auranex-client.vercel.app](https://auranex-client.vercel.app) |
| 🚀 Live Backend API | [https://auranex-server.vercel.app](https://auranex-server.vercel.app) |
| 💻 Frontend Repository | [https://github.com/saikot05/auranex-client](https://github.com/saikot05/auranex-client) |
| 🗄️ Backend Repository | [https://github.com/saikot05/auranex-server](https://github.com/saikot05/auranex-server) |

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Security**: JWT (jsonwebtoken), CORS (cors), dotenv env variables

## 🔒 JWT Security Architecture

The server handles authentication and authorization using a stateless token-based flow:

- **Token Generation**: `/api/auth/token` signs a JWT valid for 7 days containing user email and role credentials.
- **Token Verification**: Custom `verifyToken` middleware parses the incoming `Authorization: Bearer <token>` header, verifies the signature against the server's `JWT_SECRET`, and attaches decoded payload data to the request (`req.user`).

## 📁 Database Collections

- `appointments`: Booking entries with dates, time slots, payment indicators, and status flags.
- `payments`: Stripe transaction logs.
- `doctors`: Doctor profile details, specialty lists, pricing, and verification status.
- `slots`: Session time ranges assigned to doctors.
- `prescriptions`: Medical instructions written by doctors for specific patients.
- `user`: Patient, Doctor, and Admin registration profiles.
- `success_stories`: Public platform success metrics and stories.

## ⚙️ Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**: Create a `.env` file in the root of `auranex-server`:
   ```env
   MONGO_DB_URI=your_mongodb_connection_uri
   PORT=5000
   JWT_SECRET=your_secure_jwt_signing_key
   CLIENT_URL=https://auranex-client.vercel.app
   ```

3. **Start the API Server**:
   ```bash
   npm start
   ```

## 🌐 API Base URL

```
https://auranex-server.vercel.app
```

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | Get all verified doctors |
| GET | `/api/doctors/:id` | Get single doctor details |
| POST | `/api/appointments` | Create new appointment |
| POST | `/api/payments` | Save payment record |
| GET | `/api/admin/stats` | Admin dashboard stats |
| GET | `/api/stats/platform` | Public platform stats |
