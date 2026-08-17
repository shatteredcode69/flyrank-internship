<div align="center">
  <h1>📸 Backend Capstone: Image Relevance & Auto-Tagging Engine</h1>
  <p><i>Automated ingestion, LLM vision tagging, and async processing for digital media.</i></p>

  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=OpenAI&logoColor=white" alt="OpenAI" />
</div>

---

## 📌 Project Overview

This repository contains my final project for the **FlyRank Backend AI Engineering Track**.

**The Problem:** Manually tagging and cataloging massive libraries of user-uploaded images is slow, expensive, and unscalable.

**The Solution:** This backend engine accepts image URLs via a secured REST API, instantly queues them as a background job, and utilizes Vision LLMs to autonomously extract semantic tags and save them to a persistent local database.

*This project was built entirely using free tools and local test environments.*

---

## 🏗️ The Core Concepts

This system was built to demonstrate proficiency in 5 core backend engineering concepts from the FlyRank program.

| Concept | Implementation Details & Code Location |
| :--- | :--- |
| **API Endpoints** | RESTful routes (`/routes/imageRoutes.js`) for ingestion and querying, returning strict 200/400/500 HTTP status codes. |
| **Database** | SQLite persistence (`/db/database.js`) to store image URLs, processing status, and final JSON tags locally. |
| **Authentication** | JWT-based login (`/controllers/authController.js`). Protected routes reject requests missing a valid Bearer token. |
| **Background Jobs** | Inngest orchestration (`/jobs/taggingJob.js`) offloads the slow LLM vision requests from the main thread. |
| **LLM Integration** | OpenAI Vision API (`/services/aiService.js`) handles the narrow AI task of generating contextual tags. |

---

## 🚀 How to Run It (Setup Steps)

This project is designed to be fully runnable by a stranger locally using pure Node.js.

### Prerequisites

- **Node.js** (v18 or higher) installed on your machine.
- An **OpenAI API key** (for vision processing).

### Step 1: Clone and Install

```bash
git clone https://github.com/shatteredcode69/image-tagging-engine.git
cd image-tagging-engine
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory. Never commit secrets to Git.

```
PORT=3000
JWT_SECRET=super_secret_test_key_123
OPENAI_API_KEY=your_openai_key_here
```

### Step 3: Start the Server

```bash
npm run dev
```

### Step 4: Run the 5-Minute Demo Path

Follow these steps to see the walking skeleton run end-to-end:

**1. Authenticate (POST)**

Get your access token by logging in with the default seeded admin credentials.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

Copy the returned JWT token.

**2. Submit an Image (POST)**

Send an image to the ingestion endpoint using your token.

```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/sample-server-rack.jpg"}'
```

**3. Observe the Background Job**

Look at your terminal running the Node server. You will see the Inngest worker pick up the job, send the URL to the LLM, and log a 200 OK when the tags are successfully parsed.

**4. Retrieve the Results (GET)**

Fetch the database entry to see the automatically generated tags.

```bash
curl http://localhost:3000/api/images \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Output:**

```json
[
  {
    "id": 1,
    "url": "https://example.com/sample-server-rack.jpg",
    "status": "completed",
    "tags": ["datacenter", "server rack", "cloud computing", "networking hardware"]
  }
]
```

---

## 🔮 Future Ideas (Non-Goals)

To maintain a realistic scope, the following features were explicitly defined as non-goals for this version:

- A frontend React gallery interface.
- AWS S3 direct file uploading (the system currently relies on URL ingestion).
