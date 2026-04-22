import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Filter,
  Calendar,
  MapPin,
  AlertTriangle,
  Shield,
  Loader2,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface IncidentReport {
  id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  is_anonymous: boolean;
  reporter_name: string | null;
  created_at: string;
  updated_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10",
  high: "text-orange-400 bg-orange-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  low: "text-green-400 bg-green-500/10",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10",
  verified: "text-blue-400 bg-blue-500/10",
  resolved: "text-green-400 bg-green-500/10",
};

type FilterCategory = "all" | "harassment" | "theft" | "unsafe_area" | "stalking" | "assault" | "other";
type FilterSeverity = "all" | "critical" | "high" | "medium" | "low";

export default function SafetyReports() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch incidents
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterCategory !== "all") query = query.eq("category", filterCategory);
      if (filterSeverity !== "all") query = query.eq("severity", filterSeverity);
      if (dateFrom) query = query.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());

      const { data } = await query;
      setIncidents((data as IncidentReport[]) || []);
      setLoading(false);
    };
    fetch();
  }, [filterCategory, filterSeverity, dateFrom, dateTo]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === incidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(incidents.map((i) => i.id)));
    }
  };

  const reportsToExport = selectedIds.size > 0
    ? incidents.filter((i) => selectedIds.has(i.id))
    : incidents;

  const generatePDF = useCallback(async () => {
    if (reportsToExport.length === 0) {
      toast.error("No incidents to export");
      return;
    }

    setGenerating(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const now = new Date();

      // ——— Cover Page ———
      // Header bar
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, pageW, 45, "F");
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 45, pageW, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("GOVERNMENT OF INDIA", pageW / 2, 15, { align: "center" });
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("RAKSHA SETU", pageW / 2, 28, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("National Women Safety Initiative", pageW / 2, 36, { align: "center" });

      // Subtitle bar
      doc.setFontSize(8);
      doc.text("INCIDENT SAFETY REPORT", pageW / 2, 50, { align: "center" });

      // Report meta
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      let y = 70;
      doc.text("Safety Incident Report", margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      y += 8;
      doc.text(`Generated: ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`, margin, y);
      y += 5;
      doc.text(`Total Incidents: ${reportsToExport.length}`, margin, y);
      y += 5;
      if (filterCategory !== "all") doc.text(`Category Filter: ${filterCategory.replace("_", " ")}`, margin, y), y += 5;
      if (filterSeverity !== "all") doc.text(`Severity Filter: ${filterSeverity}`, margin, y), y += 5;

      // Summary stats
      y += 5;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
      y += 7;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");

      const critCount = reportsToExport.filter((r) => r.severity === "critical").length;
      const highCount = reportsToExport.filter((r) => r.severity === "high").length;
      const medCount = reportsToExport.filter((r) => r.severity === "medium").length;
      const lowCount = reportsToExport.filter((r) => r.severity === "low").length;
      const pendingCount = reportsToExport.filter((r) => r.status === "pending").length;
      const resolvedCount = reportsToExport.filter((r) => r.status === "resolved").length;

      const colW = (pageW - margin * 2) / 4;
      const stats = [
        { label: "Critical", value: critCount, color: [220, 38, 38] },
        { label: "High", value: highCount, color: [249, 115, 22] },
        { label: "Medium", value: medCount, color: [234, 179, 8] },
        { label: "Low", value: lowCount, color: [34, 197, 94] },
      ];

      stats.forEach((s, i) => {
        const x = margin + colW * i + colW / 2;
        doc.setTextColor(s.color[0], s.color[1], s.color[2]);
        doc.setFontSize(16);
        doc.text(String(s.value), x, y + 2, { align: "center" });
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(s.label, x, y + 9, { align: "center" });
      });

      y += 30;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Pending: ${pendingCount}  |  Resolved: ${resolvedCount}`, margin, y);

      // ——— Incident Table ———
      doc.addPage();

      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageW, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("INCIDENT DETAILS", margin, 8);

      const tableData = reportsToExport.map((r, idx) => [
        String(idx + 1),
        new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
        r.category.replace("_", " ").toUpperCase(),
        r.severity.toUpperCase(),
        r.status.toUpperCase(),
        r.description.length > 60 ? r.description.substring(0, 57) + "..." : r.description,
        r.address || `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}`,
      ]);

      (doc as any).autoTable({
        startY: 18,
        head: [["#", "Date", "Category", "Severity", "Status", "Description", "Location"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: 255,
          fontSize: 7,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        columnStyles: {
          0: { halign: "center", cellWidth: 8 },
          1: { cellWidth: 20 },
          2: { cellWidth: 22 },
          3: { halign: "center", cellWidth: 16 },
          4: { halign: "center", cellWidth: 16 },
          5: { cellWidth: "auto" },
          6: { cellWidth: 35 },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        didDrawPage: () => {
          // Footer on each page
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `RakshaSetu Safety Report | Confidential | Page ${doc.getNumberOfPages()}`,
            pageW / 2,
            pageH - 8,
            { align: "center" }
          );
        },
      });

      // ——— Detailed Pages ———
      reportsToExport.forEach((r, idx) => {
        doc.addPage();

        // Header
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, pageW, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`INCIDENT #${idx + 1} — DETAILED REPORT`, margin, 8);

        let dy = 20;

        // Info grid
        const fields = [
          ["Report ID", r.id.substring(0, 8).toUpperCase()],
          ["Date & Time", new Date(r.created_at).toLocaleString("en-IN")],
          ["Category", r.category.replace("_", " ").toUpperCase()],
          ["Severity", r.severity.toUpperCase()],
          ["Status", r.status.toUpperCase()],
          ["Reporter", r.is_anonymous ? "Anonymous" : r.reporter_name || "N/A"],
          ["Location", r.address || `Lat: ${r.latitude.toFixed(5)}, Lng: ${r.longitude.toFixed(5)}`],
          ["Last Updated", new Date(r.updated_at).toLocaleString("en-IN")],
        ];

        fields.forEach(([label, value]) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(`${label}:`, margin, dy);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(String(value), margin + 35, dy);
          dy += 6;
        });

        // Description
        dy += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, dy, pageW - margin, dy);
        dy += 7;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text("DESCRIPTION", margin, dy);
        dy += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const descLines = doc.splitTextToSize(r.description, pageW - margin * 2);
        doc.text(descLines, margin, dy);
        dy += descLines.length * 4 + 8;

        // Certification box
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, dy, pageW - margin * 2, 20, 2, 2, "F");
        dy += 7;
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("This report is auto-generated by the RakshaSetu platform for safety documentation purposes.", margin + 3, dy);
        dy += 4;
        doc.text("It can be used as a reference document for filing official complaints with law enforcement.", margin + 3, dy);

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `RakshaSetu Safety Report | Confidential | Page ${doc.getNumberOfPages()}`,
          pageW / 2,
          pageH - 8,
          { align: "center" }
        );
      });

      // Save
      const filename = `RakshaSetu_Safety_Report_${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      toast.success(`Report downloaded: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  }, [reportsToExport, filterCategory, filterSeverity]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Safety Reports</h1>
        <Button
          size="sm"
          className="ml-auto"
          onClick={generatePDF}
          disabled={generating || incidents.length === 0}
        >
          {generating ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          {selectedIds.size > 0 ? `Export ${selectedIds.size}` : "Export All"}
        </Button>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Filters
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="harassment">Harassment</option>
                  <option value="theft">Theft</option>
                  <option value="unsafe_area">Unsafe Area</option>
                  <option value="stalking">Stalking</option>
                  <option value="assault">Assault</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-sm"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${incidents.length} incidents found`}
          </p>
          {incidents.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
              {selectedIds.size === incidents.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        {/* Incidents List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No incidents found for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => (
              <Card
                key={inc.id}
                className={`cursor-pointer transition-all ${
                  selectedIds.has(inc.id)
                    ? "border-primary/40 bg-primary/5"
                    : "hover:border-border/80"
                }`}
                onClick={() => toggleSelect(inc.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        selectedIds.has(inc.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedIds.has(inc.id) && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[inc.severity] || ""}`}>
                          {inc.severity}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[inc.status] || ""}`}>
                          {inc.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {inc.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{inc.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(inc.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {inc.address || `${inc.latitude.toFixed(2)}, ${inc.longitude.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
