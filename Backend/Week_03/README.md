<div align="center">
  <h1>🐳 Week 3: Databases & Containers</h1>
  <p><i>Achieving data persistence with SQLite and orchestrating the stack via Docker.</i></p>
</div>

---

## 📋 Week 3 Assignments Status
- [x] **Task 1: Containerize your stack** 
- [x] **Task 2: Connecting to the database (SQLite)** 

---

## 🗄️ Task 2: Connecting to the Database (`/Task_2_SQLite`)

### 🎯 Objective
Replace the volatile in-memory array from Week 2 with a persistent, embedded SQLite database. The API layer remains entirely unchanged to the client, demonstrating the separation of concerns between business logic and the storage layer.

### 🏗️ Architecture & Storage
- **Why SQLite?** Utilized Node's native `node:sqlite` module. It is a serverless, zero-configuration database engine that writes directly to a standard disk file, removing the overhead of managing a dedicated database server daemon or C++ compilers.
- **Where is the data stored?** The database is stored locally inside the project directory as a flat file named `tasks.db`.
- **Automatic Schema Migration:** Upon initialization, the server checks if the `tasks` table exists. If it does not, it automatically runs the `CREATE TABLE` execution and seeds the database with three default tasks.

### 📸 Proof of Execution

**1. Server Initialization & Listening Log**
The terminal output demonstrating the automatic database seeding and successful server boot.

<img width="1671" height="522" alt="1" src="https://github.com/user-attachments/assets/3c4e7ec2-7a82-4707-867d-90d0b1fa5522" />

**2. API Persistence Verification (cURL)**
Executing standard HTTP requests to verify the API interacts properly with the new SQLite storage layer.

<img width="1849" height="944" alt="api" src="https://github.com/user-attachments/assets/a65a1a3a-7457-4980-922e-f52b2a67bfc5" />

**3. Direct SQL Execution**
Executing manual SQL queries inside an SQLite Viewer to verify data integrity and complete Stage 4 requirements. Example query executed:
```sql
SELECT * FROM tasks;
```

<img width="1920" height="988" alt="db" src="https://github.com/user-attachments/assets/609cbc59-2d0b-4e42-88a6-c828f231f420" />
---

## 🐳 Task 1: Containerize Your Stack (`/Task_1_Docker`)

### 🎯 Objective
Wrap the Node.js application inside an isolated Docker container to eliminate the "it works on my machine" problem, ensuring identical execution environments across local development and production deployments.

### 🏗️ Docker Architecture
- Created a lightweight `Dockerfile` utilizing the `node:18-alpine` base image to minimize surface area and image size.
- Exposed port `3000` to allow local host machine networking to route into the isolated container instance.
- Orchestrated the build and run process using a streamlined container pipeline.

### 📸 Proof of Execution

### 1. Proof of Persistence
To prove data survives container teardown, a row was inserted, the containers were destroyed (`docker compose down`), rebuilt, and the database was successfully queried again.

<img width="1920" height="1005" alt="pre-restart" src="https://github.com/user-attachments/assets/d4211a1e-92a7-491e-8c62-f65989490c02" />

<br>

<img width="1920" height="1030" alt="post-restart" src="https://github.com/user-attachments/assets/f034709b-ba3d-4cf2-8bb3-b36fd872df85" />
---

### 2. Stretch Goal: SQL Indexing & Profiling
A query profile was generated on the `name` column before and after creating a B-Tree index (`idx_interns_name`), demonstrating standard production optimization practices.

<img width="1920" height="678" alt="execution sql" src="https://github.com/user-attachments/assets/e2884f70-502d-47d6-a822-4748db94dfcc" />
