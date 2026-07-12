# API Contract

Base: `/api/v1`. All protected routes return 401 without a valid token and 403 without the stated role. Lists accept `page`, `pageSize`, `search`, `departmentId`, and relevant status/date filters; respond with `{data, meta:{page,pageSize,total}}`.

| Method/path | Roles | Purpose |
|---|---|---|
| POST `/auth/login` | public | `{email,password}` → `{token,user}` |
| GET `/auth/me` | all | current user and permissions |
| GET `/dashboard/overview` | all scoped | KPI cards, trends, rank, active challenge, risk list |
| GET/POST `/emission-factors` | read all / admin, ESG | list/create factor |
| GET/POST `/carbon-transactions` | scoped / admin, ESG | list/create carbon record; create body has factorId, quantity, source, occurredOn |
| GET/PATCH `/environmental-goals/:id` | scoped / admin, ESG | goal detail/update; POST `/environmental-goals` creates |
| GET/POST `/csr-activities` | all / HR, ESG | catalog/create; POST `/:id/join` employee joins |
| GET/POST `/challenges` | all / admin, HR, ESG | catalog/create; POST `/:id/join` |
| POST `/challenge-participations/:id/proof` | owner | multipart field `proof`; status → `UNDER_REVIEW` |
| POST `/challenge-participations/:id/review` | admin, HR, ESG | `{decision:'APPROVE'|'REJECT',feedback?}` |
| GET `/leaderboard` | all | ranked users; `range=month|all`, departmentId |
| GET `/badges` | all | gallery with earned/locked state |
| GET/POST `/policies` | all / admin, compliance | policies; POST `/:id/acknowledge` |
| GET/POST `/audits` | compliance, admin / compliance, admin | audits |
| GET/POST/PATCH `/compliance-issues` | compliance, admin / compliance, admin | issue CRUD/status resolution |
| POST `/reports/generate` | admin, ESG, compliance | `{type,format:'csv',filters}` → download metadata |
| GET `/settings/departments` | all / admin | reference data; same pattern for badges/config |

Validation failures are `422 VALIDATION_ERROR`; missing resources are `404 NOT_FOUND`; invalid lifecycle changes are `409 INVALID_STATE`; upload types/sizes are `415/413`. Never return Prisma errors or password hashes.
