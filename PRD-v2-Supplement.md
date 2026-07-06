# DevStacker — PRD v2 Supplement

**Companion to:** Product Requirements Document v1.0 (Hitesh Shee)
**Status:** Draft
**Purpose:** Fills the gaps identified in the v1 vision doc — functional requirements, MVP scope, integration feasibility, measurable metrics, non-functional requirements, personas, risks, and monetization. Section numbers continue from v1 (which ended at §11).

---

## 12. Personas

Concrete personas that make the "Target Audience" list (v1 §7) actionable.

### Persona A — "Aarav", the CS Student / Job Seeker (Primary)
- **Context:** Final-year student, juggling coursework, side projects, and interview prep.
- **Goals:** Track DSA progress, keep resume versions straight, not lose momentum on side projects, know which interview is next.
- **Pains:** LeetCode streak lives in one tab, projects rot on GitHub, resume is 6 files named `resume_final_FINAL_v3.pdf`.
- **Success looks like:** Opens DevStacker each morning and instantly sees "today's DSA target, next interview, stalest project."

### Persona B — "Bianca", the Freelancer / Indie Hacker (Primary)
- **Context:** Runs 3–5 client and personal projects simultaneously; ships to Vercel/Render.
- **Goals:** See all active projects at a glance, monitor deployments, track which repos went stale, capture reusable snippets.
- **Pains:** Context-switch tax across clients; a broken deploy is discovered by the client, not her.
- **Success looks like:** One dashboard showing per-project status, latest deployment health, and this-week's shipped work.

### Persona C — "Chen", the Employed Software Engineer (Primary)
- **Context:** Full-time engineer, learns on the side, contributes to OSS.
- **Goals:** Organize technical notes/snippets, track personal growth, keep a developer journal.
- **Pains:** Knowledge scattered across Notion, gists, and bookmarks; no record of personal growth over time.
- **Success looks like:** Searchable personal knowledge base + weekly analytics on learning consistency.

> Personas A and B are the **MVP launch targets** — they feel the pain most acutely and have the least tooling budget to solve it themselves.

---

## 13. Functional Requirements (per module)

Format: each module gets a **purpose**, **core user stories**, and **acceptance criteria (AC)**. Priority tags: **P0** = MVP, **P1** = fast-follow, **P2** = later.

### 13.1 Personal Dashboard — **P0**
- **Purpose:** The single "morning screen" that aggregates signals from every other module.
- **User stories:**
  - As a user, I see today's priorities (tasks due, next interview, DSA target) on load.
  - As a user, I see active projects and which repos are stale (>N days without a push).
  - As a user, I see this week's activity summary (commits, problems solved, tasks done).
- **AC:**
  - Dashboard renders in < 2s with cached data; live data hydrates progressively.
  - Every widget deep-links to its source module.
  - Empty states guide first-time setup (connect GitHub, add first project).

### 13.2 GitHub Workspace — **P0**
- **Purpose:** Unified view of the user's repositories and activity via the GitHub API.
- **User stories:**
  - As a user, I connect my GitHub account (OAuth) and see all repos with last-push, language, stars, open issues.
  - As a user, I flag repos as "active/archived" and sort by staleness.
  - As a user, I see my contribution activity (commits/PRs) over time.
- **AC:**
  - OAuth flow with scoped, revocable tokens; read-only scopes at MVP.
  - Repo list paginates and caches; respects GitHub rate limits with backoff.
  - Handles private repos only if the user grants the scope.

### 13.3 Project Management — **P0**
- **Purpose:** Lightweight per-project workspace linking a GitHub repo, tasks, notes, and deploys.
- **User stories:**
  - As a user, I create a project, link a repo, and add tasks with status (todo/doing/done).
  - As a user, I see project progress as % of tasks complete.
  - As a user, I attach notes, snippets, and a deployment URL to a project.
- **AC:**
  - Kanban or list view; drag/reorder tasks.
  - A project aggregates references to other modules (repo, notes, deploys) without duplicating data.

### 13.4 Development Timeline — **P1**
- **Purpose:** Chronological, cross-module feed of the developer's activity.
- **User stories:** As a user, I scroll a timeline of commits, deploys, solved problems, and journal entries.
- **AC:** Filterable by module and date range; each event links to source.

### 13.5 Developer Journal — **P1**
- **Purpose:** Daily/weekly log of what was worked on and learned.
- **User stories:** As a user, I write dated entries with markdown and tags; I get an optional daily prompt.
- **AC:** Full-text search; tag filtering; entries feed the Timeline and Analytics.

### 13.6 DSA Progress Tracking — **P0 (manual) / P1 (integrated)**
- **Purpose:** Track interview-prep problem-solving.
- **User stories:**
  - As a user, I log solved problems (title, difficulty, topic, platform, date) — manually at MVP.
  - As a user, I see solved-by-topic/difficulty and a solving streak.
