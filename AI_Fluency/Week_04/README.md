<div align="center">
  <h1>🏗️ Week 4: Build Phase, Automation workflows, and Agent Concepts</h1>
  <p><i>Deploying foundational architecture, evaluating tech stacks, and distinguishing workflows from autonomous agents.</i></p>
</div>

---

## 🚀 Task 4.1: Empty but Live: Ship a Blank Page

The hardest part of any deployment is getting the initial pipeline connected and resolving DNS. The repository has been initialized, connected to the hosting provider, and is officially live on the internet.

*   **Live URL:** `https://muhammadabbas.github.io/portfolio` *(Example)*
*   **Mobile Verification:** Verified rendering and SSL handshake on a mobile device on cellular data.
*   **Claude Project Sync:** The identity kit, content map, and case studies from Week 3 have been uploaded into a dedicated Claude Project to maintain consistent context during the build phase.

> **📸 IMAGE REQUIRED BELOW: Drop a screenshot of your live blank page from your mobile device here.**
> ![Mobile Live Verification](./path_to_mobile_screenshot.png)

---

## 🛣️ Task 4.2: Three Roads: Choose Your Stack with AI

Selecting the right architecture requires balancing immediate portfolio needs with long-term maintainability. 

### The Constraints Provided to AI
1.  **Cost:** 100% Free tier hosting.
2.  **Skill Level:** Highly proficient in Python and AWS infrastructure; comfortable with frontend integrations.
3.  **Requirements:** Needs to display image galleries, embedded diagrams, and link out to code repositories.
4.  **Display Format:** Lightweight, fast-loading, long-form reading capabilities for deep technical case studies.
5.  **Dynamic Needs:** No backend needed for the initial portfolio layer; dynamic elements will have their databases uploaded independently at a later stage.

### The 3 Options Generated
1.  **Option A (Simplest): Vanilla HTML/CSS/JS on GitHub Pages**
    *   *Trade-off:* Lowest barrier to entry and fastest load times, but component reusability (like navbars or footers) becomes a manual copy-paste nightmare as the portfolio scales.
2.  **Option B (The Front-Runner): React + Vite + Tailwind on GitHub Pages**
    *   *Trade-off:* Requires a build step (`npm run build`), but offers massive component reusability, a lightweight footprint, and zero server costs.
3.  **Option C (Most Powerful): Next.js on Vercel**
    *   *Trade-off:* Overkill for a static portfolio. Offers Server-Side Rendering (SSR) and API routes, but introduces unnecessary complexity and potential vendor lock-in for simple static routing. 

### The Rationale & Final Decision
I have chosen **Option B: React + Vite + Tailwind deployed via GitHub Pages.** 

A lightweight web development stack is strictly preferred over resource-heavy, monolithic frameworks (which I specifically avoid, having previously removed frameworks like Flutter for their high resource consumption). Vite provides lightning-fast hot module replacement during development, while Tailwind allows for rapid styling matching my exact Identity Kit hex codes without bloated CSS files. 

*What breaks if I pick the simplest?* I lose component architecture, making case studies tedious to format.
*Can I maintain this?* Yes. GitHub Actions will automate the build and deploy process directly to `gh-pages` on every commit. It showcases my work perfectly while keeping overhead near zero.

---

## ⚙️ Task 4.3 (FL-04): Ship an Automation Workflow v2

**Pipeline:** Source-Grounded Defense Prep & Rebuttal Generator
**Goal:** Automate the extraction of methodological flaws from technical research and convert them into structured defense preparation materials.

### The Flow (4 Steps)
1.  **Gather:** Upload local PDF drafts and reference papers regarding the "Hybrid Cloud-Edge Context-Aware QoS Optimization" thesis into NotebookLM.
2.  **Synthesize:** Prompt NotebookLM to extract the top 5 architectural vulnerabilities (e.g., edge-node battery drain, state-space explosion in RL).
3.  **Draft:** Feed the extracted vulnerabilities into a Claude Project (pre-loaded with my defense context) to generate aggressive panel questions and scripted rebuttals.
4.  **Format:** Output the final responses directly into a markdown table format.

