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

*(Drag and drop Screenshot 1 here)*

### 2. Status Polling & Job Completion
After the background worker completes the simulated 8-second processing delay, querying the status endpoint retrieves the finished AI output.

*(Drag and drop Screenshot 2 here)*