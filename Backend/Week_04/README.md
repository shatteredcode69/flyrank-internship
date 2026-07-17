<div align="center">
  <h1>🔐 Week 4: Authentication</h1>
  <p><i>Implementing secure JWT-based login and password hashing.</i></p>
</div>

---

## 📋 Week 4 Assignments Status
- [ ] **Task: Auth - Login & Protect** *(Lead review pending)*

---

## 🛡️ Task: Authentication & Protected Routes

### 🎯 Objective
Add real authentication to the service: users register and log in (with hashed passwords), and implement a protected route that answers only for authenticated users, yielding honest 401/403 responses otherwise.

### 🏗️ Architecture & The SQLite Pivot
- **The Repository Pattern in Action:** To demonstrate true separation of concerns, I completely swapped out the heavy PostgreSQL container from Week 2 for a lightweight, serverless **SQLite** embedded database. Because the database logic is isolated in `repository.js`, **I achieved this major infrastructure change without modifying a single line of code in the API routes or middleware.**
- **Password Security:** Passwords are salted and hashed using `bcrypt` (cost factor 10) before hitting SQLite.
- **Stateless Authentication:** JSON Web Tokens (JWT) are issued upon successful login, eliminating the need for server-side session memory.
- **Middleware Guardrails:** `authMiddleware.js` intercepts requests to `/api/protected/*`, verifying the token signature.

---

### 📸 Proof of Execution

**1. Guarding the Route (401 Unauthorized)**
Attempting to hit the dashboard without a valid bearer token correctly yields a 401 error.

<img width="1920" height="1023" alt="401 error" src="https://github.com/user-attachments/assets/45707cc2-65a6-4ad6-8427-365a3e250054" />

<br>

**2. Successful Login & Protected Access**
After registering and logging in, the provided JWT successfully grants access to the dashboard, extracting the user's tenant ID from the token payload.

<img width="1920" height="1033" alt="welcome" src="https://github.com/user-attachments/assets/d33894e5-a4c1-45c4-92dd-6cef6b1c0bfc" />
