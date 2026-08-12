<div align="center">
  <h1>🚢 Week 5: Deployment, Real Users, and Personal AI Agents</h1>
  <p><i>Shipping the "ugly" version, defining agent architectures, and configuring custom DNS routing.</i></p>
</div>

---

## 🚀 Task 1: Ship the Ugly One

The portfolio has officially crossed the threshold from a local project to a live, public artifact. It is not perfect, but it is real, populated with actual case studies, and accessible on the internet.

*   **Live URL:** `https://my-cloud-portfolio-six.vercel.app/` *(Deployed via Vercel)*
*   **Completeness:** Every page from the sitemap is reachable. Placeholder text has been completely removed and replaced with the actual content mapped in Week 3 (including the Cloud-Edge RL thesis overview and the AI Decision Flow engine).
*   **The "Real Person" Feedback:** I sent the link to a fellow engineering student and member of the local AWS Cloud Club.
    *   *What they saw:* They navigated straight to the Hybrid Cloud-Edge architecture case study.
    *   *The Reaction:* "The technical depth is obvious immediately. The SVG diagrams load fast and make the RL pipeline easy to understand."
    *   *What confused them:* "The back button behavior on the case study modal was a bit jarring on my phone, and it wasn't immediately clear if the 'Imran's Pharmacy' link was a live demo or a code repo."
*   **The "Still Ugly" List:**
    *   Mobile padding on the architecture diagrams is too tight; they touch the edges of the screen.
    *   The Cloud Orange accent color `#EA580C` fails contrast accessibility tests on certain smaller buttons.
    *   The footer links are functional but visually unaligned on ultra-wide monitors.

---

## 🤖 Task 2 (FL-06): Design Your Personal Agent

### Agent Specification Document: The "Defense Scout"

**Job to be Done:** 
An autonomous research scout and study coach designed specifically to pressure-test my Final Year Project defense on "Hybrid Cloud-Edge Context-Aware QoS Optimization." It will continuously scan for newly published papers on reinforcement learning state-space explosion and cross-reference them against my local drafts to highlight potential vulnerabilities.

**User & Usage Frequency:** 
Used by me, Muhammad Abbas, running daily during the final 30 days leading up to the September project defense.

**Tools and Data Needed:**
1.  **File System MCP Server (Read-Only):** Access to my local `D:\Thesis_Drafts\` directory to read my latest PDF chapters and Python RL models.
2.  **Web Search Connector:** To fetch academic summaries and recent tech blogs regarding cloud orchestrator failures.

**Draft Instructions (System Prompt):**
> You are "Defense Scout," a strict, highly technical academic panelist. Your job is to read my local thesis files via the File System tool, then use the Web Search tool to find 2026 research that contradicts or complicates my QoS optimization methodology. For every new paper you find, generate one aggressive panel question and a scripted rebuttal based strictly on my local architecture. Do not hallucinate algorithms. 

**Five Evaluation Cases (Pre-Build):**
1.  *Target:* Agent successfully reads local `Chapter3_Methodology.pdf`.
2.  *Target:* Agent executes a web search for "DDPG state-space explosion edge computing 2026".
3.  *Target:* Agent correctly identifies that my fallback mechanism (local heuristics) is weak against sudden network partitioning.
4.  *Target:* Agent generates a strict markdown table of critiques without conversational filler.
5.  *Target:* Agent gracefully handles a "file not found" error if a draft is moved.

**Risks & Guardrails:**
*   *Guardrail 1 (Read-Only):* The agent is strictly forbidden from editing, moving, or deleting local files. The MCP server is initialized with read-only permissions to the `Thesis_Drafts` directory.
*   *Guardrail 2 (No Invention):* The agent must explicitly cite the external URL of any new research it presents. It must never invent academic papers.

**Platform Choice & Justification:**
*   *Platform:* Claude Desktop with local MCP connectors.
*   *Justification:* It is 100% free and runs locally, allowing direct, secure access to my unreleased final year project files without uploading sensitive academic research to a public cloud workspace. It provides the exact file-system capabilities needed without the overhead of building a custom full-stack UI.

---

## 🛠️ Task 3 (FL-07): Build the Agent

**The MVP (Minimum Viable Product):**
The core loop has been successfully built. The agent can currently read a specific local thesis file via MCP, extract the reward function, and evaluate it against common edge-computing constraints.

**Build Log:**
*   *Attempt 1:* Configured Claude Desktop config file to point to the `@modelcontextprotocol/server-filesystem`. 
*   *Issue:* Agent hallucinated the contents of the file instead of calling the tool.
*   *Fix:* Updated the system prompt to explicitly command: "You MUST use the `read_file` tool to ingest the context before answering."
*   *Deviation from Spec:* Cut the Web Search connector for the V1 MVP. Focusing purely on getting the local RAG (Retrieval-Augmented Generation) working flawlessly first to keep the build under 10 hours.

**Raw Run Capture Description:**
*A 2-minute unedited screen recording (saved locally as `MVP_Run_Capture.mp4` and submitted to the portal) showing:*
1.  Opening Claude Desktop.
2.  Prompting: "Scout, analyze my current RL reward function in `reward_model.py`."
3.  The UI displaying the "Using tool: read_file" loading indicator.
4.  The agent outputting a detailed critique of the latency-minimization parameters, noting a potential starvation issue for low-priority packets.

---

## 🌐 Task 5 (PF-04): Personal Website Live on the FlyRank Domain

**Live Free URL:** `https://muhammadabbas.vercel.app`
*   *Note:* As requested in previous architectural decisions, the site is deployed via Vercel utilizing a lightweight React/Vite stack. It successfully serves over HTTPS and leverages Vercel's global edge network.

### The DNS Walkthrough (Preparation for `muhammadabbas.flyrank.ai`)

When a custom FlyRank subdomain is provisioned for this portfolio, linking it requires navigating the Domain Name System (DNS). Here is exactly how that process works and how it will be executed using Vercel:

**What happens when someone types the URL?**
1.  **The Resolver:** Your browser asks your ISP's DNS resolver, "Where is `muhammadabbas.flyrank.ai`?"
2.  **The Nameserver:** The resolver checks the root servers, which point it to FlyRank's specific nameservers.
3.  **The Record:** The nameserver checks its records. We will use a **CNAME (Canonical Name)** record. A CNAME acts as an alias, telling the browser, "The content for `muhammadabbas.flyrank.ai` is actually located over at Vercel's servers (`cname.vercel-dns.com`)."
4.  **The Response:** The browser follows the alias, connects to Vercel's edge network, completes the SSL handshake (generating the secure padlock), and loads the React application.

**The Action Plan (When the Subdomain is Ready):**
1.  FlyRank Ops will create a CNAME record on their end pointing `muhammadabbas` to `cname.vercel-dns.com`.
2.  I will log into my Vercel dashboard and navigate to my portfolio project's **Settings > Domains**.
3.  I will enter `muhammadabbas.flyrank.ai` and click **Add**.
4.  Vercel will detect the CNAME record configured by FlyRank, verify the DNS propagation, and automatically provision a free Let's Encrypt TLS/SSL certificate, securing the custom domain.
5.  I will update my CV and LinkedIn profile with the new, professional FlyRank URL.
