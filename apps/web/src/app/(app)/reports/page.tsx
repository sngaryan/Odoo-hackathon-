"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer, type ToastMessage } from "@/components/Toast";
import { 
  FileText, 
  Settings, 
  Download, 
  Eye, 
  Calendar, 
  Filter, 
  Layers, 
  CheckSquare, 
  Square,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";

type ReportType = "governance" | "issues" | "audits";

type GovRecord = { id: string; title: string; version: string; summary: string; status: string; date: string; department: string };
type IssueRecord = { id: string; title: string; severity: string; status: string; date: string; dueDate: string; department: string; auditor: string };
type AuditRecord = { id: string; title: string; scope: string; date: string; status: string; auditor: string; department: string };

const mockGovData: GovRecord[] = [
  { id: "g1", title: "Environmental Data Integrity", version: "1.0", summary: "Every ESG record must be traceable, timely, and supported by evidence.", status: "ACTIVE", date: "2026-07-01", department: "Quality & Risk Compliance" },
  { id: "g2", title: "Responsible Workplace Guidelines", version: "2.1", summary: "Sets expectations for inclusive, safe, and ethical workplace conduct.", status: "ACTIVE", date: "2026-07-05", department: "Legal & Governance" },
  { id: "g3", title: "Supply Chain Traceability Standard", version: "1.2", summary: "Carbon and social accountability standard compliance among suppliers.", status: "DRAFT", date: "2026-07-10", department: "Operations & Supply Chain" },
  { id: "g4", title: "Anti-Bribery and Corruption Code", version: "3.0", summary: "Zero-tolerance guidelines for unethical payments and corrupt actions.", status: "ACTIVE", date: "2026-06-15", department: "Legal & Governance" },
];

const mockIssuesData: IssueRecord[] = [
  { id: "i1", title: "Supplier evidence renewal due", severity: "HIGH", status: "IN_PROGRESS", date: "2026-07-04", dueDate: "2026-07-20", department: "Sustainability Operations", auditor: "Supplier Assurance Assessment" },
  { id: "i2", title: "Travel emissions variance review", severity: "MEDIUM", status: "OPEN", date: "2026-07-08", dueDate: "2026-07-25", department: "Corporate Services", auditor: "FY26 ESG Controls Review" },
  { id: "i3", title: "Water usage sensor calibration", severity: "LOW", status: "RESOLVED", date: "2026-06-20", dueDate: "2026-06-30", department: "Operations & Supply Chain", auditor: "Q2 Environmental Review" },
  { id: "i4", title: "Social impact metric mismatch", severity: "MEDIUM", status: "IN_PROGRESS", date: "2026-07-02", dueDate: "2026-07-15", department: "Corporate Services", auditor: "FY26 Social Impact Audit" },
];

const mockAuditsData: AuditRecord[] = [
  { id: "a1", title: "Supplier Assurance Assessment", scope: "Evidence and supplier emissions due diligence", date: "2026-07-18", status: "IN_PROGRESS", auditor: "Ananya Rao", department: "ESG Risk Management" },
  { id: "a2", title: "FY26 ESG Controls Review", scope: "Environmental reporting controls and trace validation", date: "2026-07-02", status: "COMPLETED", auditor: "Sarah Jenkins", department: "Quality & Risk Compliance" },
  { id: "a3", title: "Q2 Environmental Review", scope: "Waste and water sensor log audit", date: "2026-06-25", status: "COMPLETED", auditor: "Michael Chang", department: "Operations & Supply Chain" },
  { id: "a4", title: "FY26 Social Impact Audit", scope: "Diversity indices and community actions audit", date: "2026-07-22", status: "PLANNED", auditor: "Sarah Jenkins", department: "Corporate Services" },
];

const allColumns: Record<ReportType, { key: string; label: string }[]> = {
  governance: [
    { key: "title", label: "Policy Title" },
    { key: "version", label: "Version" },
    { key: "summary", label: "Summary" },
    { key: "status", label: "Status" },
    { key: "date", label: "Published Date" },
    { key: "department", label: "Department" },
  ],
  issues: [
    { key: "title", label: "Issue Title" },
    { key: "severity", label: "Severity" },
    { key: "status", label: "Status" },
    { key: "date", label: "Opened Date" },
    { key: "dueDate", label: "Due Date" },
    { key: "department", label: "Responsible Owner" },
    { key: "auditor", label: "Audit Source" },
  ],
  audits: [
    { key: "title", label: "Audit Title" },
    { key: "scope", label: "Audit Scope" },
    { key: "date", label: "Scheduled Date" },
    { key: "status", label: "Status" },
    { key: "auditor", label: "Lead Auditor" },
    { key: "department", label: "Host Department" },
  ],
};

let nextToastId = 0;
function getNextToastId() {
  nextToastId += 1;
  return `toast-${nextToastId}-${Date.now()}`;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("governance");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = getNextToastId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Reset columns when report type changes
  useEffect(() => {
    const defaultCols = allColumns[reportType].map((col) => col.key);
    setSelectedColumns(defaultCols);
  }, [reportType]);

  // Apply filters and updates preview data
  useEffect(() => {
    let sourceData: any[] = [];
    if (reportType === "governance") sourceData = [...mockGovData];
    else if (reportType === "issues") sourceData = [...mockIssuesData];
    else if (reportType === "audits") sourceData = [...mockAuditsData];

    // Filter by Department
    if (selectedDept !== "all") {
      sourceData = sourceData.filter((row) => row.department === selectedDept);
    }

    // Filter by Date Range
    if (startDate) {
      sourceData = sourceData.filter((row) => new Date(row.date) >= new Date(startDate));
    }
    if (endDate) {
      sourceData = sourceData.filter((row) => new Date(row.date) <= new Date(endDate));
    }

    setPreviewData(sourceData);
  }, [reportType, selectedDept, startDate, endDate]);

  // Get list of unique departments for filter dropdown
  const getDepartments = () => {
    let sourceData: { department: string }[] = [];
    if (reportType === "governance") sourceData = mockGovData;
    else if (reportType === "issues") sourceData = mockIssuesData;
    else if (reportType === "audits") sourceData = mockAuditsData;

    const depts = new Set(sourceData.map((row) => row.department));
    return Array.from(depts);
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(allColumns[reportType].map((col) => col.key));
  };

  const clearAllColumns = () => {
    setSelectedColumns([]);
  };

  const generateCSVContent = () => {
    const activeHeaders = allColumns[reportType].filter((col) =>
      selectedColumns.includes(col.key)
    );
    const headerRow = activeHeaders.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");
    const bodyRows = previewData.map((row) =>
      activeHeaders
        .map((col) => {
          const val = row[col.key] ?? "";
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    return [headerRow, ...bodyRows].join("\n");
  };

  const exportCSV = async () => {
    if (selectedColumns.length === 0) {
      showToast("Please select at least one column to export.", "error");
      return;
    }
    setIsExporting("csv");
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const csv = generateCSVContent();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ecosphere-custom-${reportType}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Custom CSV report generated and downloaded.", "success");
    } catch {
      showToast("Unable to download CSV report.", "error");
    } finally {
      setIsExporting(null);
    }
  };

  const exportPDF = async () => {
    if (selectedColumns.length === 0) {
      showToast("Please select at least one column to export.", "error");
      return;
    }
    setIsExporting("pdf");

    // Open clean print page
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please enable pop-ups to generate PDF.", "error");
      setIsExporting(null);
      return;
    }

    try {
      const activeHeaders = allColumns[reportType].filter((col) =>
        selectedColumns.includes(col.key)
      );

      let tableHeadersHtml = activeHeaders
        .map((col) => `<th style="text-align: left; padding: 12px 10px; border-bottom: 2px solid #0f766e; font-size: 11px; text-transform: uppercase; color: #0f766e; font-weight: 700;">${col.label}</th>`)
        .join("");
      
      let tableRowsHtml = previewData
        .map((row) => {
          let tds = activeHeaders
            .map((col) => {
              const val = row[col.key] ?? "N/A";
              return `<td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${val}</td>`;
            })
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>EcoSphere ESG Audit Report - ${reportType.toUpperCase()}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: 800; color: #0f766e; }
              .logo span { color: #10b981; }
              .meta { font-size: 11px; text-align: right; color: #64748b; }
              .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
              .subtitle { font-size: 13px; color: #475569; margin-top: 0; }
              .filter-badge { display: inline-block; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; margin-bottom: 25px; color: #475569; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .footer { margin-top: 80px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
              .signature-box { width: 220px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; margin-top: 50px; font-weight: 600; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">Eco<span>Sphere</span></div>
                <p style="margin: 2px 0 0 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-weight: 700;">ESG Operations Hub</p>
              </div>
              <div class="meta">
                <p style="margin: 0;"><strong>Scope:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Audit Log</p>
                <p style="margin: 4px 0 0 0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}</p>
              </div>
            </div>

            <h1 class="title">Corporate Compliance & Audit Report</h1>
            <p class="subtitle font-medium">Official data trail extract from the EcoSphere ESG Command Center.</p>

            <div class="filter-badge">
              <strong>Query Parameters:</strong> &nbsp;&nbsp;&nbsp; 
              Department: <span style="color:#0f172a; font-weight:600;">${selectedDept === "all" ? "All Departments" : selectedDept}</span> &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; 
              Date Range: <span style="color:#0f172a; font-weight:600;">${startDate || "Beginning"}</span> to <span style="color:#0f172a; font-weight:600;">${endDate || "Present"}</span>
            </div>

            <table>
              <thead>
                <tr>${tableHeadersHtml}</tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>

            <div class="footer">
              <div class="signature-box">
                Lead Auditor Sign-off
              </div>
              <div class="signature-box">
                Director of Governance
              </div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      showToast("Audit PDF compiled successfully.", "success");
    } catch {
      showToast("Unable to compile PDF report.", "error");
    } finally {
      setIsExporting(null);
    }
  };

  const renderAnalyticsSummary = () => {
    if (previewData.length === 0) return null;

    if (reportType === "governance") {
      const activeCount = previewData.filter((r) => r.status === "ACTIVE").length;
      const pct = Math.round((activeCount / previewData.length) * 100);
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy Completion</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pct}%</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Policies</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{activeCount} <span className="text-xs text-slate-400 font-medium">/ {previewData.length} total</span></p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Departments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{new Set(previewData.map(r => r.department)).size}</p>
          </div>
        </div>
      );
    }

    if (reportType === "issues") {
      const highCount = previewData.filter((r) => r.severity === "HIGH").length;
      const resolvedCount = previewData.filter((r) => r.status === "RESOLVED").length;
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High Severity Gaps</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{highCount}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Require immediate mitigation</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolution Status</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-inset ring-amber-600/10">
                {previewData.length - resolvedCount} Open
              </span>
              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
                {resolvedCount} Resolved
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3.5 overflow-hidden flex">
              <div className="bg-emerald-500 h-1.5" style={{ width: `${(resolvedCount / previewData.length) * 100}%` }}></div>
              <div className="bg-amber-400 h-1.5" style={{ width: `${((previewData.length - resolvedCount) / previewData.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Teams</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{new Set(previewData.map(r => r.department)).size}</p>
          </div>
        </div>
      );
    }

    if (reportType === "audits") {
      const completedCount = previewData.filter((r) => r.status === "COMPLETED").length;
      const plannedCount = previewData.filter((r) => r.status === "PLANNED").length;
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Coverage</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{previewData.length} Total Audits</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Status Breakdown</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-emerald-600">{completedCount} Done</span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] font-bold text-blue-600">{previewData.length - completedCount - plannedCount} Active</span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] font-bold text-slate-500">{plannedCount} Planned</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Auditors</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{new Set(previewData.map(r => r.auditor)).size}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Reporting Engine</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">Custom Report Query Builder</h1>
          <p className="mt-2 text-sm text-slate-600">
            Build custom reports, configure layout parameters, filter indices, and preview compiled data trails.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Query Configurator Panel */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Settings className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              Configure Query
            </h2>

            <div className="space-y-5">
              {/* 1. Report Source */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Data Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["governance", "issues", "audits"] as ReportType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setReportType(type);
                        setSelectedDept("all");
                      }}
                      className={`rounded-lg px-2 py-3 text-xs font-bold border transition text-center cursor-pointer ${
                        reportType === type
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Department Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Filter by Owner / Department
                </label>
                <div className="relative">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {getDepartments().map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 3. Date Range */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  3. Select Date Range
                </label>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Start Date
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      End Date
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Column Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    4. Select Columns
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllColumns}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      All
                    </button>
                    <span className="text-[10px] text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllColumns}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 rounded-lg p-3 bg-slate-50">
                  {allColumns[reportType].map((col) => {
                    const isChecked = selectedColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => handleColumnToggle(col.key)}
                        className="flex items-center gap-2.5 w-full text-left py-1 text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                        )}
                        <span>{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Table Preview & Export Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-full min-h-[500px]">
            {/* Table Header and Export triggers */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  Live Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displaying {previewData.length} records matching current filter schema.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isExporting !== null || previewData.length === 0}
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  {isExporting === "csv" ? "Exporting..." : "CSV"}
                </button>
                <button
                  type="button"
                  disabled={isExporting !== null || previewData.length === 0}
                  onClick={exportPDF}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  {isExporting === "pdf" ? "Compiling..." : "Compile PDF"}
                </button>
              </div>
            </div>

            {/* Impressive Analytics Summary Component */}
            <ErrorBoundary>
              {renderAnalyticsSummary()}
            </ErrorBoundary>

            {/* Preview Table View */}
            <div className="flex-1 overflow-x-auto">
              <ErrorBoundary>
                {selectedColumns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Layers className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No Columns Selected</p>
                    <p className="text-xs text-slate-400 mt-1">Check columns on the left panel to build your table layout.</p>
                  </div>
                ) : previewData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Filter className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No Data Found</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust filters or select a different date range.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                        {allColumns[reportType]
                          .filter((col) => selectedColumns.includes(col.key))
                          .map((col) => (
                            <th key={col.key} className="px-4 py-3">
                              {col.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          {allColumns[reportType]
                            .filter((col) => selectedColumns.includes(col.key))
                            .map((col) => (
                              <td key={col.key} className="px-4 py-3 max-w-xs truncate">
                                {col.key === "status" ? (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                      row[col.key] === "ACTIVE" || row[col.key] === "COMPLETED" || row[col.key] === "RESOLVED"
                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
                                        : row[col.key] === "IN_PROGRESS" || row[col.key] === "DRAFT"
                                        ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10"
                                        : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10"
                                    }`}
                                  >
                                    {row[col.key]}
                                  </span>
                                ) : (
                                  row[col.key] ?? "N/A"
                                )}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </section>
  );
}
