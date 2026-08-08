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
<img width="1918" height="976" alt="1" src="https://github.com/user-attachments/assets/cb5affbb-30d7-4f8e-ad00-f9e34570aaec" />

**2. Inngest Background Worker Execution**
<img width="1920" height="977" alt="2" src="https://github.com/user-attachments/assets/d11ebb16-a30f-472b-840c-095429c3fad9" />
