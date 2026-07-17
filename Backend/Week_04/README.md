<div align="center">
  <h1>🔐 Week 4: Authentication & Data Scraping</h1>
  <p><i>Implementing secure JWT-based login and robust, polite data pipelines.</i></p>
</div>

---

## 📋 Week 4 Assignments Status
- [x] **Task 1: Auth - Login & Protect** - [x] **Task 2: The Polite Scraper** ---

## 🛡️ Task 1: Authentication & Protected Routes

### 🎯 Objective
Add real authentication to the service: users register and log in (with hashed passwords), and implement a protected route that answers only for authenticated users, yielding honest 401/403 responses otherwise.

### 🏗️ Architecture & The SQLite Pivot
- **The Repository Pattern in Action:** To demonstrate true separation of concerns, I swapped the PostgreSQL container for a lightweight, serverless **SQLite** embedded database. Because the database logic is isolated in `repository.js`, I achieved this infrastructure change without modifying a single line of code in the API routes.
- **Password Security:** Passwords are salted and hashed using `bcrypt` before hitting SQLite.
- **Stateless Authentication:** JSON Web Tokens (JWT) are issued upon successful login.
- **Middleware Guardrails:** `authMiddleware.js` intercepts requests to `/api/protected/*`, verifying the token signature.

### 📸 Proof of Execution (Task 1)

**1. Guarding the Route (401 Unauthorized)**
<img width="1920" height="1023" alt="401 error" src="https://github.com/user-attachments/assets/fc415370-77bd-4a0b-9e6e-98671352582b" />

**2. Successful Login & Protected Access**
<img width="1920" height="1033" alt="welcome" src="https://github.com/user-attachments/assets/fb6c0fd8-9469-444c-af41-a6e0ba0df22c" />

---

## 🕷️ Task 2: The Polite Scraper

### 🎯 Objective
Build a robust data-gathering pipeline (fetch → parse → extract → clean → structure) that behaves like a professional bot, outputting a structured `corpus.json` ready for future RAG (Retrieval-Augmented Generation) ingestion.

### 🏗️ Architecture
- **Target:** `quotes.toscrape.com`
- **Polite Execution:** - Parses and respects `robots.txt` using the `robots-parser` library.
  - Injects a custom `User-Agent` header (`FlyRankInternBot/1.0`) to identify the script to server admins.
  - Implements an asynchronous `2000ms` delay between page fetches to prevent rate-limiting and server strain.
- **Data Structuring:** Uses `cheerio` to traverse the DOM, clean special characters (like curly quotes), and output a standardized JSON array containing `text`, `author`, `tags`, and `sourceUrl`.

### 📸 Proof of Execution (Task 2)

**1. Polite Execution Logs (Terminal)**
<img width="1920" height="1015" alt="scarper" src="https://github.com/user-attachments/assets/0283ca1a-ff91-4d69-a012-0ffe9f81a7e5" />

**2. Structured Output (`corpus.json`)**
<img width="1920" height="1028" alt="corpus" src="https://github.com/user-attachments/assets/53d32544-b03e-4643-aa7d-426d91caea36" />