- **AC:**
  - Manual entry + CSV import at MVP (LeetCode has **no official public API** — see §15).
  - Streak and topic-coverage charts.

### 13.7 Resume Manager — **P0**
- **Purpose:** Version and track resumes and which version went where.
- **User stories:**
  - As a user, I upload resume versions and label them.
  - As a user, I record "sent version X to company Y on date Z."
- **AC:** File storage with versioning; a "sent log"; download/preview any version.

### 13.8 Notes & Documentation — **P1**
- **Purpose:** Markdown knowledge base, optionally linked to projects.
- **AC:** Nested/tagged notes, full-text search, project linking, markdown editor.

### 13.9 Bookmark Manager — **P1**
- **Purpose:** Save and organize learning resources/docs.
- **AC:** URL + title + tags + auto-fetched metadata (title/favicon); tag/search filtering.

### 13.10 Snippet Library — **P1**
- **Purpose:** Reusable code snippets with syntax highlighting.
- **AC:** Language-tagged, searchable, copy-to-clipboard, optional project link.

### 13.11 Deployment History — **P1**
- **Purpose:** Track deployments per project (Vercel/Render).
- **User stories:** As a user, I connect a deploy provider and see deploy status/history and the latest failing deploy.
- **AC:** Vercel API integration (has official API); manual entry fallback for others; status badges per project.

### 13.12 Analytics Dashboard — **P1**
- **Purpose:** Visualize productivity and learning consistency over time.
- **AC:** Weekly/monthly charts for commits, problems solved, tasks done, journal streak; no fabricated data — analytics reflect only connected/entered data.

### 13.13 AI Productivity Assistant — **P2 (see §17)**
- **Purpose:** Turn aggregated data into insights and actions.
- Defined fully in §17.

---

## 14. MVP Definition & Prioritization

The v1 doc lists 13 modules as if they ship together. They should not. Proposed release train:

| Release | Modules | Theme |
|---|---|---|
| **MVP (v1.0)** | Personal Dashboard, GitHub Workspace, Project Management, DSA Tracking (manual), Resume Manager | "One screen for my projects and prep." |
| **v1.1 (fast-follow)** | Notes & Docs, Snippet Library, Bookmark Manager, Developer Journal | "My personal knowledge base." |
| **v1.2** | Deployment History, Development Timeline, Analytics Dashboard | "See my activity and shipping health." |
| **v2.0** | AI Productivity Assistant, deeper integrations | "Insight and automation layer." |

**MVP rationale:** The 5 MVP modules cover the sharpest pains for Personas A and B, require only **one hard integration (GitHub)** plus manual/CSV entry elsewhere, and deliver a coherent "morning dashboard" story without waiting on APIs that don't exist.

**Explicitly out of MVP:** all AI features, team/multi-user, any integration beyond GitHub OAuth.

---

## 15. Integration Feasibility Matrix

The entire value prop is integration, so feasibility must be explicit. This is the highest-risk area.

| Tool | Official API? | Auth | MVP approach | Notes |
|---|---|---|---|---|
| **GitHub** | ✅ Yes (REST + GraphQL) | OAuth | Full read integration | Well-documented; rate-limited; the anchor integration. |
| **Vercel** | ✅ Yes | OAuth / token | v1.2 | Good deploy + status API. |
| **Render** | ✅ Yes (limited) | API key | v1.2 | Smaller API surface; manual fallback. |
| **Google Calendar** | ✅ Yes | OAuth | v1.1+ | Standard; needs Google verification for scopes. |
| **LeetCode** | ❌ No official public API | — | **Manual + CSV import** | Unofficial/GraphQL endpoints exist but are unstable/ToS-risky. Do **not** depend on them for core UX. |
| **Notion** | ✅ Yes | OAuth (integration token) | v2 | Possible, but DevStacker's own Notes may reduce need. |
| **YouTube** | ✅ Yes | API key | v2 (bookmarks) | For learning-resource metadata only. |
| **Cloud Storage (resumes)** | ✅ (own storage) | — | Own object storage at MVP | No third-party dependency needed. |

**Key takeaway:** Design every integrated module to **degrade gracefully to manual entry**. LeetCode especially must never be a hard dependency.

---

## 16. Success Metrics (measurable)

Replaces the aspirational list in v1 §10 with instrumented, target-bearing metrics.

### Activation
- **Time-to-first-value:** ≥ 60% of new users connect GitHub **or** create a project within their first session.
- **Setup completion:** ≥ 50% complete onboarding (≥1 integration + ≥1 project) within 24h.

### Engagement
- **D7 retention** ≥ 30%; **D30 retention** ≥ 15% (early-stage targets, revise post-launch).
- **Weekly active / signups** ≥ 25%.
- **"Morning open" behavior:** median active user opens the dashboard ≥ 4 days/week.

### Value realization
- **Integrations connected per active user:** median ≥ 1 by end of week 1.
- **Modules used per active user:** median ≥ 3.
- **Data density:** median active user has ≥ 3 projects or ≥ 10 tracked items after 30 days.

