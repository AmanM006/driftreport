# 🚨 Drift Report: Autonomous Telemetry Command Center

> **Is your product flying blind?** 
> You refactor a directory, rename a route, or push a feature flag, and your Pendo/Novus telemetry silently disintegrates. Your metrics break, conversion funnels go blind, and your team makes decisions based on ghost schemas. 
>
> **Drift Report** automatically audits, validates, and bridges the drift between codebase routes and Pendo analytics schemas. Stop tracking rot before it hits production.
>
> **Live Deployed App**: [driftreport.vercel.app](https://driftreport.vercel.app)

---

## 🏆 Hackathon Judging Criteria Alignment

### 1. Product Thinking (25%) — *Is the problem worth solving?*
* **The Problem**: Product Managers spend days designing conversion funnels and user analytics, but developers frequently break tracking keys when refactoring file directories, renaming routes, or updating layouts. This results in "tracking drift"—where business decisions are made based on missing or corrupted data.
* **The Solution**: Drift Report acts as a telemetry command center that aligns developers and PMs. It tells engineers exactly what routes exist in the codebase, which ones are tracked, which are partially tracked, and what dynamic payloads are missing.
* **Target Audience**: Product Engineers, Analytics Leads, and Product Managers who need clean, reliable, and automated telemetry audits before code reaches production.

### 2. Craft and Execution (25%) — *Is it actually good?*
* **Coherent, Considerate UX**: Designed in a dark brutalist theme featuring strict HSL color limits (curated text/badge indicators), `#0a0a0a` dashboard boundaries, and a 100vh viewport container that prevents layout stretching.
* **Robust Next.js Route Parsing**: Built a TypeScript **Glob-to-Regex Translator** that maps wildcard Pendo rules (`//*/dashboard/users/*`) against Next.js App Router dynamic routes (like `[id]`, catch-all `[...slug]`, and optional catch-all `[[...slug]]`) with zero false matches.
* **Frictionless Engineering Workflows**: Integrates a **One-Click Issue Exporter** to generate pre-filled Markdown tickets for **GitHub Issues** and **Linear**, letting teams triage analytics bugs alongside standard features.
* **Interactive Sparkline**: An SVG sparkline that dynamically maps real git commits and tracks drift recovery progress (HEAD commit as the final dot node).

### 3. Originality and Ambition (25%) — *Does this make us sit up?*
* **Dynamic Chrome Drift HUD Sandbox**: Rather than hardcoding static mock pages, our **HUD Browser Sandbox** dynamically detects the scanned repository name and routes. It displays a custom staging address bar (e.g. `https://your-repo-name.staging.dev`), renders page layouts with glowing outlines (green for tracked, red for untracked), and simulates live telemetry streams in real-time.
* **Click-to-Inject Telemetry**: Developers can click **"Inject Telemetry Listener"** directly inside the simulated Chrome HUD to push rules to the Pendo API and patch codebase drift in real-time.
* **Base64 Stateless Share State**: Implemented a stateless sharing engine using percent-escaped UTF-8 Base64 strings. Users can share exact audit reports (with classified routes, scores, and commits) simply by sharing the URL, bypassing database requirements.

### 4. Shippedness (25%) — *Is it real?*
* **100% Real API Scans**: A stranger can land on [driftreport.vercel.app](https://driftreport.vercel.app), paste a public GitHub URL (like `https://github.com/AmanM006/driftreport-test`), enter their token, and watch the system scan the repo, retrieve the **actual git commits**, map the **real routes**, and perform a live Gemini PM audit.
* **Graceful API Resiliency**: Recognizing that Pendo Integration API keys are an enterprise add-on that many developers don't have, the backend handles Pendo API access errors (401/403) gracefully. Instead of failing the scan, it flags Pendo as "Offline/Access Denied" in red, applies demo rules to show functional capabilities, and successfully completes the analysis with the user's **real repo routes and real commits**.

---

## ⚙️ How It Works (System Architecture)

Drift Report is built as a fully functional server-side Next.js 15 application. It does not require any database setup; instead, it runs stateless transactions across third-party web APIs on demand.

### Telemetry Audit Execution Pipeline:
1. **GitHub Analysis (Serverless Backend)**: 
   When you click "Analyze Drift", a `POST` request is dispatched to our Next.js backend API at `/api/analyze`. The server acts as a proxy:
   - It queries the **GitHub Trees API** (`https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD`) recursively to discover page endpoints (filtering for `page.tsx`, `page.jsx`, `page.js` files inside `/app/` directories).
   - It queries the **GitHub Commits API** to fetch the last 5 commits for Git history sparkline rendering.
2. **Gemini AI Page Classification**: 
   The server feeds the discovered routes to **Gemini 2.5 Flash**. Gemini classifies the routes into human-readable descriptions, gives them standardized event names (`billing_checkout_view`), and predicts custom tracking payload schema requirements.
3. **Pendo Rules Fetching**: 
   The backend makes a server-to-server request to the Pendo API to gather the user's active page rules, features, and wildcard regex configurations.
4. **Fuzzy Route Matching**: 
   The backend maps Pendo rules onto the codebase layout using a TypeScript **Glob-to-Regex translator**. If a rule (e.g. `//*/settings/*`) matches a file path (`/app/settings/page.tsx`), it marks the route as `covered`.
5. **JSON Report Output**: 
   The server outputs a consolidated analysis payload to the React frontend to update the gauges, charts, issue generators, and live HUD simulator viewports.

---

## ⚡ Key Features (The Domination Loops)

1. **Traffic-Weighted Severity Grid**: Prioritizes telemetry debt by matching route views to Est. Monthly Views and Est. Revenue at Risk ($/mo), focusing team efforts on critical funnels first.
2. **Gemini Visual Component Audits**: Maps route structures to mock UI elements (e.g., `StripeElement`, `AuthCard`, `LineChart`) to feed Gemini 2.5 Flash for contextual PM feedback.
3. **No-Code Sitemap Scan**: PMs can scan site structures without GitHub keys by pasting plain sitemap text line-by-line.
4. **CI/CD Telemetry Guardrails**: Generates a copy-pasteable GitHub Action configuration that blocks pull requests if codebase-to-analytics coverage falls below target thresholds.
5. **Zombie Telemetry Detection**: Scans active Pendo rule lists to identify "Zombie rules" tracking dead routes that no longer exist in the codebase.
6. **Payload Schema Warning**: Scans analytics snippets to catch invalid keys or placeholder configurations (`undefined` / `empty`), providing one-click remediation.
7. **Autonomous Judge Simulator**: A 10-second automated walk-through demonstrating file tree scanning, visual chart updates, simulated user traffic ticks, and auto-remediation.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Tailwind CSS v4, TypeScript)
- **AI Core**: Gemini 2.5 Flash (Dynamic route classification, product audits, expected schemas)
- **API Nodes**: Pendo Engage v1 API & GitHub Trees/Commits REST APIs
- **Styling**: Brutalist Technical aesthetics (strict HSL palettes, `#0a0a0a` surfaces, `#222` borders, and max `4px` border-radius bounds)
- **Deployment**: Vercel-ready, fully stateless

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_optional_github_token_for_private_repos
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Drift Report Telemetry Command Center.
