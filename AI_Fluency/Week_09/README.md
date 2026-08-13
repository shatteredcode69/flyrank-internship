<div align="center">
  <h1>🛑 Week 9: Hardening, Launch, and Future-Proofing</h1>
  <p><i>Breaking the site, planting the flag with a custom domain, and planning the next iteration.</i></p>
</div>

---

## 🔨 Task 1: Break Your Own Site

A professional doesn't just demo the happy path; they know exactly where their system fails. I spent two hours actively trying to break my portfolio.

### The "Where it Breaks" List & Triage

**1. Form Input Validation (Empty & Garbage Data)**
*   *The Break:* Submitting the Netlify contact form completely empty resulted in a successful submission of a blank email.
*   *Triage:* **Fix-Now**. 
*   *The Fix:* Added HTML5 `required` attributes to the Name, Email, and Message fields, and applied a regex `pattern` constraint to the email input to ensure valid formatting before the browser allows submission.

**2. Form Submission Spamming**
*   *The Break:* Rapidly double-clicking the "Send" button fired off two identical POST requests to the Netlify backend before the page could redirect.
*   *Triage:* **Known Limitation**.
*   *Reasoning:* Because I am using a pure HTML form action without a heavy client-side JavaScript state manager (to keep the site lightweight), there is no debounce function. Netlify's built-in spam filter handles the duplicates on the backend, so the architectural trade-off is acceptable for a V1.

**3. Speed and SEO Constraints**
*   *The Break:* When searching my name on Google, the site appeared, but the description was a generic React Vite boilerplate text. When sending the link on Discord, no preview image appeared.
*   *Triage:* **Fix-Now**.
*   *The Fix:* Injected proper metadata into `index.html`. Added `<title>Muhammad Abbas | Backend & AI Engineer</title>`, a custom `<meta name="description">`, and standard Open Graph (`og:image`, `og:title`) tags pointing to a compressed screenshot of my Cloud-Edge architecture. 

**4. Performance Audit**
*   Ran Lighthouse (PageSpeed Insights). Scored **98/100** on Performance. The only ding was a slightly delayed First Contentful Paint (FCP) caused by loading external Google Fonts (Inter & JetBrains Mono).
*   *Triage:* **Known Limitation**. The aesthetic value of the Identity Kit fonts outweighs a 0.2-second load delay.

---

## 🚩 Task 2: Plant Your Flag: Domain + Badge

The portfolio is no longer just a project on a free tier; it is a permanent piece of my professional online identity.

### 1. Custom Domain & Security
*   **Live URL:** `https://muhammadabbas.dev` *(Example custom domain)*
*   **Routing:** Successfully pointed the custom domain's A-records and CNAME to Netlify's servers. 
*   **Security:** Netlify automatically provisioned a Let's Encrypt TLS certificate. The site serves 100% over HTTPS with the secure padlock active.

### 2. Analytics
*   **Installed:** Added **Google Analytics (GA4)** via a lightweight tracking script in the document `<head>`.
*   **Verification:** Monitored the Real-Time dashboard and confirmed page views trigger correctly when navigating between case studies.

### 3. Launch Hygiene Confirmed
*   **Favicon:** The `<ma />` logo successfully appears in the browser tab.
*   **Social Share:** Texting the URL to a colleague successfully generated the Open Graph preview card with my title and hero image.
*   **Mobile Check:** Opened the final custom domain on my physical phone to confirm DNS propagation and responsive rendering.

### 4. The FlyRank Graduate Badge
*   **Status:** Installed successfully.
*   **Location:** Placed cleanly in the `Footer.jsx` component, positioned below my social links.
*   **Routing:** The badge image is wrapped in an anchor tag (`<a>`) that links directly to my official FlyRank verification/credential page.

---

## 🏗️ Task 3: The Plan to Keep Building

A static portfolio is a dead portfolio. I have established a concrete system to ensure this platform grows alongside my engineering career.

**The "How to Add the Next Case" Standard Operating Procedure:**
1. Open the dedicated "Portfolio Architect" Claude Project (which permanently holds my Identity Kit, tone, and tech stack instructions).
2. Feed Claude my raw technical notes, code snippets, or system logs.
3. Prompt it to format the data into the standard 3-Beat Shape: **The Problem ➔ The Architecture (What I did) ➔ The Output (What came of it)**.
4. Duplicate the `CaseStudyCard.jsx` component in my repository, paste the generated text, add one real screenshot, and run `git push origin main`.

**The Next Piece of Work (Named & Scheduled):**
*   **The Project:** The final evaluation metrics and panel feedback from my "Hybrid Cloud-Edge Context-Aware QoS Optimization" final year project defense.
*   **The Reminder:** I have set a hard Google Calendar event with notifications enabled for **September 10, 2026** (immediately following my defense in the first week of September) titled: *"Update Portfolio: Cloud-Edge Defense Results"*. 

---

## ⏳ Task 4: [Task Name]
*Status: Lead review pending.*