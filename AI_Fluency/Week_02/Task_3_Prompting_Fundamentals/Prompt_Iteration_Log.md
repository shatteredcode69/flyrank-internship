# 🪜 FL-02: Prompting Fundamentals on Real Tasks v2

**Target Task:** Anticipating and preparing for aggressive, highly technical panel questions for a Final Year Project defense on "Hybrid Cloud-Edge Approach to Context-Aware Quality of Service (QoS) Optimization using Reinforcement Learning."

---

## 🔄 Iteration Log

### Version 1: The Naive One-Liner
**Prompt:**
> Give me questions for my final year project defense on a hybrid cloud-edge approach to context-aware QoS optimization using reinforcement learning.

**Output Snippet:**
> 1. What is reinforcement learning?
> 2. How does a hybrid cloud-edge architecture work?
> 3. What are the benefits of QoS optimization?
> 4. What were the results of your project?

**Note on Change & Output Difference:**
* **What changed:** Initial baseline prompt.
* **Output difference:** The output reads like a 101-level quiz rather than a defense preparation guide. The model provided generic definitions and surface-level inquiries, completely ignoring the complexity of integrating these three advanced domains.

---

### Version 2: Role Assignment
**Prompt:**
> **Act as a strict, highly technical Computer Science professor evaluating a final-year thesis.** Give me questions for my final year project defense on a hybrid cloud-edge approach to context-aware QoS optimization using reinforcement learning.

**Output Snippet:**
> 1. Justify your choice of Reinforcement Learning over traditional convex optimization for QoS routing.
> 2. How did you handle the state-space explosion inherent in modeling edge node mobility?
> 3. Explain your reward function. How did you balance latency minimization with energy constraints?

**Note on Change & Output Difference:**
* **What changed:** Applied a specific persona (strict CS professor).
* **Output difference:** The tone instantly shifted from generic trivia to academic scrutiny. The model stopped asking "What is RL?" and started asking *why* RL was chosen over alternatives, demonstrating a massive leap in technical relevance.

---

### Version 3: Context and Motivation
**Prompt:**
> Act as a strict, highly technical Computer Science professor evaluating a final-year thesis. **I am preparing for my project defense next week. My goal is to anticipate the hardest methodological critiques so I can script strong rebuttals.** Give me questions for my final year project defense on a hybrid cloud-edge approach to context-aware QoS optimization using reinforcement learning.

**Output Snippet:**
> *Methodological Critique 1:* Reinforcement learning is notoriously sample-inefficient. How did you ensure convergence within a dynamic edge environment where topology changes rapidly? 
> *Methodological Critique 2:* If your cloud orchestrator goes offline, what is the fallback mechanism for your edge nodes? 

**Note on Change & Output Difference:**
* **What changed:** Added the user's specific motivation (scripting rebuttals for methodological critiques).
* **Output difference:** Providing the *why* focused the model entirely on vulnerabilities and system architecture flaws. It stopped asking about general project results and started attacking the methodology, which is exactly what a defense prep requires.

---

### Version 4: Few-Shot Examples
**Prompt:**
> Act as a strict, highly technical Computer Science professor evaluating a final-year thesis. I am preparing for my project defense next week. My goal is to anticipate the hardest methodological critiques so I can script strong rebuttals. 
> 
> **Here is an example of the difficulty level and style I am looking for:**
> **Critique:** "Edge devices have limited compute. Running heavy RL inference locally drains battery. How did you address this?"
> **Rebuttal Strategy:** "Acknowledge the constraint, explain the offloading of training to the cloud, and detail the lightweight inference model deployed on the edge."
>
> Give me more questions for my final year project defense on a hybrid cloud-edge approach to context-aware QoS optimization using reinforcement learning.

**Output Snippet:**
> **Critique:** "Your context-aware system relies on constant telemetry. This overhead alone could degrade QoS. How do you justify this?"
> **Rebuttal Strategy:** "Acknowledge the overhead. Explain the dynamic sampling rate implemented to reduce telemetry frequency during stable network periods."

**Note on Change & Output Difference:**
* **What changed:** Provided a concrete example of the exact input/output pairing expected.
* **Output difference:** The model locked into the exact format provided. Instead of just listing questions, it began generating the strategic counter-arguments requested by the few-shot pattern, making the output instantly actionable.

---

### Version 5: Output Structure
**Prompt:**
> Act as a strict, highly technical Computer Science professor evaluating a final-year thesis. I am preparing for my project defense next week. My goal is to anticipate the hardest methodological critiques so I can script strong rebuttals. 
> 
> [Few-shot example included...]
> 
> **Format your response as a strict Markdown table with the following columns: Domain (Cloud/Edge/RL), Aggressive Question, Core Vulnerability Targeted, Rebuttal Strategy.**

