import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { SaintOverlay } from "./components/SaintOverlay";
import { AdamSinEngine } from "../engine/AdamSinEngine";
import { LegacyMint } from "../infrastructure/crypto/LegacyMint";
import { EmotionalOpcodes } from "./theme/EmotionalOpcodes";

const STORAGE_KEY = "adam-sin-cases";
const MAX_CASES = 5;

interface SavedCase {
  id: string;
  label: string;
  btcAddress: string;
  ethAddress: string;
  timestamp: number;
  report: any;
  signedReport: any;
}

function loadCases(): SavedCase[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCases(cases: SavedCase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

function App() {
  const [btcAddress, setBtcAddress] = useState("");
  const [ethAddress, setEthAddress] = useState("");
  const [etherscanKey, setEtherscanKey] = useState("");
  const [report, setReport] = useState<any>(null);
  const [signedReport, setSignedReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "ruptures" | "assets" | "report">("overview");
  const [savedCases, setSavedCases] = useState<SavedCase[]>(loadCases);
  const [filterChain, setFilterChain] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    saveCases(savedCases);
  }, [savedCases]);

  async function handleRun() {
    if (!btcAddress && !ethAddress) return;
    setLoading(true);
    setError("");
    setReport(null);
    setSignedReport(null);

    try {
      const engine = new AdamSinEngine({
        chains: {
          bitcoin: { baseUrl: "https://mempool.space/api" },
          ethereum: { baseUrl: "https://api.etherscan.io/api", apiKey: etherscanKey }
        },
        app: { version: "0.1.0" }
      });

      const result = await engine.run({
        id: "owner-1",
        label: "Primary Owner",
        btcAddresses: btcAddress ? [btcAddress] : [],
        ethAddresses: ethAddress ? [ethAddress] : []
      });

      const signed = await LegacyMint.signReport(result);
      setReport(result);
      setSignedReport(signed);

      const newCase: SavedCase = {
        id: Date.now().toString(),
        label: `${btcAddress?.slice(0, 10) || ""}${btcAddress && ethAddress ? " / " : ""}${ethAddress?.slice(0, 10) || ""}`,
        btcAddress,
        ethAddress,
        timestamp: Date.now(),
        report: result,
        signedReport: signed
      };
      setSavedCases((prev) => [newCase, ...prev].slice(0, MAX_CASES));
    } catch (err: any) {
      setError(err?.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function restoreCase(c: SavedCase) {
    setBtcAddress(c.btcAddress);
    setEthAddress(c.ethAddress);
    setReport(c.report);
    setSignedReport(c.signedReport);
    setActiveTab("overview");
    setError("");
    setNotes("");
  }

  function deleteCase(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSavedCases((prev) => prev.filter((c) => c.id !== id));
  }

  function exportReport() {
    if (!report) return;
    const exportData = { ...report, signing: signedReport, analystNotes: notes || "" };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adam-sin-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredEvents = useMemo(() => {
    if (!report) return [];
    let events = report.events || [];
    if (filterChain !== "all") events = events.filter((e: any) => e.chain === filterChain);
    if (filterDirection !== "all") events = events.filter((e: any) => e.type === filterDirection);
    return events;
  }, [report, filterChain, filterDirection]);

  const filteredRuptures = useMemo(() => {
    if (!report) return [];
    let ruptures = report.ruptures || [];
    if (filterChain !== "all") ruptures = ruptures.filter((r: any) => r.chain === filterChain);
    if (filterSeverity !== "all") ruptures = ruptures.filter((r: any) => r.severity === filterSeverity);
    return ruptures;
  }, [report, filterChain, filterSeverity]);

  const btnStyle: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600, background: "transparent", color: EmotionalOpcodes.textMuted
  };
  const activeBtnStyle: React.CSSProperties = { ...btnStyle, background: EmotionalOpcodes.panel, color: EmotionalOpcodes.text };
  const filterBtn: React.CSSProperties = {
    padding: "4px 10px", borderRadius: 6, border: `1px solid ${EmotionalOpcodes.border}`, cursor: "pointer",
    fontSize: 12, background: "transparent", color: EmotionalOpcodes.textMuted
  };
  const activeFilterBtn: React.CSSProperties = { ...filterBtn, background: EmotionalOpcodes.panel, color: EmotionalOpcodes.text, borderColor: EmotionalOpcodes.accent };

  return (
    <div style={{ background: EmotionalOpcodes.background, color: EmotionalOpcodes.text, minHeight: "100vh" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem", fontFamily: "Inter, system-ui, sans-serif" }}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ color: EmotionalOpcodes.accent, margin: 0, fontSize: 28 }}>⚔️ Adam Sin & Saint Protocol</h1>
          <p style={{ color: EmotionalOpcodes.textMuted, margin: "4px 0 0 0" }}>
            Dual-Chain Forensic Clarity Engine — BTC + ETH
          </p>
        </header>

        <section style={{ background: EmotionalOpcodes.panel, borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>BTC Address</label>
              <input value={btcAddress} onChange={(e) => setBtcAddress(e.target.value)} placeholder="bc1q..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>ETH Address</label>
              <input value={ethAddress} onChange={(e) => setEthAddress(e.target.value)} placeholder="0x..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>Etherscan API Key (optional)</label>
            <input value={etherscanKey} onChange={(e) => setEtherscanKey(e.target.value)} placeholder="Your API key"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleRun} disabled={loading || (!btcAddress && !ethAddress)}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: EmotionalOpcodes.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading || (!btcAddress && !ethAddress) ? "not-allowed" : "pointer", opacity: loading || (!btcAddress && !ethAddress) ? 0.5 : 1 }}>
              {loading ? "🔍 Analyzing..." : "▶ Run Forensic Analysis"}
            </button>
            {report && (
              <button onClick={exportReport}
                style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: "transparent", color: EmotionalOpcodes.text, fontSize: 14, cursor: "pointer" }}>
                ⬇ Export JSON
              </button>
            )}
          </div>

          {savedCases.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: EmotionalOpcodes.textMuted, marginBottom: 4, display: "block" }}>Saved Cases:</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {savedCases.map((c) => (
                  <div key={c.id} onClick={() => restoreCase(c)}
                    style={{
                      padding: "6px 12px", borderRadius: 6, border: `1px solid ${EmotionalOpcodes.border}`,
                      background: report?.dataSources?.[0]?.retrievalTime === c.report?.dataSources?.[0]?.retrievalTime ? EmotionalOpcodes.panelMuted : "transparent",
                      cursor: "pointer", fontSize: 12, color: EmotionalOpcodes.text, display: "flex", alignItems: "center", gap: 6
                    }}>
                    <span>{c.label || `Case ${c.id.slice(-4)}`}</span>
                    <span style={{ color: EmotionalOpcodes.textMuted, fontSize: 10 }}>{new Date(c.timestamp).toLocaleDateString()}</span>
                    <span onClick={(e) => deleteCase(c.id, e)} style={{ color: "#ef4444", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: EmotionalOpcodes.textMuted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            <div>Fetching blockchain data and running heuristics...</div>
          </div>
        )}

        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #ef4444", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        {report && !loading && (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: `1px solid ${EmotionalOpcodes.border}`, paddingBottom: 4, flexWrap: "wrap" }}>
              <button onClick={() => setActiveTab("overview")} style={activeTab === "overview" ? activeBtnStyle : btnStyle}>📊 Overview</button>
              <button onClick={() => setActiveTab("timeline")} style={activeTab === "timeline" ? activeBtnStyle : btnStyle}>📜 Timeline ({report.events.length})</button>
              <button onClick={() => setActiveTab("ruptures")} style={activeTab === "ruptures" ? activeBtnStyle : btnStyle}>🚨 Ruptures ({report.ruptures.length})</button>
              <button onClick={() => setActiveTab("assets")} style={activeTab === "assets" ? activeBtnStyle : btnStyle}>💰 Assets ({report.assets.length})</button>
              <button onClick={() => setActiveTab("report")} style={activeTab === "report" ? activeBtnStyle : btnStyle}>🔐 Signed Report</button>
            </div>

            {(activeTab === "timeline" || activeTab === "ruptures") && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: EmotionalOpcodes.textMuted }}>Filter:</span>
                <button onClick={() => setFilterChain(filterChain === "all" ? "bitcoin" : "all")}
                  style={filterChain === "bitcoin" ? activeFilterBtn : filterBtn}>₿ BTC</button>
                <button onClick={() => setFilterChain(filterChain === "all" ? "ethereum" : "all")}
                  style={filterChain === "ethereum" ? activeFilterBtn : filterBtn}>⟠ ETH</button>
                {(filterChain !== "all") && (
                  <button onClick={() => setFilterChain("all")}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", background: "transparent" }}>
                    ✕ clear
                  </button>
                )}
                {activeTab === "timeline" && (
                  <>
                    <span style={{ fontSize: 12, color: EmotionalOpcodes.textMuted, marginLeft: 4 }}>Dir:</span>
                    <button onClick={() => setFilterDirection(filterDirection === "all" ? "TRANSFER_IN" : "all")}
                      style={filterDirection === "TRANSFER_IN" ? activeFilterBtn : filterBtn}>⬅ IN</button>
                    <button onClick={() => setFilterDirection(filterDirection === "all" ? "TRANSFER_OUT" : "all")}
                      style={filterDirection === "TRANSFER_OUT" ? activeFilterBtn : filterBtn}>➡ OUT</button>
                    {(filterDirection !== "all") && (
                      <button onClick={() => setFilterDirection("all")}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", background: "transparent" }}>
                        ✕
                      </button>
                    )}
                  </>
                )}
                {activeTab === "ruptures" && (
                  <>
                    <span style={{ fontSize: 12, color: EmotionalOpcodes.textMuted, marginLeft: 4 }}>Sev:</span>
                    <button onClick={() => setFilterSeverity(filterSeverity === "all" ? "HIGH" : "all")}
                      style={filterSeverity === "HIGH" ? { ...activeFilterBtn, borderColor: "#ef4444", color: "#ef4444" } : filterBtn}>HIGH</button>
                    <button onClick={() => setFilterSeverity(filterSeverity === "all" ? "MEDIUM" : "all")}
                      style={filterSeverity === "MEDIUM" ? { ...activeFilterBtn, borderColor: "#f59e0b", color: "#f59e0b" } : filterBtn}>MED</button>
                    <button onClick={() => setFilterSeverity(filterSeverity === "all" ? "LOW" : "all")}
                      style={filterSeverity === "LOW" ? { ...activeFilterBtn, borderColor: "#22c55e", color: "#22c55e" } : filterBtn}>LOW</button>
                    {(filterSeverity !== "all") && (
                      <button onClick={() => setFilterSeverity("all")}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", background: "transparent" }}>
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <SaintOverlay
              report={{ ...report, events: filteredEvents, ruptures: filteredRuptures }}
              signedReport={signedReport}
              activeTab={activeTab}
              notes={notes}
              onNotesChange={setNotes}
            />
          </>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
