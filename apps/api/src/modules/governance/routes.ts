import { AuditStatus, IssueSeverity, IssueStatus, PolicyStatus, Prisma } from "@prisma/client";
import { Router, type Response } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate.js";
import { prisma } from "../../prisma.js";

export const governanceRouter = Router();
governanceRouter.use(authenticate);

const governanceRoles = ["ADMIN", "AUDITOR"] as const;
const reportRoles = ["ADMIN", "AUDITOR", "ESG_MANAGER"] as const;
const listQuery = z.object({ page: z.coerce.number().int().positive().default(1), pageSize: z.coerce.number().int().positive().max(100).default(20), status: z.string().optional() });
const policyInput = z.object({ title: z.string().min(3), version: z.string().min(1), summary: z.string().min(5), status: z.nativeEnum(PolicyStatus).default(PolicyStatus.DRAFT) });
const auditInput = z.object({ title: z.string().min(3), scope: z.string().min(3), auditDate: z.coerce.date(), auditorId: z.string().min(1), status: z.nativeEnum(AuditStatus).default(AuditStatus.PLANNED) });
const issueInput = z.object({ auditId: z.string().optional(), title: z.string().min(3), description: z.string().min(3), severity: z.nativeEnum(IssueSeverity), ownerId: z.string().optional() });

function requireRole(roles: readonly string[], role: string, res: Response) {
  if (roles.includes(role)) return true;
  res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not have access to this action." } });
  return false;
}
function pageMeta(page: number, pageSize: number, total: number) { return { page, pageSize, total }; }
function validationError(res: Response, message: string) { res.status(422).json({ error: { code: "VALIDATION_ERROR", message } }); }

governanceRouter.get("/policies", async (req, res) => {
  const query = listQuery.parse(req.query); const where = query.status ? { status: query.status as PolicyStatus } : {};
  const [data, total] = await prisma.$transaction([prisma.policy.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { acknowledgements: { where: { userId: req.user.sub }, select: { acknowledgedAt: true } }, _count: { select: { acknowledgements: true } } } }), prisma.policy.count({ where })]);
  res.json({ data: data.map(({ acknowledgements, ...policy }) => ({ ...policy, acknowledgedAt: acknowledgements[0]?.acknowledgedAt ?? null })), meta: pageMeta(query.page, query.pageSize, total) });
});
governanceRouter.post("/policies", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const parsed = policyInput.safeParse(req.body); if (!parsed.success) return validationError(res, "Invalid policy details.");
  const data = await prisma.policy.create({ data: { ...parsed.data, publishedAt: parsed.data.status === PolicyStatus.ACTIVE ? new Date() : null } }); res.status(201).json({ data });
});
governanceRouter.post("/policies/:id/acknowledge", async (req, res) => {
  const policy = await prisma.policy.findFirst({ where: { id: req.params.id, status: PolicyStatus.ACTIVE } }); if (!policy) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Active policy not found." } });
  try { const data = await prisma.policyAcknowledgement.create({ data: { policyId: policy.id, userId: req.user.sub } }); res.status(201).json({ data }); } catch { res.status(409).json({ error: { code: "INVALID_STATE", message: "Policy already acknowledged." } }); }
});

governanceRouter.get("/audits", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const query = listQuery.parse(req.query); const where = query.status ? { status: query.status as AuditStatus } : {};
  const [data, total] = await prisma.$transaction([prisma.audit.findMany({ where, orderBy: { auditDate: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { issues: { select: { id: true, status: true, severity: true } } } }), prisma.audit.count({ where })]); res.json({ data, meta: pageMeta(query.page, query.pageSize, total) });
});
governanceRouter.post("/audits", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const parsed = auditInput.safeParse(req.body); if (!parsed.success) return validationError(res, "Invalid audit details."); const data = await prisma.audit.create({ data: parsed.data }); res.status(201).json({ data });
});

