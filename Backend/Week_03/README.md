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

<img width="1920" height="1005" alt="pre-restart" src="https://github.com/user-attachments/assets/d4211a1e-92a7-491e-8c62-f65989490c02" />

<br>

<img width="1920" height="1030" alt="post-restart" src="https://github.com/user-attachments/assets/f034709b-ba3d-4cf2-8bb3-b36fd872df85" />
---

### 2. Stretch Goal: SQL Indexing & Profiling
A query profile was generated on the `name` column before and after creating a B-Tree index (`idx_interns_name`), demonstrating standard production optimization practices.

<img width="1920" height="678" alt="execution sql" src="https://github.com/user-attachments/assets/e2884f70-502d-47d6-a822-4748db94dfcc" />
