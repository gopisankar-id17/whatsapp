# WhatsApp Clone - Local Setup Guide

This project is a full-stack WhatsApp clone built with React, Fastify, Socket.io, and Neon PostgreSQL.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL Database** (A free instance from [Neon.tech](https://neon.tech) is recommended)

---

## 1. Database Setup

1. Create a free account and a new project on [Neon.tech](https://neon.tech).
2. Copy your **Database Connection String** (it should look like `postgresql://user:password@host/neondb?sslmode=require`).
3. (Optional) If you want to run the schema manually, use the SQL provided in `server/src/schema/neon-schema.sql`. Note that the server will automatically try to initialize the database and run migrations on start.

---

## 2. Server Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server/` directory and configure it:
   ```env
   # Database connection
   DATABASE_URL=your_neon_database_connection_string

   # Security
   JWT_SECRET=your_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration (Ensure ports match your setup)
   CLIENT_URL=http://localhost:3000,http://localhost:3001
   ALLOW_ALL_ORIGINS=true

   # Server Port
   PORT=3002
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3002`.

---

## 3. Client Setup

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create a `.env` file in the `client/` directory if you want to use a different API port:
   ```env
   REACT_APP_API_URL=http://localhost:3002
   ```
4. Start the React development server:
   ```bash
   npm start
   ```
   The application will usually run on `http://localhost:3000` or `http://localhost:3001`.

---

## Features & Tech Stack

- **Real-time Messaging**: Powered by Socket.io.
- **Invitations**: Send chat invites to users, which must be accepted before chatting.
- **Profile Management**: Update your name, about, and profile photo (stored as Base64 for simplicity).
- **Responsive Design**: Modern WhatsApp-like UI with dark/light mode support.
- **Database**: PostgreSQL on Neon with automatic column migrations.

---

## Troubleshooting

- **CORS Errors**: If you get a CORS error, check the `CLIENT_URL` in the `server/.env` file. It must match the URL where your React app is running.
- **Photo Upload Issues**: Profile photos are converted to Base64 on the client and stored in the database. Ensure your server's `bodyLimit` in `app.js` is high enough (set to 10MB by default).
- **Invitations**: You cannot message someone until they have accepted your invitation. Once they accept, your UI will update in real-time.
