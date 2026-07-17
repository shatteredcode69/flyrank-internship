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

<img width="1920" height="1023" alt="1" src="https://github.com/user-attachments/assets/1fe26c1f-221f-40fd-958d-4fbc38337a95" />

### 2. Generated PDF Artifact
The dynamically generated PDF accessed via the provided download URL.

<img width="1920" height="1033" alt="2" src="https://github.com/user-attachments/assets/de71943f-657b-48e1-b591-a279629f1500" />
<img width="1920" height="1080" alt="3" src="https://github.com/user-attachments/assets/3fa31a2b-93d2-499a-8e22-c922b02e9f50" />
