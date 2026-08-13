<div align="center">
  <h1>📱 Week 7: Quality Assurance and Mobile Optimization</h1>
  <p><i>Killing the obvious breaks, auditing accessibility, and proving the portfolio works on all devices.</i></p>
</div>

---

## 📱 Task 1: Open It on Your Phone

The fastest way to lose credibility with an engineering manager is having a portfolio that breaks on their phone. I conducted a rigorous mobile-first audit of my live portfolio on a physical smartphone, followed by tablet and desktop breakpoint checks. 

**Live URL:** `https://my-cloud-portfolio.vercel.app` *(or your respective host URL)*

### The Fix Log (Before & After)

1. **Mobile Image Overflow (Cloud-Edge Architecture)**
   * **Broken:** The SVG architecture diagram for the Context-Aware QoS Optimization project maintained its desktop width on mobile, breaking the viewport and forcing horizontal scrolling.
   * **Changed:** Wrapped the image container in a responsive Tailwind class (`w-full overflow-x-auto`) and applied `max-w-full h-auto` to the image itself so it scales down natively while remaining crisp.

2. **Untappable Buttons (Touch Targets)**
   * **Broken:** The "View Source Code" and "See Live Deployment" buttons for the Imran's Pharmacy case study were stacked directly on top of each other with zero margin. It was impossible to tap one without hitting the other.
   * **Changed:** Increased the flex container gap (`gap-2` to `gap-4`) and increased the vertical padding on the buttons (`py-3`) to meet the standard 44x44 pixel minimum touch target rule for mobile accessibility.

3. **Broken Live Demo Link (Imran's Pharmacy)**
   * **Broken:** The "See Live Deployment" link was returning a 404 error because it was pointing to an old local host URL.
   * **Changed:** Updated the `href` to properly route to the independent GitHub Pages deployment, ensuring the live demo is fully reachable.

4. **Image Weight & Load Speed (Hero Section)**
   * **Broken:** The AI-generated geometric mesh background was originally exported as a 3MB PNG file. While fine on desktop Wi-Fi, it caused a 4-second render blocking delay on 4G mobile data.
   * **Changed:** Converted the hero image into a highly compressed `WebP` format, reducing the file size to 120KB without losing visual clarity. 

5. **Readability & Line Spacing**
   * **Broken:** The `JetBrains Mono` body font looked great on desktop, but at `text-sm` on mobile, the technical write-ups were too dense to read comfortably.
   * **Changed:** Adjusted the global typography settings. Bumped the base mobile text size to `text-base` (16px) and increased the line height to `leading-relaxed` (1.625) to give the text room to breathe.

---

## ⏳ Task 2: [Task Name]
*Status: Lead review pending.*

---

## ⏳ Task 3: [Task Name]
*Status: Lead review pending.*