**Output Snippet:**
> | Domain | Aggressive Question | Core Vulnerability Targeted | Rebuttal Strategy |
> |---|---|---|---|
> | RL | "How do you guarantee QoS during the initial RL exploration phase before convergence?" | Cold-start problem in mission-critical networks. | Detail the hybrid approach: using a static heuristic baseline while the RL agent trains in the background. |

**Note on Change & Output Difference:**
* **What changed:** Constrained the output to a specific tabular data structure.
* **Output difference:** Eliminated all conversational filler (e.g., "Sure, here are your questions!"). The table format forced the model to categorize the questions logically, making the data highly scannable and easy to export.

---

### Version 6: Step Decomposition
**Prompt:**
> Act as a strict, highly technical Computer Science professor evaluating a final-year thesis. I am preparing for my project defense next week. My goal is to anticipate the hardest methodological critiques so I can script strong rebuttals.
> 
> **Step 1:** Analyze the project title ("Hybrid Cloud-Edge Approach to Context-Aware QoS Optimization using Reinforcement Learning") and identify the three most likely points of integration failure.
> **Step 2:** Using those failure points, generate aggressive defense questions.
> **Step 3:** Format the questions as a strict Markdown table with the columns: Domain, Aggressive Question, Core Vulnerability Targeted, Rebuttal Strategy.

**Output Snippet:**
> **Step 1: Integration Failure Analysis**
> 1. *Cloud-to-Edge Sync:* Latency in updating RL policies from the cloud orchestrator to the edge agents.
> 2. *State-Space Explosion:* Context-aware parameters scaling exponentially, making real-time RL impossible.
> 3. *Reward Hacking:* The RL agent optimizing for latency while entirely starving low-priority packets, violating overall QoS fairness.
> 
> **Step 2 & 3: Table Generation**
> | Domain | Aggressive Question | Core Vulnerability Targeted | Rebuttal Strategy |
> |---|---|---|---|
> | Cloud/Edge | "If the cloud link fails, your edge agents are running stale policies. How does the system prevent QoS collapse?" | Network partition resilience. | Explain the edge-local fallback heuristics that take over when cloud heartbeats are lost. |

**Note on Change & Output Difference:**
* **What changed:** Forced the model to "think out loud" (Chain of Thought) by breaking the task into sequential analytical steps before generating the final output.
* **Output difference:** The quality of the questions skyrocketed. By forcing the model to explicitly identify architectural flaws *first* (Step 1), the resulting table (Step 3) contained highly specific, deeply insightful critiques about reward hacking and network partitions that previous iterations entirely missed.

---

## ⚖️ Cross-Model Comparison (ChatGPT vs. Claude)

I ran the final **Version 6** prompt through both ChatGPT (GPT-4o) and Claude (3.5 Sonnet).

* **Tone:** Claude maintained the strict, academic, and slightly dry tone of a professor perfectly. ChatGPT leaned into the role but occasionally slipped into its default "helpful assistant" persona, adding enthusiastic closing remarks ("Good luck on your defense!").
* **Accuracy & Depth:** Claude was vastly superior at identifying networking-specific flaws. It brought up "Markov Decision Process (MDP) formulation errors" which is a highly relevant RL critique. ChatGPT hallucinated specific algorithms, assuming the project used Proximal Policy Optimization (PPO) without being told, which could derail preparation.
* **Structure:** Both models adhered to the Step 1 -> Step 2 -> Table structure perfectly. However, Claude generated a cleaner markdown table without excessive bolding.
* **Failure Points:** ChatGPT's tendency to fill in missing details (assuming specific algorithms) makes it slightly dangerous for blind defense prep. Claude's strict adherence to the provided constraints made its output much safer and more reliable for this specific task.

---

## 🛠️ Final Reusable Prompt Template

*A zero-context template anyone can use to pressure-test their own work.*

```text
Act as a [EXPERT PERSONA]. I am [CURRENT SITUATION/DEADLINE]. My goal is to [SPECIFIC MOTIVATION/DESIRED OUTCOME].

Step 1: Deeply analyze the following subject/project: "[INSERT PROJECT/TOPIC HERE]". Identify the three most likely points of failure, logical fallacies, or weak points in this concept.
Step 2: Based on the analysis in Step 1, generate a list of aggressive, highly critical questions or critiques.
Step 3: Format the output as a strict Markdown table with the following columns: [COLUMN 1], [COLUMN 2], [COLUMN 3], [COLUMN 4].

Do not include conversational filler. Do not assume facts that are not provided.
```