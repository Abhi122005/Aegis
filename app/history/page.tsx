"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Shield,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Threat = {
  id: string;
  threatId: string;
  attackType: string;
  sourceIp: string;
  portLabel: string;
  confidence: string;
  targetNode: string;
  mitigationScript: string;
  cisoReport: string;
  detected_at: string;
};

type MonthlyData = Record<string, Threat[]>;

export default function HistoryPage() {
  const [data, setData] = useState<MonthlyData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedThreats, setExpandedThreats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchThreats() {
      try {
        const res = await fetch("/api/threats");
        if (!res.ok) {
          throw new Error("Failed to fetch threat history");
        }
        const json = await res.json();
        setData(json);
        // Expand the most recent month by default
        const months = Object.keys(json).sort((a, b) => b.localeCompare(a));
        if (months.length > 0) {
          setExpandedMonths({ [months[0]]: true });
        }
      } catch (e: any) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchThreats();
  }, []);

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleThreat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedThreats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sortedMonths = Object.keys(data).sort((a, b) => b.localeCompare(a));

  return (
    <div
      className="min-h-screen font-mono text-neutral-100"
      style={{ backgroundColor: "#09090b" }}
    >
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-[#09090b]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="mr-2 inline-flex items-center justify-center rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-700"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="grid size-9 place-items-center rounded-md border border-neutral-800 bg-neutral-950">
              <Shield className="size-5 text-emerald-400" />
            </div>
            <div className="leading-tight">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold tracking-wide text-emerald-300">
                  AEGIS THREAT HISTORY
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="relative inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] tracking-wide text-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    ARCHIVE ONLINE
                    <span className="absolute -inset-px rounded-full shadow-[0_0_18px_rgba(16,185,129,0.25)]" />
                  </span>
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-neutral-400">
                Historical Mitigation Reports · Project Aegis
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Monthly Threat Archives</h1>
            <p className="mt-1 text-sm text-neutral-400">Review past mitigations and automated CISO reports.</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-black/40 px-4 py-2">
            <div className="text-[11px] text-neutral-500 uppercase tracking-widest text-right">Total Events</div>
            <div className="text-xl font-bold text-emerald-400 text-right">
                {Object.values(data).flat().length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
             <div className="relative inline-flex size-6 mb-4">
                <span className="absolute inline-flex size-6 animate-ping rounded-full bg-emerald-500/25" />
                <span className="relative inline-flex size-6 rounded-full border border-emerald-500/30 bg-emerald-500/10" />
            </div>
            <span>Loading secure archive...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-5" />
              Failed to load history
            </div>
            <div className="mt-2 text-red-300/80">{error}</div>
          </div>
        ) : sortedMonths.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-12 text-center text-neutral-400">
            <Shield className="mx-auto size-10 opacity-30 mb-4" />
            <h3 className="text-lg font-medium text-neutral-300">No Threats Recorded</h3>
            <p className="mt-2 text-sm">The system has not mitigated any threats yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((month) => {
              const threats = data[month];
              const isExpanded = !!expandedMonths[month];
              
              // Format month string nicely
              const [year, m] = month.split('-');
              let niceMonth = month;
              try {
                  const d = new Date(parseInt(year), parseInt(m)-1);
                  niceMonth = d.toLocaleString('default', { month: 'long', year: 'numeric' });
              } catch (e) {}

              return (
                <div key={month} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40 shadow-sm transition-all hover:border-neutral-700">
                  <button
                    onClick={() => toggleMonth(month)}
                    className="flex w-full items-center justify-between bg-neutral-900/80 px-6 py-4 transition hover:bg-neutral-800/80 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border border-neutral-700/50 bg-black/50 p-2 text-emerald-400">
                        <Calendar className="size-5" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-semibold tracking-tight text-neutral-100">{niceMonth}</h2>
                        <span className="text-[11px] text-neutral-500">{threats.length} events logged</span>
                      </div>
                    </div>
                    <div className="p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white rounded-md">
                        {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-neutral-800"
                      >
                        <div className="divide-y divide-neutral-800/50 px-6 py-2">
                          {threats.map((threat) => {
                            const tExpanded = !!expandedThreats[threat.id];
                            const dateMatch = threat.detected_at?.match(/T((?:[01]\d|2[0-3]):[0-5]\d)/);
                            const timeStr = dateMatch ? dateMatch[1] : "Unknown Time";
                            const dateStr = threat.detected_at?.split("T")[0] || "Unknown Date";
                            
                            return (
                              <div key={threat.id} className="group py-4">
                                <div 
                                    className="flex cursor-pointer items-start justify-between gap-4 py-1 hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors"
                                    onClick={(e) => toggleThreat(threat.id, e)}
                                >
                                  <div className="flex items-start gap-4">
                                      <div className="mt-0.5 text-xs text-neutral-500 font-mono w-20 text-right">
                                          <div>{dateStr}</div>
                                          <div>{timeStr}</div>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                            <span className="font-semibold text-neutral-100">{threat.attackType}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                                            <span className="inline-flex items-center gap-1"><Activity className="size-3" /> {threat.sourceIp}</span>
                                            <span className="inline-flex items-center gap-1"><Cpu className="size-3" /> {threat.targetNode}</span>
                                            <span>ID: {threat.threatId}</span>
                                        </div>
                                      </div>
                                  </div>
                                  <button className="text-neutral-500 mt-2 p-1 hover:text-white rounded-md hover:bg-neutral-800 transition">
                                      {tExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {tExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1, marginTop: "1rem" }}
                                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="grid gap-4 md:grid-cols-2 ml-4 border-l-2 border-neutral-800 pl-4 py-2">
                                          {/* Details Panel */}
                                          <div className="space-y-4">
                                            <div>
                                              <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                                                <CheckCircle2 className="size-3.5 text-emerald-500" /> Mitigation Action
                                              </div>
                                              <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black/50 shadow-inner">
                                                <SyntaxHighlighter
                                                  language="bash"
                                                  style={atomDark}
                                                  customStyle={{ margin: 0, padding: "12px", fontSize: "11px", background: "transparent" }}
                                                >
                                                  {threat.mitigationScript}
                                                </SyntaxHighlighter>
                                              </div>
                                            </div>
                                            
                                            <div className="flex gap-4 text-[11px]">
                                                <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex-1">
                                                    <div className="text-neutral-500 mb-1 shrink-0">Confidence</div>
                                                    <div className="text-emerald-400 text-sm">{threat.confidence}</div>
                                                </div>
                                                <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex-1">
                                                    <div className="text-neutral-500 mb-1 shrink-0">Target Port</div>
                                                    <div className="text-neutral-300 text-sm">{threat.portLabel}</div>
                                                </div>
                                            </div>
                                          </div>

                                          {/* CISO Report Panel */}
                                          <div className="flex flex-col">
                                            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                                                <AlertTriangle className="size-3.5 text-amber-500" /> Auto CISO Report
                                            </div>
                                            <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 text-sm leading-relaxed text-neutral-300 shadow-inner">
                                                {threat.cisoReport}
                                            </div>
                                          </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
