<div align="center">
  <h1>🛠️ Week 2: Build Your First CRUD API</h1>
  <p><i>A foundational RESTful API built with Node.js and Express, featuring in-memory data storage and Swagger UI documentation.</i></p>
</div>

---

## 🎯 About This API
This is a lightweight Task Management API built to demonstrate the core mechanics of the HTTP request/response cycle. It supports full CRUD operations, strict input validation, correct HTTP status codes, and interactive API documentation.

## 🚀 How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the server:**
   ```bash
   node server.js
   ```
3. **Access the API:** The server runs on `http://localhost:3000`. 
4. **Access Swagger UI:** Navigate to `http://localhost:3000/docs` in your browser.

## 🚪 Endpoints

| CRUD Operation | HTTP Method | Endpoint | Description | Success Status |
|---|---|---|---|---|
| **Read** (All) | `GET` | `/tasks` | Returns a list of all tasks. | `200 OK` |
| **Read** (One) | `GET` | `/tasks/:id` | Returns a single task by its ID. | `200 OK` |
| **Create** | `POST` | `/tasks` | Creates a new task (requires JSON body with `title`). | `201 Created` |
| **Update** | `PUT` | `/tasks/:id` | Updates a task's `title` or `done` status. | `200 OK` |
| **Delete** | `DELETE` | `/tasks/:id` | Removes a task from memory. | `204 No Content` |

---

## 📸 Proof of Execution

### 1. Terminal Validation (cURL)
Successfully creating a new task via standard HTTP request, demonstrating the `201 Created` status code and JSON response:
```bash
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Pass Azure Beta Exam\"}"

HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Date: Mon, 13 Jul 2026 14:00:00 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Pass Azure Beta Exam","done":false}
```

### 2. Swagger UI Documentation
Interactive visual documentation automatically rendering the OpenAPI specification.

<img width="1920" height="1028" alt="Swagger" src="https://github.com/user-attachments/assets/5d3b41cb-683a-4172-9f75-157bc916e291" />

---

## 🔬 The Mortality Experiment
*What happens if I create a task, stop the server, and restart it?*
Because the database is simply a Javascript array (`let tasks = []`) declared in the local memory of the `server.js` file, the operating system reclaims that memory the moment the Node process is killed. Upon restart, the script reads from top to bottom again, resetting the array to its original three hardcoded values. Data persistence requires an external storage mechanism (like the databases utilized in later weeks).

---

## 🤖 Stage 7 Bonus: The AI Rematch

I prompted Claude 3.5 Sonnet to build the exact same API to compare my hand-built code against an LLM's interpretation of my spec. The AI's code is stored in the `/ai-version` directory.

**My Prompt:**
> *"Build a Node.js Express API that manages a to-do list in local memory. It must have 5 endpoints: GET /tasks, GET /tasks/:id, POST /tasks, PUT /tasks/:id, and DELETE /tasks/:id. Return 404 for missing IDs, 400 if the POST title is empty, and 204 for a successful delete. Integrate swagger-ui-express at /docs."*

**AI vs Me (Code Review):**
1. **What the AI did better:** The AI automatically utilized object destructuring and concise arrow functions, making the routing code slightly more compact than my initial manual setup.
2. **What the AI got wrong:** The AI completely ignored the requirement to return a proper JSON error object for the 404 status. It used `res.sendStatus(404)` which simply returns plain text, failing the machine-readability requirement. 
3. **What I forgot to specify:** I forgot to specify how `PUT` should handle partial updates. Because of my vague prompt, the AI assumed a `PUT` request would overwrite the *entire* task object, meaning if I only sent a new `title`, it would accidentally delete the `done` status. My hand-built version properly merges partial data.
