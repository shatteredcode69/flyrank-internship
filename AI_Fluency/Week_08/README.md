<div align="center">
  <h1>⚙️ Week 8: Dynamic Features and Final Agent Documentation</h1>
  <p><i>Wiring live frontend components to backend services and documenting autonomous agents.</i></p>
</div>

---

## 🔌 Task 1: Make It Do Something

A static portfolio only tells a story; a dynamic one proves execution. I have wired exactly one dynamic feature into my portfolio: a fully functional **Contact & Technical Collaboration Form**.

### The Implementation
I implemented this using **Netlify Forms**, which allows my lightweight static React application to securely capture user input without me having to stand up and maintain a dedicated Express server or AWS Lambda function just for emails. It operates entirely on the free tier.

**Evidence of Success:** I submitted a test inquiry through the live portfolio (`https://muhammadabbas.netlify.app`), and the data was successfully captured in the Netlify backend and forwarded to my Gmail inbox.

### Plain-Words Explainer: What is a Backend?
If a website is a restaurant, the frontend (what you see) is the dining room and the menu. The backend is the kitchen. When a user clicks a button or submits a form, they are placing an order. The frontend cannot cook the food; it needs a waiter to carry the order to the kitchen. 

**How my data flows:**
1. **The Trigger:** A user fills out the contact form on my React frontend and clicks "Send."
2. **The Request:** The browser packages that text data into an HTTP POST request (the waiter taking the order) and sends it over the internet to Netlify's backend servers.
3. **The Processing (The Kitchen):** Netlify's backend receives the request, validates that it matches my form structure, and saves the data securely into a database.
4. **The Output:** Netlify then triggers an automated webhook that formats the data into an email and delivers it directly to my inbox, completing the loop.

---

## 🤖 Task 2 (FL-09): Documentation and Demo Video

This section serves as the official documentation and video demonstration for my capstone AI agent: **Defense Scout**.

### 📄 Agent README: Defense Scout

**What it does and for whom:** 
Defense Scout is an autonomous study coach designed for computer science students preparing for rigorous academic project defenses. Given access to a local directory of thesis drafts, the agent scans the methodology, identifies architectural vulnerabilities, and generates aggressive panel critiques alongside scripted rebuttals.

**Simple Architecture Sketch:**
`User Prompt` ➔ `Claude Desktop (Reasoning Engine)` 
                      ⮑ `File System MCP Server` ➔ `Local D:\Thesis_Drafts\` (Reads PDFs/Code)
                      ⮐ `Returns Context` ➔ `Generates Critiques & Markdown Table`

**Setup Steps (Reproducible):**
1. Download and install the **Claude Desktop App**.
2. Install **Node.js** on your machine.
3. Open the Claude Desktop configuration file (accessible via the app settings).
4. Add the official Model Context Protocol (MCP) filesystem server to the config:
   ```json
   {
     "mcpServers": {
       "filesystem": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:\\Your_Thesis_Folder_Path"]
       }
     }
   }