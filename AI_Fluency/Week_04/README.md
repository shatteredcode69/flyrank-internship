<div align="center">
  <h1>🏗️ Week 4: Build Phase, Automation Workflows, and Agent Concepts</h1>
  <p><i>Deploying foundational architecture, evaluating tech stacks, and distinguishing workflows from autonomous agents.</i></p>
</div>

---

## 🚀 Task 4.1: Empty but Live: Ship a Blank Page

The first major milestone of the build phase is establishing the deployment pipeline and ensuring public reachability. The repository has been initialized, connected to the hosting provider, and successfully deployed to the public internet.

*   **Live URL:** `https://my-cloud-portfolio-six.vercel.app/`
*   **Deployment Architecture:** The project is deployed using GitHub Pages, ensuring a zero-cost, highly available static hosting environment.
*   **Mobile Verification:** The blank page was explicitly tested on a mobile device over a cellular network to verify DNS resolution, SSL handshake completion, and baseline responsive rendering outside of a local development environment.
*   **Claude Project Sync:** To maintain architectural consistency moving forward, the Week 3 Identity Kit (Inter/JetBrains Mono fonts, Slate/Orange palette), the content map, and all case study outlines have been loaded into a dedicated Claude Project.

---

## 🛣️ Task 4.2: Three Roads: Choose Your Stack with AI

Selecting the right architecture requires balancing immediate portfolio display needs with long-term maintainability and performance constraints.

### 1. The Constraints
*   **Cost:** Strictly free-tier hosting.
*   **Skill Level:** Highly proficient in Python and AWS infrastructure; comfortable configuring lightweight frontend tools. 
*   **Display Requirements:** Needs to elegantly render image galleries, embed technical architecture diagrams (like the Cloud-Edge RL topology), and cleanly link out to code repositories.
*   **Dynamic Needs:** No backend needed for this initial portfolio layer. The application must remain static for now; any dynamic elements or databases will be handled and uploaded independently at a later stage.

### 2. The Three Stack Options Evaluated
1.  **Simplest: Vanilla HTML/CSS/JS hosted on GitHub Pages**
    *   *Trade-off:* Lowest barrier to entry and fastest initial load time, but lacks component architecture. As case studies grow, maintaining global elements like navbars and footers becomes a manual, error-prone process.
2.  **Front-Runner: React + Vite + Tailwind CSS hosted on GitHub Pages**
    *   *Trade-off:* Requires a local Node environment and a build step. However, it offers massive component reusability, exceptionally fast hot-module replacement during development, and compiles down to highly optimized static assets.
3.  **Most Powerful: Next.js hosted on Vercel**
    *   *Trade-off:* Provides out-of-the-box Server-Side Rendering (SSR) and API routes. However, it is resource-intensive and overkill for a purely static portfolio, introducing unnecessary framework bloat.

### 3. Rationale & Final Decision
I have chosen **React + Vite + Tailwind deployed via GitHub Pages.**

A lightweight web development stack is heavily preferred over resource-intensive, monolithic frameworks (which I strictly avoid to keep resource consumption low). Vite provides the speed and modularity required, while Tailwind ensures the specific Identity Kit hex codes are applied efficiently without maintaining massive external CSS files. 

*What breaks if I pick the simplest?* I lose the ability to create reusable UI components, making the addition of future technical case studies tedious.
*Can I maintain this?* Absolutely. The build process can be fully automated using GitHub Actions to deploy the `dist` folder directly to GitHub Pages on every main branch commit, keeping maintenance overhead near zero while perfectly showcasing my work.

---

## ⚙️ Task 4.3 (FL-04): Ship an Automation Workflow v2

**Pipeline:** Source-Grounded Defense Prep & Rebuttal Generator
**Goal:** Automate the extraction of methodological flaws from technical research and convert them into structured defense preparation materials for my final year project.

### 1. The Workflow Design
1.  **Gather:** Upload local PDF drafts and reference papers regarding the "Hybrid Cloud-Edge Context-Aware QoS Optimization using Reinforcement Learning" thesis into NotebookLM.
2.  **Synthesize:** Prompt NotebookLM to extract the top 5 architectural vulnerabilities (e.g., edge-node battery drain, state-space explosion, reward hacking).
3.  **Draft:** Feed the extracted vulnerabilities into a Claude Project (pre-loaded with the strict CS professor persona and project context) to generate aggressive panel questions and scripted rebuttals.
4.  **Format:** Command the LLM to output the final responses directly into a strict markdown table format.

### 2. Execution & Time Saved
The pipeline was run across 5 specific technical domains of the project (RL Convergence, Edge Compute, Telemetry, Cloud Sync, Reward Modeling). 
*   **Manual Time Estimate:** ~45 minutes per domain (reading, identifying flaws, formatting a defense). Total: ~3.75 hours.
*   **Workflow Time:** 5 minutes of setup/document upload + 2 minutes of generation. Total: ~7 minutes.

### 3. Failure Points & Required Human Review
*   **Failure Point:** The synthesis step occasionally hallucinates specific algorithms (e.g., assuming Proximal Policy Optimization) if the exact math isn't explicitly defined in the uploaded PDFs.
*   **Human Check:** The actual reinforcement learning reward equations and specific networking parameters must be manually reviewed and corrected before finalizing the generated rebuttals.

---

## 🤖 Task 4.4 (FL-05): Agent Concepts and MCP Basics

### 1. Explainer: Workflows vs. Agents
In backend engineering, distinguishing between a workflow and an agent is critical. 

A **workflow** is a deterministic, directed system where the execution path is hardcoded. Tools like n8n or standard API integrations process steps in a predictable sequence. The LLM is merely a functional node within that sequence, transforming data exactly when triggered. 

An **agent** controls its own flow. Given a goal, a set of tools, and an environment, it uses the LLM as a reasoning engine to autonomously decide *which* tool to use and *when* to use it. An agent handles errors dynamically, pivoting its strategy if a tool fails, whereas a workflow will simply crash or follow a rigid error-catching route.

**Classifying FL-04:** My Defense Prep Pipeline is strictly a **workflow**. Data is manually moved between NotebookLM and Claude, and the prompt sequence is rigidly defined. Even if automated via a script, the execution path remains deterministic.

### 2. Model Context Protocol (MCP) Primitives
MCP acts as a universal standardization layer for AI to interact with external systems, operating on three primitives:
1.  **Resources:** Read-only data access (e.g., letting an LLM read local log files or documentation).
2.  **Prompts:** Reusable templates and conversational context shared with the model.
3.  **Tools:** Executable functions the model can call (e.g., running a script, querying a database).

### 3. MCP Connector Implementation
I connected the official File System MCP server to my local AI environment, granting the model the ability to read local directories—a task standard chat interfaces cannot perform.

*Three Executed Tool-Call Tasks:*
1.  Instructed the model to navigate into the specific, separate folder containing my Week 7 PDF report generator assignment and summarize its dependency structure.
2.  Asked the model to read the local `logs/quarantine.jsonl` file generated by the LLM Triage API to identify the most frequent schema validation failure.
3.  Instructed the model to read a local `JOB-CARD.md` file and verify if it violated any constraints listed in a locally stored assignment PDF.

### 4. Agentic Upgrade for FL-04
To upgrade my defense prep workflow into a true autonomous agent, I would integrate a Web Search tool and a GitHub MCP connector. Instead of manually uploading PDFs, I would give the agent the goal: *"Search for 2026 academic papers on reinforcement learning state-space explosion, cross-reference them against the Python code in my local repository, and generate a markdown table of potential defense critiques."* The agent would autonomously research, read the code, and draft the response without human hand-offs.