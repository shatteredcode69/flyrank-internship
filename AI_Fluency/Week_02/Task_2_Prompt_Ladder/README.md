<div align="center">
  <h1>🪜 Task 2: The Prompt Ladder</h1>
  <p><i>Engineering the AI Output</i></p>
</div>

---

## 1. Baseline Prompt
**Prompt:** *"Write a nodejs backend."*
* **Output Excerpt:** *"Sure! Here is a simple Express server. First run `npm install express`. Then create `index.js`..."*
* **What changed:** (Baseline)
* **What improved:** N/A. It generated a functional, but completely useless "Hello World" server.
* **What failed:** It assumed I was an absolute beginner, gave me basic setup instructions I didn't need, and had no database connection.
* **Next step:** Define a clearer technical goal.

## 2. Version 1: Adding a Clearer Goal
**Prompt:** *"Write a Node.js backend with an Express server and a Postgres database connection."*
* **Output Excerpt:** *"Here is how to connect Node to Postgres using the `pg` library. `const { Client } = require('pg');`..."*
* **What changed:** Added specific technology requirements (Express + Postgres).
* **What improved:** The code actually included a database driver and a connection string.
* **What failed:** It dumped all the database logic directly inside the Express route handlers, which violates clean architecture. 
* **Next step:** Add quality criteria/architectural constraints.

## 3. Version 2: Adding Constraints (Quality Criteria)
**Prompt:** *"Write a Node.js backend with an Express server and a Postgres database connection. Do not put the SQL logic in the route handlers. Use the Repository Pattern to isolate the database calls."*
* **Output Excerpt:** *"I have created a `repository.js` file for your queries and a `server.js` for your routes..."*
* **What changed:** Forced the AI to use a specific architectural pattern.
* **What improved:** The code structure is instantly professional. The separation of concerns makes the code production-ready.
* **What failed:** Because I asked it to write the "backend," it started generating package.json files, markdown instructions, and explanations I didn't ask for.
* **Next step:** Specify output format to reduce noise.

## 4. Version 3: Specifying Output Format
**Prompt:** *"Write a Node.js backend with an Express server and a Postgres database connection. Do not put the SQL logic in the route handlers. Use the Repository Pattern to isolate the database calls. Output ONLY the raw code for `server.js` and `repository.js`. Do not include markdown explanations."*
* **Output Excerpt:** `[Only code blocks were returned, no chatty intro/outro]`
* **What changed:** Restricted the output medium.
* **What improved:** I got exactly what I needed to copy/paste without scrolling through three paragraphs of AI pleasantries. 
* **What failed (The Step Back):** Because I stripped its ability to explain, it used bad hardcoded credentials (`password: 'password123'`) without telling me how to secure them.
* **Next step:** Add context about the environment.

## 5. Version 4: Adding Context
**Prompt:** *"I am building a portfolio project to demonstrate production-ready architecture to a hiring manager. Write a Node.js backend with an Express server and a Postgres database connection. Do not put the SQL logic in the route handlers. Use the Repository Pattern to isolate the database calls. Output ONLY the raw code for `server.js` and `repository.js`. Do not include markdown explanations. Ensure all secrets are handled via environment variables."*
* **Output Excerpt:** `const pool = new Pool({ connectionString: process.env.DATABASE_URL });`
* **What changed:** Added the context that this must look like production-grade code.
* **What improved:** The AI immediately swapped hardcoded passwords for `process.env`. It also added basic `try/catch` error handling that it previously ignored.
* **What failed:** The prompt works perfectly, but requires me to manually feed it my exact schema every time if I want specific routes.
* **Next step:** Add a dynamic variable for easy reuse.

## 6. Final Reusable Prompt
> **The Final Prompt:**
> "I am building a production-ready application. Write the backend logic for the following entity: `[INSERT ENTITY NAME E.G., INTERNS, USERS]`. 
> 
> Requirements:
> 1. Use Node.js, Express, and the `pg` library.
> 2. Use the Repository Pattern to isolate all SQL calls from the route handlers.
> 3. Implement full `try/catch` error handling.
> 4. Use `process.env` for all database connections.
> 
> Output ONLY the raw code for the route file and the repository file. Do not include markdown explanations, setup instructions, or pleasantries."