### Qualitative (surveyed)
- Post-onboarding NPS and a single "Does DevStacker reduce your tool-switching?" 1–5 pulse; target mean ≥ 4.0.

> All metrics require analytics instrumentation from day one (see §18 privacy constraints — analytics must be privacy-respecting and ideally self-hostable/anonymized).

---

## 17. AI Productivity Assistant — Definition (v2)

The v1 doc names this but never defines it. Scoped definition:

- **What it is:** An insight-and-action layer over the user's aggregated DevStacker data — **not** a general chatbot.
- **Core capabilities (v2.0):**
  1. **Daily briefing:** "3 stale repos, interview in 2 days, DSA streak at risk — here's your focus."
  2. **Nudges:** Detect a broken latest deployment, a lapsing streak, an untouched active project.
  3. **Natural-language query:** "Which projects haven't I touched this month?" / "Where's the architecture diagram for Project X?"
  4. **Summarization:** Weekly recap of shipped work drawn from commits, deploys, and journal.
- **Model:** Built on the Claude API (e.g., a current Claude model) with the user's aggregated data as retrieval context.
- **Guardrails:** Read-only over user data at v2.0; no autonomous external actions without explicit confirmation; all data sent to the model is disclosed and user-consented (see §18).
- **Non-goals:** Not a code-generation IDE assistant (VS Code/Copilot own that); not a replacement for search.

---

## 18. Non-Functional Requirements

The v1 doc has none. These are load-bearing for a product that aggregates a developer's entire footprint.

### Security & Privacy (critical — this is a trust product)
- OAuth tokens encrypted at rest; least-privilege, revocable scopes; read-only at MVP.
- No selling/sharing of user data; clear data-deletion path (full account export + delete).
- Resumes and private repo data treated as sensitive PII; encrypted storage.
- The AI assistant must disclose exactly what data is sent to the model and require consent.

### Performance
- Dashboard first meaningful paint < 2s on cached data.
- Third-party API calls cached and rate-limit-aware; never block core UI on a slow integration.

### Reliability & Availability
- Graceful degradation: any integration can be down and the app still works on cached/manual data.
- Target 99.5% availability at launch.

### Architecture (proposed, non-binding)
- Web-first SPA (e.g., React/Next.js) + API backend; relational DB for structured data + object storage for files.
- Integration layer isolated behind an adapter interface so each tool (or its manual fallback) is swappable.
- Auth via a managed provider (OAuth + email).

### Accessibility & Platform
- WCAG 2.1 AA target; responsive web (desktop-first, mobile-usable); mobile app is long-term (v1 §11).

---

## 19. Assumptions, Constraints & Dependencies

- **Assumption:** Users are willing to grant GitHub OAuth — if not, the core value drops sharply. Validate early.
- **Assumption:** Manual/CSV entry is acceptable UX for LeetCode-style unintegrable tools.
- **Constraint:** Solo/small-team build implies the phased scope in §14 is a hard requirement, not a suggestion.
- **Dependency:** GitHub, Vercel, Google API availability, terms, and rate limits.
- **Constraint:** Google OAuth scopes require app verification — budget time for it before Calendar integration.

---

## 20. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope sprawl (13 modules at once) | High — never ships | Enforce §14 release train; MVP = 5 modules. |
| Key tools have no API (LeetCode) | Medium | Manual + CSV; never a hard dependency (§15). |
| "Yet another dashboard" — thin value | High | Lead with integration + the AI insight layer as the moat, not CRUD features. |
| Data trust / security breach | Severe | §18 security posture; read-only scopes at MVP; encryption. |
| Low retention (novelty then abandon) | High | Optimize the "morning open" habit loop; measure D7/D30 (§16). |
| Integration maintenance burden | Medium | Adapter pattern; fail gracefully; limit integrations per release. |

---

## 21. Out of Scope (v1.x)

Explicitly **not** building initially, to protect focus:
- Team/multi-user collaboration, org workspaces, shared projects.
- Being an IDE or code editor (VS Code owns this).
- Replacing Notion/Jira/GitHub as systems of record.
- CI/CD execution (only monitoring later).
- Mobile native apps.

---

## 22. Open Questions (for author decision)

1. **Monetization:** free, freemium (free core + paid integrations/AI), or paid? Not addressed in v1 — needed before build.
2. **Hosting model:** SaaS only, or self-hostable (appealing to the privacy-conscious dev audience)?
3. **Which single module is the "hook"** that gets a dev to return daily — Dashboard, or something sharper?
4. **AI timing:** is the AI assistant actually the headline (pull it earlier) or a genuine v2?
5. **Data residency / compliance** targets (GDPR at minimum, given PII)?

---

*This supplement is intended to be merged into a consolidated PRD v2.0. Recommend converting the original PDF to Markdown and combining §1–11 (v1) with §12–22 here.*