### The Runs & Time Saved
The pipeline was run on 5 specific technical domains of the project:
1.  *RL Convergence Rates*
2.  *Edge Compute Constraints*
3.  *Telemetry Overhead*
4.  *Cloud-to-Edge Sync Failures*
5.  *Reward Hacking*

*   **Manual Time:** ~45 minutes per domain (reading, identifying flaws, formatting a defense). Total: ~3.75 hours.
*   **Workflow Time:** 5 minutes of setup/upload + 2 minutes of generation. Total: ~7 minutes.

### Failure Points & Human Review
*   **Failure Point:** NotebookLM occasionally hallucinates specific algorithms (e.g., assuming PPO over DDPG) if the math isn't explicitly defined in the uploaded PDF.
*   **Human Check:** The actual reinforcement learning reward equations must be manually reviewed before memorizing the generated rebuttals.

> **📸 IMAGE REQUIRED BELOW: Drop a screenshot of your NotebookLM or Claude Project workflow running here.**
> ![Workflow Execution](./path_to_workflow_screenshot.png)

---

## 🤖 Task 4.4 (FL-05): Agent Concepts and MCP Basics

### Explainer: Agents, Workflows, and the Model Context Protocol (MCP)

In the current landscape of AI, the term "agent" is frequently misused to describe basic automation. Understanding the architectural distinction between a workflow and an agent is critical for engineering reliable backend AI systems.

**Workflows vs. Agents**
A **workflow** is a deterministic, directed system. The execution path is hardcoded by the developer. Tools like n8n, Zapier, or a standard API integration process steps in a predictable sequence (e.g., Step A triggers Step B, which loops through Step C). The LLM is merely a functional node *within* that sequence, transforming data exactly when it is told to. 

An **agent**, conversely, controls its own control flow. Instead of a developer writing a loop, the agent is given a goal, a set of tools, and an environment. It uses the LLM as a reasoning engine to decide *which* tool to use, *when* to use it, and *whether* it has achieved its goal. An agent handles errors dynamically, pivoting its strategy if a tool fails, whereas a workflow will simply crash or follow a predefined error-catching route.

**Classifying FL-04**
My FL-04 Defense Prep Pipeline is strictly a **workflow**. I manually move data from NotebookLM to Claude and prompt it to format a table. Even if fully automated via n8n, it remains a workflow because the execution path is rigidly defined. 

**Model Context Protocol (MCP)**
To make an agent truly useful, it must interact with the outside world. The Model Context Protocol (MCP) acts as a universal "USB-C port" for AI. Instead of writing custom API wrappers for every LLM, MCP standardizes how AI connects to external data sources. It operates on three primitives:
1.  **Resources:** Read-only data access (e.g., letting Claude read local log files or API documentation).
2.  **Prompts:** Reusable templates and context shared with the model.
3.  **Tools:** Executable functions the model can call (e.g., running a SQL query, executing a Python script, or pushing to GitHub).

**Connecting MCP**
I connected the official File System MCP server to Claude Desktop. This allowed the model to step outside its chat window and directly read local files.

*The 3 Tool-Call Tasks:*
1.  Instructed Claude to read a local `server.js` file from my drive and summarize its API endpoints.
2.  Asked Claude to read my local `logs/quarantine.jsonl` error log and identify the most frequent validation failure.
3.  Instructed Claude to read my `JOB-CARD.md` and check if it violated any rules from the assignment guidelines stored in a separate local PDF.

**Agentic Upgrade for FL-04**
To upgrade my FL-04 workflow into a true agent, I would integrate a Web Search tool and a GitHub MCP connector. Instead of me uploading PDFs, I would give the agent the goal: *"Find recent 2026 papers on RL state-space explosion, cross-reference them against my local GitHub repo's Python code, and generate a defense rebuttal for any mismatched optimizations."* The agent would autonomously search, read the code, and draft the response without human hand-offs.

> **📸 IMAGE REQUIRED BELOW: Drop screenshots of Claude Desktop successfully utilizing the MCP Tool (showing the tool-call UI).**
> ![MCP Tool Call 1](./path_to_mcp_1.png)
> ![MCP Tool Call 2](./path_to_mcp_2.png)
> ![MCP Tool Call 3](./path_to_mcp_3.png)