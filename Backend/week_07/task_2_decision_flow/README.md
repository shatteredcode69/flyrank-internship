<div align="center">
  <h1>AI Decision Flow (React Flow + Inngest)</h1>
  <p><i>Visual workflow editor mapping graph nodes to background Inngest LLM step executions.</i></p>
</div>

---

## 🎯 Objective
To construct a visual workflow canvas using **React Flow**, offloading step-by-step graph traversal and conditional branching (YES/NO logic) to an **Inngest** background worker engine.

## 🏗️ Architecture & Features
- **Canvas Editor:** Interactive React Flow canvas with node connections, animated active edges, and custom handles.
- **Inngest Engine:** Background function `executeDecisionFlow` traversing nodes based on LLM outputs.
- **Execution Logs:** Real-time log sidebar displaying active node execution and AI decision results.

---

## 📸 Proof of Execution

**1. React Flow Visual Canvas & Logs Panel**
*(Drag and drop React Flow UI Screenshot here)*

**2. Inngest Background Worker Execution**
*(Drag and drop Inngest Dashboard Screenshot here)*