# HappyValley 🏔️

A comprehensive and scalable enterprise-grade backend system for managing services, bookings, and subscriptions. Built with Node.js, Express, and TypeScript, it features a modular architecture designed for high performance and maintainability.

---

## 🚀 Overview

Happy Valley is a robust service management platform that handles everything from user authentication and subscription plans to real-time notifications and automated task scheduling.

## 🌟 Key Features

### 🔐 Authentication & Security
- **JWT Authentication**: Secure stateless authentication.
- **Social Login**: Integrated with **Google** and **Facebook** via Passport.js.
- **Role-Based Access Control**: Granular permissions for Users and Admins.
- **Security**: Rate limiting, Bcrypt password hashing, and Zod input validation.

### 💳 Payments & Subscriptions
- **Stripe Integration**: Full support for one-time payments and recurring subscriptions.
- **Flexible Plans**: Manage multiple subscription tiers (`plan` module).
- **Invoicing**: Automated billing and payment tracking.

### 📅 Booking & Service Management
- **Modular Services**: Create and manage various service offerings.
- **Availability Tracking**: Real-time staff and resource availability management.
- **Booking Flow**: Seamless appointment booking with status tracking.

### 🛰️ Real-time & Communications
- **Socket.io**: Real-time bidirectional communication for live updates.
- **Firebase Cloud Messaging**: Push notifications for mobile and web.
- **Email Services**: Automated transactional emails using Nodemailer (SMTP).
- **SMS/OTP**: Phone verification and alerts via **Twilio**.

### 🛠️ Infrastructure & Tools
- **Cloud Storage**: Multi-provider support (AWS S3 and Cloudinary) for media and documents.
- **Job Queues**: Background task processing using **BullMQ** (Redis backed).
- **Scheduling**: Automated tasks with `node-cron`.
- **AI Integration**: Powered by **OpenAI** for intelligent features.

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Validation**: Zod
- **Documentation**: Swagger API Docs
- **Caching/Queue**: Redis (BullMQ)

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── modules/          # Business logic (Auth, User, Booking, Payment, etc.)
│   ├── middlewares/      # Global express middlewares (Auth, Error)
│   └── utils/            # Helper functions and shared utilities
├── config/               # Environment and external service configurations
├── routes/               # Centralized route definitions
├── enum/                 # Shared TypeScript enums
├── interfaces/           # Shared types and interfaces
├── helpers/              # Application-wide utility helpers
├── server.ts             # Entry point
└── app.ts                # Express app initialization
```

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (Local or Atlas)
- **Redis** (Required for BullMQ)
- **Yarn** or **NPM**

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd happyValley
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Update the .env file with your credentials (MongoDB, Stripe, AWS, etc.)
   ```

4. **Develop:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm run start:prod
   ```

---

## 📝 Available Scripts

- `npm run dev`: Start development server with hot-reload.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm run lint:check`: Run ESLint to identify issues.
- `npm run lint:fix`: Automatically fix ESLint issues.
- `npm run prettier:fix`: Format code with Prettier.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Made with ❤️ by Asaduzzaman
