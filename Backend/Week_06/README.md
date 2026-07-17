<div align="center">
  <h1>⚙️ Week 6: Asynchronous Processing & Background Jobs</h1>
  <p><i>Implementing the Queue/Worker model for heavy, long-running operations.</i></p>
</div>

---

## 🎯 Objective
Move a slow, heavy operation out of the main request thread. Ensure the API endpoint answers instantly with a `202 Accepted`, delegate the task to a background worker process, and provide a polling endpoint for clients to check their job status.

## 🏗️ Architecture
- **The Queue Storage:** Leveraged SQLite as a persistent queue store (`jobs` table). This ensures jobs are not lost if the application crashes.
- **Ingestion Server (`server.js`):** A lightweight Express API that inserts a job into the database with a `pending` status and immediately frees up the connection, returning the `jobId` to the client.
- **Background Worker (`worker.js`):** A decoupled Node.js process running on a `setInterval` loop. It polls the database for `pending` jobs, locks them by updating the status to `processing`, executes a simulated heavy AI operation (8-second delay), and finally writes the payload to the `result` column.

---

## 📸 Proof of Execution

### 1. Instant API Ingestion (202 Accepted)
The server accepts the heavy request and instantly returns an acknowledgment, refusing to block the main thread.

<img width="1920" height="1018" alt="1" src="https://github.com/user-attachments/assets/18a6b4ac-d9a1-40ae-8b80-47768e0719bb" />

### 2. Status Polling & Job Completion
After the background worker completes the simulated 8-second processing delay, querying the status endpoint retrieves the finished AI output.

<img width="1920" height="1031" alt="2" src="https://github.com/user-attachments/assets/83678ad4-c086-4d9c-94aa-84974c418c06" />
