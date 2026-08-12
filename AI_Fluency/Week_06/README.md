<div align="center">
  <h1>🛠️ Week 6: Polish, Feedback, and System Ownership</h1>
  <p><i>Explaining the underlying architecture and surviving external design critiques.</i></p>
</div>

---

## 🧠 Task 1: Explain It Like You Built It

**The Topic:** How Vite and Netlify automatically turn my React code into a live website.

Coming heavily from a Python and AWS infrastructure background, modern frontend tooling initially felt like a black box. I understood how to route data on the backend, but I didn't fully grasp how writing React components (JSX) translated into a website that mobile browsers could actually read, or how Netlify "magically" knew when to update my live portfolio. I had AI tutor me on the exact build pipeline.

**My Plain-Words Explanation:**
Web browsers don't actually understand React. They only understand three things: basic HTML, standard CSS, and plain JavaScript. When I write my portfolio using React and Tailwind, I am writing in a developer-friendly language that browsers can't read directly.

This is where **Vite** comes in. Vite acts as an ultra-fast translator. When a build command is triggered, Vite takes all my modular React files, compiles them, strips out unnecessary code, and minifies them into a tiny, highly optimized bundle of pure, browser-readable HTML and JS. 

**Netlify** handles the automation (Continuous Deployment). Because my Netlify account is securely linked to my GitHub repository, it constantly listens for a "webhook"—a digital tap on the shoulder letting it know I pushed new code. The second I type `git push`, Netlify's servers wake up, download my repository, run the Vite translator automatically, and instantly distribute the resulting optimized files across their global network of servers (CDN). I write code, push it, and the pipeline handles the translation and deployment flawlessly.

---

## 🛡️ Task 2: Survive the Crit

You cannot effectively judge your own interface after staring at the codebase for weeks. I submitted the live Netlify portfolio to a peer for an honest, unvarnished review.

### The Setup
*   **Reviewer:** A fellow computer science student and member of the local AWS Cloud Club chapter.
*   **The Proof Statement (Goal):** "I engineer lightweight backend architectures and AI-driven workflows that bridge cloud and edge environments."

### The 10-Second Test
*   *Question:* In ten seconds, what do I do?
*   *Reviewer Answer:* "You build cloud architectures and integrate AI pipelines into backend systems."
*   *Question:* Would you believe I'm good at it?
*   *Reviewer Answer:* "Yes. The AI workflow logs and the RL architecture diagrams look like real, complex engineering work, not just generic tutorials."

### The Feedback & Sorting (Without Defending)

**Must-Fix (Critical blockers):**
1.  **Accessibility:** The primary "Cloud Orange" buttons (`#EA580C`) with white text lack sufficient contrast. They are hard to read on a mobile screen in daylight.
2.  **Navigation:** The link to my GitHub profile (the primary proof of my backend code) is buried at the absolute bottom of the footer. It needs to be front-and-center.

**Nice-to-Have (To address later):**
1.  **Padding:** The padding around the SVG architecture diagrams is too tight on mobile devices, making them feel slightly cramped.
2.  **Animations:** Adding a smooth scroll effect when clicking the "Review My Case Studies" CTA would make the site feel slightly more polished.

### The Fixes Implemented on the Live Site
*   **Fixed Button Contrast:** Updated the Tailwind classes on all primary buttons. Changed the text from `text-white` to `text-slate-900` (near-black) against the orange background, significantly improving readability and passing WCAG contrast standards.
*   **Repositioned GitHub Link:** Added a persistent navigation bar at the top of the screen featuring a high-visibility GitHub icon, ensuring visitors can immediately access the source code for my workflows and background jobs without scrolling.

---

## ⏳ Task 3: Professional Setup and Security Baseline
*Status: Lead review pending.*