governanceRouter.get("/compliance-issues", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const query = listQuery.parse(req.query); const where = query.status ? { status: query.status as IssueStatus } : {};
  const [data, total] = await prisma.$transaction([prisma.complianceIssue.findMany({ where, orderBy: [{ severity: "desc" }, { openedAt: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { audit: { select: { title: true } }, owner: { select: { name: true, email: true } } } }), prisma.complianceIssue.count({ where })]); res.json({ data, meta: pageMeta(query.page, query.pageSize, total) });
});
governanceRouter.post("/compliance-issues", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const parsed = issueInput.safeParse(req.body); if (!parsed.success) return validationError(res, "Invalid issue details."); const { auditId, ownerId, ...issue } = parsed.data; const data = await prisma.complianceIssue.create({ data: { ...issue, ...(auditId ? { auditId } : {}), ...(ownerId ? { ownerId } : {}) } }); res.status(201).json({ data });
});
governanceRouter.patch("/compliance-issues/:id", async (req, res) => {
  if (!requireRole(governanceRoles, req.user.role, res)) return; const parsed = z.object({ status: z.nativeEnum(IssueStatus), ownerId: z.string().nullable().optional() }).safeParse(req.body); if (!parsed.success) return validationError(res, "Provide a valid issue status.");
  const issue = await prisma.complianceIssue.findUnique({ where: { id: req.params.id } }); if (!issue) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Issue not found." } }); if (issue.status === IssueStatus.RESOLVED && parsed.data.status !== IssueStatus.RESOLVED) return res.status(409).json({ error: { code: "INVALID_STATE", message: "Resolved issues cannot be reopened." } });
  const data = await prisma.complianceIssue.update({ where: { id: issue.id }, data: { status: parsed.data.status, ...(parsed.data.ownerId !== undefined ? { ownerId: parsed.data.ownerId } : {}), resolvedAt: parsed.data.status === IssueStatus.RESOLVED ? new Date() : null } }); res.json({ data });
});

governanceRouter.get("/dashboard/overview", async (req, res) => {
  const [activePolicies, acknowledgedPolicies, openIssues, criticalIssues, audits] = await Promise.all([prisma.policy.count({ where: { status: PolicyStatus.ACTIVE } }), prisma.policyAcknowledgement.count({ where: { userId: req.user.sub } }), prisma.complianceIssue.count({ where: { status: { not: IssueStatus.RESOLVED } } }), prisma.complianceIssue.findMany({ where: { status: { not: IssueStatus.RESOLVED }, severity: { in: [IssueSeverity.HIGH, IssueSeverity.CRITICAL] } }, orderBy: { severity: "desc" }, take: 5, select: { id: true, title: true, severity: true, status: true } }), prisma.audit.count({ where: { status: AuditStatus.COMPLETED } })]);
  res.json({ data: { kpis: { activePolicies, acknowledgedPolicies, openIssues, completedAudits: audits }, riskList: criticalIssues } });
});

governanceRouter.post("/reports/generate", async (req, res) => {
  if (!requireRole(reportRoles, req.user.role, res)) return; const parsed = z.object({ type: z.enum(["governance", "issues", "audits"]), format: z.literal("csv"), filters: z.record(z.string(), z.unknown()).default({}) }).safeParse(req.body); if (!parsed.success) return validationError(res, "Reports must specify a CSV type and filters.");
  const run = await prisma.reportRun.create({ data: { userId: req.user.sub, type: parsed.data.type, format: parsed.data.format, filters: parsed.data.filters as Prisma.InputJsonValue } });
  const issues = await prisma.complianceIssue.findMany({ include: { audit: { select: { title: true } }, owner: { select: { name: true } } }, orderBy: { openedAt: "desc" } });
  const csv = ["Issue,Severity,Status,Owner,Audit,Opened", ...issues.map((issue) => [issue.title, issue.severity, issue.status, issue.owner?.name ?? "Unassigned", issue.audit?.title ?? "", issue.openedAt.toISOString().slice(0, 10)].map((v) => `\"${v.replaceAll('\"', '\"\"')}\"`).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", `attachment; filename=ecosphere-${parsed.data.type}-${run.id}.csv`); res.send(csv);
});
