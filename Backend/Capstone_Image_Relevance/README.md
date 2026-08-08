<div align="center">
  <h1>🖼️ Backend Capstone: Image Relevance & Auto-Tagging</h1>
  <p><i>Orchestrating Vision Models, Semantic Search, and AI Guardrails for production-grade content matching.</i></p>
</div>

---

## 🎯 Capstone Objective
To build an automated, background-processed pipeline that ingests a library of images, extracts structured tags using a Vision API, embeds descriptions into a vector space, and semantically matches images to blog posts—while enforcing a strict **Mismatch Guard** to prevent inaccurate pairings (e.g., matching a wolf image to a red fox post).

## 🏗️ System Architecture

```text
[images] ─(job)─► vision model ─► {tags, caption, confidence} ─► image_tags
                                └─► embed(caption) ───────────────► image_vectors
[posts]  ───────────────────────► embed(post text) ───────────────► post_vectors

GET /posts/:id/images ─► rank by similarity ─► mismatch guard (tags + threshold)
                      ─► {suggested | "no good match"} ─► review: approve/reject
```

## ⚙️ Core Deliverables

### 1. Batch Classification Job & Cost Tracking
Engineered a Node.js batch job (`ingest.js`) that reads the local image corpus, calls `gpt-4o-mini` to extract structured JSON tags, and calculates token execution costs per call.

### 2. Semantic Matching & Vector Spaces
Converted image captions and blog post texts into embeddings using `text-embedding-3-small`. Engineered a scoring algorithm utilizing Cosine Similarity to rank the highest mathematical matches.

### 3. The Mismatch Guard (Production Core)
Engineered a deterministic fallback layer (`server.js`). Even if an image achieves the highest semantic similarity score, the Guard explicitly checks the Vision tags against the post's target subject. If a post is about a "red fox" but the highest-scoring image is tagged as a "wolf," the system blocks the pairing with a 406 error.

---

## 📸 Proof of Execution & Demo

**1. The Test Corpus**
The local directory containing the raw animal images prior to ingestion.
<img width="1920" height="309" alt="1" src="https://github.com/user-attachments/assets/e6f94569-8467-4b0f-93f0-dc7c8a0f9ed1" />

**2. Batch Job Execution & Cost Logging**
Terminal output proving the background job ingesting the test images, successfully outputting structured tags, and tracking token costs.
<img width="1920" height="1022" alt="2" src="https://github.com/user-attachments/assets/0c1051d1-4854-4f00-a9e4-9355a3d277ea" />
**3. The Red Fox Test (Approved Match)**
cURL or Postman output showing a successful `MATCH_APPROVED` response when the system correctly pairs the fox image with the fox post.
<img width="702" height="373" alt="3" src="https://github.com/user-attachments/assets/87b34959-2c4e-42f2-ba7c-32a3178c9ffc" />

**4. The Wolf Test (Mismatch Guard Rejection)**
cURL or Postman output demonstrating the Guardrail actively rejecting a high-ranking wolf or dog image due to strict tag disagreement. *(To trigger this, temporarily delete `fox.jpg` from your DB and run the request again so the wolf becomes the highest-scoring image).*
<img width="694" height="376" alt="4" src="https://github.com/user-attachments/assets/01967c7c-f6a2-41bd-becd-ed49baee39d7" />
