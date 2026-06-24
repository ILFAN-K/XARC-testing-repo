'use client';

import { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  GenerateReportButton                                              */
/*  Workflow: Generate Report → Date Range → Format → Download        */
/* ------------------------------------------------------------------ */
interface GenerateReportButtonProps {
  /** Dashboard data passed for client-side report generation. */
  summaryData?: Record<string, unknown>;
}

type ReportFormat = 'pdf' | 'csv' | 'excel';

export default function GenerateReportButton({ summaryData }: GenerateReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const reportData = {
        dateRange: { start: startDate, end: endDate },
        format,
        generatedAt: new Date().toISOString(),
        ...(summaryData || {}),
      };

      if (format === 'csv') {
        downloadCSV(reportData);
      } else if (format === 'excel') {
        downloadCSV(reportData, 'xls');
      } else {
        // PDF — use print dialog with formatted content
        printReport(reportData);
      }
    } finally {
      setIsGenerating(false);
      setIsOpen(false);
    }
  };

  const downloadCSV = (data: Record<string, unknown>, ext = 'csv') => {
    const rows = [
      ['XARC Nexus Hub — Dashboard Report'],
      [`Date Range: ${startDate} to ${endDate}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ...Object.entries(data)
        .filter(([k]) => !['dateRange', 'format', 'generatedAt'].includes(k))
        .map(([key, value]) => [key, String(value)]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${startDate || 'all'}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = (data: Record<string, unknown>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const entries = Object.entries(data)
      .filter(([k]) => !['dateRange', 'format', 'generatedAt'].includes(k))
      .map(([key, value]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:500;">${key}</td><td style="padding:8px;border-bottom:1px solid #eee;">${value}</td></tr>`)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard Report</title>
        <style>
          body { font-family: Inter, -apple-system, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #111; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>XARC Nexus Hub — Dashboard Report</h1>
        <p class="meta">Date Range: ${startDate || 'All'} to ${endDate || 'Present'} · Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>${entries}</tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <button
        id="btn-generate-report"
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
        Generate Report
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generate Report</h2>
              <p className="text-sm text-gray-500 mt-1">Select date range and format to download.</p>
            </div>

            {/* Body */}
            <div className="px-6 pb-4 space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="report-start-date" className="block text-xs font-medium text-gray-600 mb-1.5">
                    Start Date
                  </label>
                  <input
                    id="report-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || today}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-nexus-accent/30 focus:border-nexus-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="report-end-date" className="block text-xs font-medium text-gray-600 mb-1.5">
                    End Date
                  </label>
                  <input
                    id="report-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={today}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-nexus-accent/30 focus:border-nexus-accent transition-colors"
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Format</label>
                <div className="flex gap-2">
                  {([
                    { value: 'pdf' as const, label: 'PDF', icon: '📄' },
                    { value: 'csv' as const, label: 'CSV', icon: '📊' },
                    { value: 'excel' as const, label: 'Excel', icon: '📗' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormat(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        format === opt.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-download-report"
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
