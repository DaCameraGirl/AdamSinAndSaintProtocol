import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { SaintOverlay } from "./components/SaintOverlay";
import { AdamSinEngine } from "../engine/AdamSinEngine";
import { LegacyMint } from "../infrastructure/crypto/LegacyMint";
import { EmotionalOpcodes } from "./theme/EmotionalOpcodes";

function App() {
  const [btcAddress, setBtcAddress] = useState("");
  const [ethAddress, setEthAddress] = useState("");
  const [etherscanKey, setEtherscanKey] = useState("");
  const [report, setReport] = useState<any>(null);
  const [signedReport, setSignedReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "ruptures" | "assets" | "report">("overview");

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
    } catch (err: any) {
      setError(err?.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify({ ...report, signing: signedReport }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adam-sin-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const btnStyle: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600, background: "transparent", color: EmotionalOpcodes.textMuted
  };
  const activeBtnStyle: React.CSSProperties = { ...btnStyle, background: EmotionalOpcodes.panel, color: EmotionalOpcodes.text };

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
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>BTC Address (bc1... / 1... / 3...)</label>
              <input value={btcAddress} onChange={(e) => setBtcAddress(e.target.value)} placeholder="bc1q..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>ETH Address (0x...)</label>
              <input value={ethAddress} onChange={(e) => setEthAddress(e.target.value)} placeholder="0x..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: EmotionalOpcodes.textMuted }}>Etherscan API Key (optional — higher rate limit)</label>
            <input value={etherscanKey} onChange={(e) => setEtherscanKey(e.target.value)} placeholder="Your API key"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted, color: EmotionalOpcodes.text, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRun} disabled={loading || (!btcAddress && !ethAddress)}
              style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: EmotionalOpcodes.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading || (!btcAddress && !ethAddress) ? "not-allowed" : "pointer", opacity: loading || (!btcAddress && !ethAddress) ? 0.5 : 1 }}>
              {loading ? "🔍 Analyzing..." : "▶ Run Forensic Analysis"}
            </button>
            {report && (
              <button onClick={exportReport}
                style={{ padding: "10px 24px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: "transparent", color: EmotionalOpcodes.text, fontSize: 14, cursor: "pointer" }}>
                ⬇ Export Report
              </button>
            )}
          </div>
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
            <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${EmotionalOpcodes.border}`, paddingBottom: 4 }}>
              <button onClick={() => setActiveTab("overview")} style={activeTab === "overview" ? activeBtnStyle : btnStyle}>📊 Overview</button>
              <button onClick={() => setActiveTab("timeline")} style={activeTab === "timeline" ? activeBtnStyle : btnStyle}>📜 Timeline ({report.events.length})</button>
              <button onClick={() => setActiveTab("ruptures")} style={activeTab === "ruptures" ? activeBtnStyle : btnStyle}>🚨 Ruptures ({report.ruptures.length})</button>
              <button onClick={() => setActiveTab("assets")} style={activeTab === "assets" ? activeBtnStyle : btnStyle}>💰 Assets ({report.assets.length})</button>
              <button onClick={() => setActiveTab("report")} style={activeTab === "report" ? activeBtnStyle : btnStyle}>🔐 Signed Report</button>
            </div>
            <SaintOverlay report={report} signedReport={signedReport} activeTab={activeTab} />
          </>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
