# 🚨 Drift Report: Autonomous Telemetry Command Center

> **Is your product flying blind?** 
> You refactor a directory, rename a route, or push a feature flag, and your Pendo/Novus telemetry silently disintegrates. Your metrics break, conversion funnels go blind, and your team makes decisions based on ghost schemas. 
>
> **Drift Report** automatically audits, validates, and bridges the drift between codebase routes and Pendo analytics schemas. Stop tracking rot before it hits production.

---

## ⚡ The 15 Domination Loops

Drift Report was engineered to completely secure victory at the World Product Day Hackathon by providing an end-to-end command center for telemetry auditing:

1. **Feature Flag & Git Sparkline Drift (Loop 1)**: Track score trends across git commits with a custom brutalist SVG Sparkline and detect routes locked behind active flags (`flags.ts`) that lack matching tracking rules.
2. **Traffic-Weighted Severity Grid (Loop 2)**: Prioritizes telemetry debt by matching route views to Est. Monthly Views and Est. Revenue at Risk ($/mo), focusing team efforts on critical funnels first.
3. **One-Click Issue Exporters (Loop 3)**: Auto-generate pre-filled markdown tickets for **GitHub Issues** and **Linear** directly from telemetry gap cards.
4. **Gemini Visual Component Audits (Loop 4)**: Maps route structures to mock UI elements (e.g., `StripeElement`, `AuthCard`, `LineChart`) to feed Gemini 2.5 Flash for contextual PM feedback.
5. **Simulated Chrome HUD & Sitemap Scan (Loop 5)**: PMs can scan site structures without GitHub keys using the No-Code Sitemap Scan or test overlays using the floating simulated Chrome Extension Drift HUD.
6. **Offline Mock Resiliency (Loop 6/15)**: Instantly handles third-party API rate limits by falling back to local simulation caches and displays a warning banner.
7. **CI/CD Telemetry Guardrails (Loop 7)**: Generates a copy-pasteable GitHub Action configuration that blocks pull requests if codebase-to-analytics coverage falls below target thresholds.
8. **Next.js Glob-to-Regex Translator (Loop 8)**: Upgraded path matcher parsing Next.js catch-all (`[...slug]`) and optional catch-all (`[[...slug]]`) routing patterns to prevent matching noise.
9. **Pendo Shadow Schema Map (Loop 9)**: Gemini reads route structures to predict expected telemetry schemas (key/type pairs), catching parameter mismatches.
10. **Zombie Telemetry Detection (Loop 10)**: Scans your active Pendo rule list to identify "Zombie rules" tracking dead routes that no longer exist in the codebase.
11. **Payload Schema Warning (Loop 11)**: Scans analytics snippets to catch invalid keys or placeholder configurations (`undefined` / `empty`), providing one-click remediation.
12. **Compressed Share State (Loop 12)**: Serializes report diagnostics into highly compressed, safe Base64 URL sharing strings that bypass browser length limits and avoid decoding crashes.
13. **Self-Telemetry Loop (Loop 13)**: Integrates `window.pendo.track` to record user interactions (`run_judge_demo`, `remediate_payload`) back into the dashboard's own analytics nodes.
14. **Autonomous Judge Simulator (Loop 14)**: A 10-second automated walk-through demonstrating file tree scanning, visual chart updates, simulated user traffic ticks, and auto-remediation.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Tailwind CSS, TypeScript)
- **AI Core**: Gemini 2.5 Flash (Dynamic classification, product audits, expected schemas)
- **API Nodes**: Pendo Engage v1 API & GitHub Trees API proxies
- **Styling**: Brutalist Technical aesthetics (strict HSL palettes, `#0a0a0a` surfaces, `#222` borders, and max `4px` border-radius bounds)
- **Deployment**: Vercel-ready, fully stateless (zero database, zero auth, zero session storage)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment variables
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
