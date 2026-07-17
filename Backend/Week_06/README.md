<div align="center">
  <h1>⚙️ Week 6: Asynchronous Processing & Scraping</h1>
  <p><i>Implementing the Queue/Worker model and polite data pipelines.</i></p>
</div>

---

## 📋 Week 6 Assignments Status
- [x] **Task 1: The Polite Scraper** *(Submitted)*
- [x] **Task 2: Your first background job** *(Submitted)*

---

## 🕷️ Task 1: The Polite Scraper

### 🎯 Objective
Build a robust data-gathering pipeline (fetch → parse → extract → clean → structure) that behaves like a professional bot, outputting a structured `corpus.json` ready for future RAG (Retrieval-Augmented Generation) ingestion.

### 🏗️ Architecture
- **Target:** `quotes.toscrape.com`
- **Polite Execution:** 
  - Parses and respects `robots.txt` using the `robots-parser` library.
  - Injects a custom `User-Agent` header (`FlyRankInternBot/1.0`) to identify the script to server admins.
  - Implements an asynchronous `2000ms` delay between page fetches to prevent rate-limiting and server strain.
- **Data Structuring:** Uses `cheerio` to traverse the DOM, clean special characters (like curly quotes), and output a standardized JSON array containing `text`, `author`, `tags`, and `sourceUrl`.

### 📸 Proof of Execution

**1. Polite Execution Logs (Terminal)**
<img width="1920" height="1015" alt="scarper" src="https://github.com/user-attachments/assets/714595a7-3a1f-4946-9806-2b58c3198d34" />

**2. Structured Output (`corpus.json`)**
<img width="1920" height="1028" alt="corpus" src="https://github.com/user-attachments/assets/99965c83-3e55-4b2f-b0d8-6dc3360de634" />

---

## ⏱️ Task 2: Your First Background Job

### 🎯 Objective
Move a slow, heavy operation out of the main request thread. Ensure the API endpoint answers instantly with a `202 Accepted`, delegate the task to a background worker process, and provide a polling endpoint for clients to check their job status.

### 🏗️ Architecture
- **The Queue Storage:** Leveraged SQLite as a persistent queue store (`jobs` table). This ensures jobs are not lost if the application crashes.
- **Ingestion Server (`server.js`):** A lightweight Express API that inserts a job into the database with a `pending` status and immediately frees up the connection, returning the `jobId` to the client.
- **Background Worker (`worker.js`):** A decoupled Node.js process running on a `setInterval` loop. It polls the database for `pending` jobs, locks them by updating the status to `processing`, executes a simulated heavy AI operation (8-second delay), and finally writes the payload to the `result` column.

---

### 📸 Proof of Execution

**1. Instant API Ingestion (202 Accepted)**
The server accepts the heavy request and instantly returns an acknowledgment, refusing to block the main thread.

<img width="1920" height="1018" alt="1" src="https://github.com/user-attachments/assets/cd3d364c-21bc-4d04-837b-86ac66c86100" />

**2. Status Polling & Job Completion**
After the background worker completes the simulated 8-second processing delay, querying the status endpoint retrieves the finished AI output.
<img width="1920" height="1031" alt="2" src="https://github.com/user-attachments/assets/c5416803-f9bb-497d-84f0-410e54b41fe8" />
