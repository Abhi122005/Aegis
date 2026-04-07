import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AttackAnalysisStatus = "idle" | "analyzing" | "mitigated";

export type ThreatData = {
  attackType: string;
  sourceIp: string;
  portLabel: string;
  detectedAtIso: string;
  threatId: string;
  confidence: string;
  targetNode: string;
  mitigationScript: string;
  cisoReport: string;
  ollamaRaw: string;
};

export function useAttackAnalysis(): {
  status: AttackAnalysisStatus;
  threatData: ThreatData | null;
  error: string | null;
  trigger: () => void;
  reset: () => void;
  clearError: () => void;
} {
  const [status, setStatus] = useState<AttackAnalysisStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);

  const analyzeTimerRef = useRef<number | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const mock = useMemo(
    () => ({
      attackType: "Distributed SSH Brute Force",
      sourceIp: "192.168.1.100",
      portLabel: "22 (SSH)",
      threatId: "AEG-20491",
      confidence: "99.9%",
      targetNode: "EDGE-NODE-ALPHA-01",
      mitigationScript: "sudo iptables -A INPUT -s 192.168.1.100 -j DROP",
      cisoReport: [
        "At 23:40, the AEGIS edge system detected and automatically mitigated a distributed brute-force attack targeting our primary edge node.",
        "Zero data was exfiltrated.",
        "The offending IPs have been blacklisted at the firewall level.",
        "No manual intervention is required.",
      ].join(" "),
      ollamaRaw: '{\n  "threat_type": "Brute Force",\n  "bash_mitigation": "sudo iptables -A INPUT -s 192.168.1.100 -j DROP"\n}',
    }),
    [],
  );

  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) window.clearTimeout(analyzeTimerRef.current);
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  function reset() {
    if (analyzeTimerRef.current) window.clearTimeout(analyzeTimerRef.current);
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    analyzeTimerRef.current = null;
    fetchAbortRef.current = null;
    setStatus("idle");
    setThreatData(null);
    setError(null);
  }

  function trigger() {
    if (status !== "idle") return;

    setStatus("analyzing");
    setError(null);
    setThreatData(null);

    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    // extended timeout for Gemini generation
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    fetch(`/api/simulate-attack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`bad_status_${res.status}`);
        const data = await res.json();
        
        setStatus("mitigated");
        setThreatData({
           attackType: data.attackType || mock.attackType,
           sourceIp: data.sourceIp || mock.sourceIp,
           portLabel: data.portLabel || mock.portLabel,
           detectedAtIso: data.detected_at || new Date().toISOString(),
           threatId: data.threatId || mock.threatId,
           confidence: data.confidence || mock.confidence,
           targetNode: data.targetNode || mock.targetNode,
           mitigationScript: data.mitigationScript || mock.mitigationScript,
           cisoReport: data.cisoReport || mock.cisoReport,
           ollamaRaw: data.ollamaRaw || mock.ollamaRaw,
        });
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(`Backend Error - ${e.message}`);
          setStatus("idle");
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (fetchAbortRef.current === controller) fetchAbortRef.current = null;
      });
  }

  return { status, threatData, error, trigger, reset, clearError };
}

