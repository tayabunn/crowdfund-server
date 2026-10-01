# ⚡ CrowdFund API — Backend REST Service

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Stripe](https://img.shields.io/badge/Stripe-API-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

<p align="center">
  Scalable, TypeScript-powered REST API backend for the CrowdFund platform handling role-based authorization, campaign workflows, Stripe payment intents, withdrawals, and in-app notifications.
</p>

[🌐 Live API](https://crowdfund-server.vercel.app/) • [💻 Frontend Client](https://crowdfund-client-xi.vercel.app/) • [📡 API Endpoints](#-api-endpoints)

</div>

---

## 📌 Architecture & Modules

- **Authentication & RBAC**: JWT token generation, password hashing via Bcrypt, and strict role guards (`Admin`, `Creator`, `Supporter`).
- **Campaign Management**: CRUD operations, review approval status, funding progress, and category aggregation.
- **Credit & Financial Operations**: Stripe PaymentIntent creation, balance confirmations, and creator withdrawal processing.
- **Reporting & Notifications**: Campaign dispute handling and instant user notification updates.

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/google` — Google OAuth authentication

### 🎯 Campaigns (`/api/campaigns`)
- `GET /api/campaigns` — Fetch all approved campaigns (supports filtering & search)
- `GET /api/campaigns/top-funded` — Retrieve highest funded spotlight campaigns
- `GET /api/campaigns/:id` — Retrieve campaign details
- `POST /api/campaigns` — Create a new campaign (Creator role)
- `PATCH /api/campaigns/:id/status` — Approve or reject campaign (Admin role)
- `DELETE /api/campaigns/:id` — Delete a campaign

### 💳 Contributions & Payments (`/api/contributions`, `/api/payments`)
- `POST /api/contributions` — Fund a campaign with platform credits
- `GET /api/contributions/my-contributions` — Fetch contributor history
- `POST /api/payments/create-payment-intent` — Initialize Stripe credit checkout
- `POST /api/payments/confirm-payment` — Credit user wallet upon payment confirmation

### 💸 Withdrawals (`/api/withdrawals`)
- `POST /api/withdrawals` — Request fund withdrawal for earned credits (Creator)
- `GET /api/withdrawals/pending` — List pending payout requests (Admin)
- `PATCH /api/withdrawals/:id/approve` — Approve and process payout (Admin)

### 🔔 Notifications & Reports (`/api/notifications`, `/api/reports`)
- `GET /api/notifications` — Fetch user notification feed
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `POST /api/reports` — Report a suspicious campaign
- `GET /api/reports` — View all submitted campaign reports (Admin)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/tayabunn/crowdfund-server.git
cd crowdfund-server
npm install
```

### 2. Environment Configuration
Create a `.env` file in `crowdfund-server`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crowdfund?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
