<div align="center">
  <h1>🐳 Week 3: Containerize Your Stack</h1>
  <p><i>Implementing Docker, Postgres, Redis, and the Repository Pattern</i></p>
</div>

---

## 🎯 Objective
Run PostgreSQL in Docker, connect the Node.js service using a repository pattern (swapping in-memory for persistent storage), and orchestrate the stack using Docker Compose.

## 🏗️ Architecture & Requirements Met
- ✅ **Docker Compose:** App, Postgres, and Redis orchestrated via a single `docker compose up -d` command.
- ✅ **Volume Persistence:** Database data is mounted and preserved via the `pgdata` volume.
- ✅ **Repository Pattern:** `repository.js` completely isolates the database logic. **The service routes remained entirely unchanged**—they continue to call `InternRepository` blindly.
- ✅ **Environment Security:** `.env` is properly gitignored, and a structural `.env.example` is committed.
- ✅ **Stretch Goal 1 (Redis):** A Redis container was added to the compose file and successfully pinged via the `/api/status` endpoint.
- ✅ **Stretch Goal 2 (SQL Indexing):** Performance profiling was conducted using `EXPLAIN ANALYZE` before and after index creation.

---

## 📸 Visual Proof of Execution

### 1. Proof of Persistence
To prove data survives container teardown, a row was inserted, the containers were destroyed (`docker compose down`), rebuilt, and the database was successfully queried again.

*(Drag and drop Screenshot 1 here: Data Insertion)*

<br>

*(Drag and drop Screenshot 2 here: Data Retrieval Post-Restart)*

---

### 2. Stretch Goal: SQL Indexing & Profiling
A query profile was generated on the `name` column before and after creating a B-Tree index (`idx_interns_name`), demonstrating standard production optimization practices.

*(Drag and drop Screenshot 3 here: Explain Analyze Output)*