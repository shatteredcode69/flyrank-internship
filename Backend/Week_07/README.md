<div align="center">
  <h1>📊 Week 7: Decision Flows & Generators</h1>
  <p><i>Building robust pipelines and artifact generation via background queues.</i></p>
</div>

---

## 🎯 Objective
Build a pipeline that queries data, renders it into a stylized PDF report, and processes the generation as a background job to avoid blocking the main API thread.

## 🏗️ Architecture
- **Artifact Handling Strategy:** The golden rule of artifact generation is applied here: *store and link, don't pass massive payloads*. The background worker generates the PDF directly to the local disk (`/reports` directory) and only updates the SQLite job queue with the lightweight file URL.
- **PDFKit Engine:** Leveraged `pdfkit` to programmatically draw headers, metadata, and dynamic text streams into the document without requiring heavy headless browsers.
- **Ingestion Server (`server.js`):** The Express app accepts the request, triggers the queue, instantly returns `202 Accepted`, and exposes the `reports` folder via `express.static()` for client downloads.
- **Defensive File System (`worker.js`):** Implemented a robust check using Node's native `fs` module to dynamically create the target `/reports` directory if it is missing (`fs.existsSync`). This self-healing logic completely prevents `ENOENT` filesystem crashes during initial artifact generation.

---

## 📸 Proof of Execution

### 1. Async Generation & Status Polling
The API returns the completed status and the safe download URL.

*(Drag and drop Screenshot 1 here)*

### 2. Generated PDF Artifact
The dynamically generated PDF accessed via the provided download URL.

*(Drag and drop Screenshot 2 here)*
*(Drag and drop Screenshot 2 here)*