# EcoSphere Hackathon Master Plan

## North-star demo

An ESG manager logs a fleet fuel transaction; EcoSphere calculates CO₂e and shows progress against a department goal. An employee then completes a green-commute challenge, an admin approves proof, and the employee’s XP/badge plus the dashboard leaderboard update. The manager closes by generating an ESG summary with a governance risk visible. This demonstrates all four pillars as one system.

## Scope and priorities

| Priority | Ship decision |
|---|---|
| P0 | Auth/RBAC; shared shell; seeded login; dashboard; carbon transaction → CO₂e; goals; challenge join/proof/approve → XP; audits/issues; CSV report |
| P1 | CSR activity/join/approval; policy acknowledgement; badge gallery; department filters; local evidence upload; polished drawers, charts and empty states |
| P2 | Product ESG profiles; rewards redemption; custom report filter builder; notification preferences; live score tuning |
| P3 — cut | Password reset, refresh tokens, external Odoo sync, PDF/XLSX generation, real-time sockets, comprehensive audit log, multi-tenant support |

## Architecture decision

One PostgreSQL database and one Express API serve one Next.js frontend. The API owns validation, authorization, calculations and database writes. Next.js never accesses Prisma directly. JWT access tokens are held in memory during the demo; the user re-authenticates after refresh. This is safe enough for a hackathon and avoids cookie/refresh complexity.

## Dependency-free feature ownership

| Owner | Vertical slice | First merge |
|---|---|---|
| A | Platform: repo scaffold, auth, RBAC, shared API conventions, app shell | H2 |
| B | Environmental: factors, carbon transactions, goals, environmental dashboard data | H4 |
| C | Social + Gamification: CSR, challenges, evidence, approval, XP/badges/leaderboard | H4 |
| D | Governance + Reports: policies, audits, issues, executive dashboard composition/report CSV | H4 |

All teams use the seed contract from `03_DATABASE.md`; nobody waits for another feature API. In Hours 0–2, each vertical slice can return a local typed mock behind the same endpoint contract; replace with Prisma before its H4 merge.

## Eight-hour execution plan

| Time | Everyone / merge gate | A | B | C | D |
|---|---|---|---|---|---|
| H0 | Agree data contract, create branches, assign demo roles | scaffold/API conventions | env screens/data map | game states/data map | governance/report screens/data map |
| H1 | runnable shell + seed spec | auth + RBAC | transaction form/list | challenge catalog/join | audit/issues list |
| H2 | **Merge 1:** shell, auth, shared types | login/protected layout | CO₂e calculation | proof upload UI | policy acknowledgement |
| H3 | smoke test main | loading/error primitives | goals + environmental chart | admin approval → XP | report CSV endpoint |
| H4 | **Merge 2:** vertical P0 slices | integration fixes | env flow polished | game flow polished | dashboard/risk flow |
| H5 | full story rehearsal | RBAC audit | filters/drawer | badges/leaderboard | report page/CSR if time |
| H6 | **Merge 3:** feature freeze P0 | quality pass | seed realism | micro-interactions | demo data/visual QA |
| H7 | final demo rehearsal; no new features | build/deploy | bug fixes | bug fixes | bug fixes |
| H8 | **Final merge:** tagged submission | presenter backup | demo operator | demo operator | demo operator |

## Merge checkpoints

- H2: `main` runs login and shows all navigation routes. Do not merge unconnected UI.
- H4: only complete vertical P0 flows, each with seed data and an error state.
- H6: feature freeze. Merge only tests, visual polish, data corrections and demo reliability.
- H8: clean install/build, 4-minute rehearsal, screenshots/backup recording.

## Current progress board (update at every stand-up)

| Area | Owner | API | UI | DB | Remaining |
|---|---|---|---|---|---|
| Platform/auth | A | ⬜ | ⬜ | ⬜ | all |
| Environmental | B | ⬜ | ⬜ | ⬜ | all |
| Social/gamification | C | ⬜ | ⬜ | ⬜ | all |
| Governance/reports | D | ⬜ | ⬜ | ⬜ | all |

## Risk controls and fallback

| Risk | Prevention | Fallback |
|---|---|---|
| Integration breaks | merge at H2/H4/H6; one shared API envelope | show locally seeded flows in one stable branch |
| Prisma/migrations stall | seed core entities once; use `db push` during development | retain seed JSON service adapter for demo, explain as offline demo mode only if forced |
| Upload issues | accept only jpg/png/pdf under 5 MB | use seeded evidence URL and preserve lifecycle |
| Time loss | P0 fixed by H4 | cut P1/P2 immediately; never cut the cross-module story |
| Empty-looking product | realistic seed data, trends, names and statuses | pre-seed before rehearsal; no blank dashboard |

## Winning criteria

Polish the one connected story. Use clear metric labels, visual status semantics, drawers instead of context-losing navigation, and small celebratory feedback after approval. Judges should see business value and operational credibility in the first 30 seconds.
