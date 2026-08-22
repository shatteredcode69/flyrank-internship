<div align="center">

# 🚀 FlyRank Backend & AI Engineering Portfolio

**The complete repository of an 8-week engineering internship building scalable backend systems, autonomous AI agents, and production workflows.**

<br />

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS" />
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/OpenAI-412991.svg?style=for-the-badge&logo=OpenAI&logoColor=white" alt="OpenAI" />
<img src="https://img.shields.io/badge/Anthropic-191919.svg?style=for-the-badge&logo=Anthropic&logoColor=white" alt="Anthropic" />

<br /><br />

[![Status](https://img.shields.io/badge/Status-Completed-brightgreen?style=flat-square)]()
[![Weeks](https://img.shields.io/badge/Duration-8%20Weeks-blue?style=flat-square)]()
[![Tracks](https://img.shields.io/badge/Tracks-2-orange?style=flat-square)]()

</div>

---

## 📌 Executive Summary

This repository serves as the living technical deliverable for the **FlyRank Internship Program**. Over the course of 8 weeks, the focus shifted from writing standard server scripts to engineering complex, automated backend architectures, orchestrating containerized deployments, and integrating Agentic AI via the Model Context Protocol (MCP).

> **Core Focus:** Building robust APIs, designing offline-first architectures, managing background task queues, and securely integrating Large Language Models (LLMs) into production workflows.

---

## 🏗️ Technical Ecosystem & Architecture

The diagram below illustrates the overarching technical ecosystem built and utilized across the various modules in this repository.

```mermaid
graph TD
    subgraph Client["🖥️ Client Presentation Layer"]
        React["React.js / Vite"]
        PWA["Progressive Web App"]
        Vercel["Vercel / Netlify Deploy"]
    end

    subgraph Backend["⚙️ Backend API & Orchestration"]
        Express["Node.js / Express API"]
        Inngest["Inngest Background Jobs"]
        Auth["JWT Authentication"]
        Docker["Docker Containers"]
    end

    subgraph AI["🤖 AI & Reasoning Engines"]
        Claude["Claude Desktop + MCP"]
        OpenAI["OpenAI Vision API"]
    end

    subgraph Data["🗄️ Data & Storage"]
        SQLite[("SQLite Database")]
        LocalStore["Browser localStorage"]
    end

    React -->|HTTP / REST| Express
    PWA -->|Offline Sync| LocalStore
    Express --> Auth
    Express -->|Queue Heavy Tasks| Inngest
    Inngest -->|Async Fetch| OpenAI
    Express -->|CRUD Operations| SQLite
    Express --> Docker
    Claude -->|Read-Only Filesystem Access| LocalCode["Local Python Codebase"]

    style Client fill:#1a1a2e,stroke:#61DAFB,color:#fff
    style Backend fill:#1a1a2e,stroke:#339933,color:#fff
    style AI fill:#1a1a2e,stroke:#412991,color:#fff
    style Data fill:#1a1a2e,stroke:#FF9900,color:#fff
```

---

## 🏆 Flagship Projects

### 1️⃣ Image Relevance & Auto-Tagging Engine — *Backend Capstone*

An automated backend ingestion pipeline that replaces manual image tagging workflows using async orchestration.

| | |
|---|---|
| **The Problem** | Unindexed, user-uploaded images bloat storage and make search impossible. Manual tagging doesn't scale. |
| **The Architecture** | An Express API accepts image URLs, validates them with JWT authentication, and immediately returns a `202 Accepted` status. Heavy processing is offloaded to an Inngest background job, which queries the OpenAI Vision API for semantic tags and writes the structured JSON to a SQLite database. |
| **The Impact** | Reduced manual processing time from **20 minutes → 30 seconds** for 50-image batches. |

```mermaid
sequenceDiagram
    participant Client
    participant API as Express API
    participant Queue as Inngest Job
    participant Vision as OpenAI Vision
    participant DB as SQLite

    Client->>API: POST /images (image URLs)
    API->>API: Validate JWT
    API-->>Client: 202 Accepted
    API->>Queue: Enqueue tagging job
    Queue->>Vision: Request semantic tags
    Vision-->>Queue: Return tags (JSON)
    Queue->>DB: Persist structured tags
```

📄 Documentation: *Explore the Auto-Tagging Engine*

---

### 2️⃣ Defense Scout — *Autonomous Local AI Agent*

A localized AI research assistant built to securely pressure-test academic research on **Hybrid Cloud-Edge Context-Aware QoS Optimization**.

| | |
|---|---|
| **The Problem** | Traditional web-based LLMs pose a data privacy risk for unreleased academic research and lack structural context of local codebases. |
| **The Architecture** | Utilizes Claude Desktop and the Model Context Protocol (MCP). A local File System MCP server grants the agent strict **read-only** access to a local directory containing Python scripts and PDF drafts. |
| **The Impact** | Evaluates reinforcement learning algorithms and generates rigorous panel critiques autonomously — without leaking data to the web. |

📄 Documentation: *Explore Defense Scout*

---

### 3️⃣ Imran Pharmacy — *Progressive Web App*

An offline-first web application designed for rapid, quantity-based medicine ordering.

| | |
|---|---|
| **The Problem** | Pharmacy terminals often suffer from slow internet connections, making cloud-dependent e-commerce interfaces impractical for rapid order building. |
| **The Architecture** | Built as a PWA using **React, Vite, and Zustand**. All state is persisted via `localStorage`. Features client-side `jsPDF` document generation and a 1,908-item static search catalog. |
| **The Impact** | Achieved **sub-second search speeds** and total offline availability, prioritizing a *"Find → Add → Print"* operational workflow. |

📄 Documentation: *Explore Imran Pharmacy*

---

## 🗂️ Complete Deliverable Index

### 🤖 Track 1 — General AI Fluency (Foundations & Agents)

| Module | Focus Area | Status |
|---|---|:---:|
| Week 1: Audit & Proof Statement | AI Workflow Audits & Portfolio Sitemaps | ✅ |
| Week 2: The Prompt Ladder | Prompt Engineering & Real-World Use Cases | ✅ |
| Week 3: Identity Kit | UI Philosophy (Consistency, Not Talent) | ✅ |
| Week 4: MCP Basics | Blank Page Shipped, Tech Stack Rationale | ✅ |
| Week 5: Deployment | Live Deployment & Custom DNS Routing | ✅ |
| Week 6: System Ownership | Explain It Like You Built It & Design Critiques | ✅ |
| Week 7: Mobile QA | Accessibility Fix Logs & Touch Target Sizing | ✅ |
| Week 8: Capstone & Agents | Dynamic Forms, Agent Specs, and Retrospective | ✅ |
| Week 9: Hardening | Security Hardening, SEO, and Custom Domains | ✅ |

### ⚙️ Track 2 — Backend AI Engineering (Core Systems)

| Module | Focus Area | Status |
|---|---|:---:|
| Week 2: CRUD API | Building the first Node.js/Express REST API | ✅ |
| Week 3: Docker & DB | Database Integration & Docker Containerization | ✅ |
| Week 4: JWT Auth | JWT Authentication & Route Protection | ✅ |
| Week 5: Web Scrapers | Polite Web Scrapers & Data Extraction | ✅ |
| Week 6: Background Jobs | Inngest Queues & LLM API Triage | ✅ |
| Week 7: AI Decision Flows | PDF Report Generators & React Flow Logic | ✅ |
| Week 9: 10x Solution | Final Capstone Submission | ✅ |

---

## 👨‍💻 About the Engineer

<div align="center">

### Muhammad Abbas
**Backend & Cloud AI Engineer**

Specializing in bridging the gap between scalable cloud infrastructure and autonomous AI workflows. With a deep focus on **Node.js, Python, AWS, and AI orchestration (MCP/RAG)**, building systems that don't just generate text, but actively perform background tasks, manage state, and execute decisions securely.

**Current Research:** Hybrid Cloud-Edge Context-Aware QoS Optimization
**Certifications:** Preparing for Microsoft Azure AI

🔗 [LinkedIn](https://www.linkedin.com/in/abbassafar) · 💻 [GitHub](https://github.com/shatteredcode69)

</div>

---

<div align="center">
<sub>Built with ⚙️ backend rigor and 🤖 AI-assisted engineering — FlyRank Internship, 8-Week Sprint.</sub>
</div>
