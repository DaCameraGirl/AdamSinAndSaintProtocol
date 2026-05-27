import React, { useState } from "react";
import { EmotionalOpcodes } from "../theme/EmotionalOpcodes";

const severityColor: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };
const NUM_RISK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function fmtTime(ts: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function DisclaimerBar() {
  return (
    <div style={{ background: "#1a1500", border: "1px solid #f59e0b", borderRadius: 8, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: "#f59e0b" }}>
      <strong>⚠ Data Source & Interpretation Disclaimer</strong>
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: "6px 8px", background: "#0f0f1a", borderRadius: 4 }}>
          <strong style={{ color: "#22c55e" }}>✓ Source Facts</strong>
          <div style={{ marginTop: 2, color: "#94a3b8" }}>Raw transactions, timestamps, values, and addresses sourced from <strong>mempool.space</strong> (BTC) and <strong>etherscan.io</strong> (ETH). These are explorer-derived records, not full-node verified data.</div>
        </div>
        <div style={{ padding: "6px 8px", background: "#0f0f1a", borderRadius: 4 }}>
          <strong style={{ color: "#f59e0b" }}>⚠ Heuristic Conclusions</strong>
          <div style={{ marginTop: 2, color: "#94a3b8" }}>Rupture flags, severity ratings, and "why it matters" descriptions are <strong>algorithmic suspicions</strong> based on configurable thresholds — not forensic verdicts. Always verify findings independently.</div>
        </div>
      </div>
    </div>
  );
}

function addrShort(addr: string | undefined, len = 12) {
  if (!addr) return "—";
  return addr.length > len + 3 ? `${addr.slice(0, len)}...` : addr;
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function exportCSV(report: any) {
  const rows: string[] = ["type,chain,timestamp,from,to,value,asset,txHash"];
  for (const e of report.events || []) {
    const val = e.metadata?.tokenSymbol
      ? `${(parseFloat(e.metadata.value) / Math.pow(10, parseInt(e.metadata.tokenDecimal) || 18)).toFixed(4)} ${e.metadata.tokenSymbol}`
      : `${e.metadata?.value ?? "—"} ${e.chain === "bitcoin" ? "BTC" : "ETH"}`;
    rows.push([e.type, e.chain, fmtTime(e.timestamp), e.from || "", e.to || "", `"${val}"`, e.metadata?.tokenSymbol || "native", e.txHash].join(","));
  }
  for (const r of report.ruptures || []) {
    rows.push(["RUPTURE", r.chain, fmtTime(r.timestamp), "", "", `"${r.severity}: ${r.description}"`, "", r.eventId].join(","));
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `adam-sin-report-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function computeScore(ruptures: any[]) {
  if (!ruptures || ruptures.length === 0) return { level: "Low", color: "#22c55e", description: "No significant concerns detected", detail: "No rupture events flagged — routine activity pattern" };
  let score = 0;
  for (const r of ruptures) score += NUM_RISK[r.severity as keyof typeof NUM_RISK] || 0;
  if (score >= 6) return { level: "High", color: "#ef4444", description: "Multiple high-severity events requiring immediate review", detail: `${ruptures.length} rupture(s) with total risk score ${score}` };
  if (score >= 3) return { level: "Medium", color: "#f59e0b", description: "Notable patterns detected — investigate flagged events", detail: `${ruptures.length} rupture(s) with total risk score ${score}` };
  return { level: "Low", color: "#22c55e", description: "Minor or no concerns detected", detail: `${ruptures.length} rupture(s) with total risk score ${score}` };
}

function EventDrawer({ event, onClose }: { event: any; onClose: () => void }) {
  if (!event) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: EmotionalOpcodes.background, border: `1px solid ${EmotionalOpcodes.border}`,
        borderRadius: 12, padding: "1.5rem", maxWidth: 560, width: "90%", maxHeight: "80vh", overflow: "auto"
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: EmotionalOpcodes.accent, fontSize: 16 }}>Event Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: EmotionalOpcodes.textMuted, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            {Object.entries(event).map(([key, val]: [string, any]) => (
              <tr key={key} style={{ borderBottom: `1px solid ${EmotionalOpcodes.border}` }}>
                <td style={{ padding: "6px 8px", color: EmotionalOpcodes.textMuted, fontWeight: 600, width: "30%", verticalAlign: "top" }}>{key}</td>
                <td style={{ padding: "6px 8px", color: EmotionalOpcodes.text, wordBreak: "break-all", fontFamily: "monospace", fontSize: 12 }}>
                  {val === null || val === undefined ? "—" : typeof val === "object" ? JSON.stringify(val, null, 1) : String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SaintOverlay({ report, signedReport, activeTab, notes, onNotesChange }: {
  report: any; signedReport: any; activeTab: string; notes?: string; onNotesChange?: (v: string) => void;
}) {
  const s = report.summary || {};
  const [drawerEvent, setDrawerEvent] = useState<any>(null);
  const score = computeScore(report.ruptures);

  const overviewTab = (
    <TabPanel>
      <DisclaimerBar />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Section title="📊 Summary">
          <Row label="Transactions" value={s.totalTransactions} />
          <Row label="Chains" value={s.chains?.join(", ") || "—"} />
          <Row label="Total Inflow" value={s.totalInflow} />
          <Row label="Total Outflow" value={s.totalOutflow} />
          <Row label="Ruptures" value={s.ruptureCount} />
          <Row label="Earliest" value={s.oldestActivity ? fmtTime(s.oldestActivity) : "—"} />
          <Row label="Latest" value={s.newestActivity ? fmtTime(s.newestActivity) : "—"} />
        </Section>
        <Section title="👤 Owner">
          <Row label="Label" value={report.owner?.label} />
          <Row label="BTC" value={addrShort(report.owner?.btcAddresses?.[0], 20) || "—"} />
          <Row label="ETH" value={addrShort(report.owner?.ethAddresses?.[0], 20) || "—"} />
        </Section>
      </div>

      <Section title="🔍 Forensic Concern Score">
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
          border: `1px solid ${score.color}44`, borderRadius: 8, background: `${score.color}11`
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: score.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700, color: "#000", flexShrink: 0
          }}>
            {score.level === "High" ? "⚠" : score.level === "Medium" ? "!" : "✓"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: score.color }}>{score.level} Forensic Concern</div>
            <div style={{ fontSize: 12, color: EmotionalOpcodes.textMuted, marginTop: 2 }}>{score.description}</div>
            <div style={{ fontSize: 11, color: EmotionalOpcodes.textMuted, marginTop: 1, fontFamily: "monospace" }}>{score.detail}</div>
          </div>
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "16 0" }}>
        <Section title="₿ Bitcoin">
          <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, padding: "4px 8px", background: "#1a1500", borderRadius: 4 }}>Source: mempool.space — explorer data</div>
          <Row label="Transactions" value={report.events.filter((e: any) => e.chain === "bitcoin").length} />
          <Row label="Inflow" value={s.byChain?.bitcoin?.inflow?.toFixed(8) || "0"} />
          <Row label="Outflow" value={s.byChain?.bitcoin?.outflow?.toFixed(8) || "0"} />
        </Section>
        <Section title="⟠ Ethereum">
          <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, padding: "4px 8px", background: "#1a1500", borderRadius: 4 }}>Source: etherscan.io — explorer data</div>
          <Row label="Transactions" value={report.events.filter((e: any) => e.chain === "ethereum").length} />
          <Row label="Inflow" value={s.byChain?.ethereum?.inflow?.toFixed(6) || "0"} />
          <Row label="Outflow" value={s.byChain?.ethereum?.outflow?.toFixed(6) || "0"} />
        </Section>
        <Section title="💰 Assets">
          {report.assets?.length === 0 ? (
            <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 12, margin: 0 }}>No assets found</p>
          ) : (
            report.assets?.map((a: any) => (
              <div key={a.id} style={{ fontSize: 13, marginBottom: 2 }}>{a.symbol}: <strong>{a.balance}</strong></div>
            ))
          )}
        </Section>
      </div>

      <Section title="🔐 Report Provenance & Integrity">
        <div style={{ fontSize: 13 }}>
          <Row label="Generated" value={report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"} />
          <Row label="Version" value={report.version} />
          {signedReport && (
            <>
              <Row label="Signature" value={signedReport.signature?.slice(0, 32) + "..."} />
              <Row label="Algorithm" value={signedReport.algorithm} />
              <Row label="Public Key" value={signedReport.publicKey} />
            </>
          )}
          <div style={{ marginTop: 8 }}>
            <strong style={{ color: EmotionalOpcodes.textMuted, fontSize: 12 }}>Data Sources:</strong>
            {(report.dataSources || []).map((ds: any, i: number) => (
              <div key={i} style={{ fontSize: 12, color: EmotionalOpcodes.textMuted, marginTop: 4, padding: "4px 8px", background: EmotionalOpcodes.panelMuted, borderRadius: 4 }}>
                {ds.chain}: {ds.provider} — retrieved {new Date(ds.retrievalTime).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      </Section>
    </TabPanel>
  );

  const timelineTab = (
    <TabPanel>
      <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13, margin: "0 0 12px" }}>
        {report.events.length} events — click any row for full details
      </p>
      {report.events.length === 0 ? (
        <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>No events found.</p>
      ) : (
        [...report.events].reverse().map((e: any) => (
          <div key={e.id} onClick={() => setDrawerEvent(e)}
            style={{
              borderLeft: `3px solid ${e.type === "TRANSFER_OUT" ? "#ef4444" : "#22c55e"}`,
              padding: "10px 14px", marginBottom: 8, background: EmotionalOpcodes.panelMuted,
              borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "background .15s"
            }}
            onMouseEnter={(ev) => (ev.currentTarget.style.background = EmotionalOpcodes.panel)}
            onMouseLeave={(ev) => (ev.currentTarget.style.background = EmotionalOpcodes.panelMuted)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontWeight: 600 }}>{e.chain === "bitcoin" ? "₿" : "⟠"} {e.type === "TRANSFER_OUT" ? "OUT" : "IN"}</span>
              <span style={{ color: EmotionalOpcodes.textMuted }}>{fmtTime(e.timestamp)}</span>
            </div>
            <div style={{ color: EmotionalOpcodes.text }}>
              {e.metadata?.tokenSymbol
                ? `${(parseFloat(e.metadata.value) / Math.pow(10, parseInt(e.metadata.tokenDecimal) || 18)).toFixed(4)} ${e.metadata.tokenSymbol}`
                : `${e.metadata?.value ?? "—"} ${e.chain === "bitcoin" ? "BTC" : "ETH"}`}
            </div>
            <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 12 }}>
              {addrShort(e.from, 10)} → {addrShort(e.to, 10)}
            </div>
            <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 11, marginTop: 2 }}>
              {e.txHash?.slice(0, 20)}... <span style={{ fontStyle: "italic" }}>click to inspect</span>
            </div>
          </div>
        ))
      )}
      {drawerEvent && <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />}
    </TabPanel>
  );

  const rupturesTab = (
    <TabPanel>
      <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13, margin: "0 0 12px" }}>
        {report.ruptures.length} rupture events detected
      </p>
      {report.ruptures.length === 0 ? (
        <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>No ruptures detected.</p>
      ) : (
        report.ruptures.map((r: any) => (
          <div key={r.id} style={{
            border: `1px solid ${severityColor[r.severity]}33`,
            borderLeft: `4px solid ${severityColor[r.severity] ?? "#666"}`,
            padding: "14px", marginBottom: 10, background: EmotionalOpcodes.panelMuted, borderRadius: 8, fontSize: 13
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{
                background: severityColor[r.severity], color: "#000", fontWeight: 700,
                padding: "3px 10px", borderRadius: 4, fontSize: 11, letterSpacing: 0.5
              }}>{r.severity}</span>
              <span style={{ color: EmotionalOpcodes.textMuted, fontSize: 12 }}>{fmtTime(r.timestamp)}</span>
            </div>
            {r.ruleName && (
              <div style={{ fontSize: 15, fontWeight: 600, color: EmotionalOpcodes.text, marginBottom: 4 }}>{r.ruleName}</div>
            )}
            <div style={{ color: EmotionalOpcodes.text, marginBottom: 6 }}>{r.description}</div>
            <div style={{ background: "#0a0a12", borderRadius: 6, padding: "10px", marginBottom: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12 }}>
              {r.thresholdDescription && (
                <div><span style={{ color: EmotionalOpcodes.textMuted }}>Threshold:</span> <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>{r.thresholdDescription}</span></div>
              )}
              {r.observedValue && (
                <div><span style={{ color: EmotionalOpcodes.textMuted }}>Observed:</span> <span style={{ color: "#ef4444", fontFamily: "monospace", fontWeight: 600 }}>{r.observedValue}</span></div>
              )}
              {r.counterparty && (
                <div><span style={{ color: EmotionalOpcodes.textMuted }}>Counterparty:</span> <span style={{ color: EmotionalOpcodes.text }}>{addrShort(r.counterparty, 20)}</span></div>
              )}
              {r.eventId && (
                <div><span style={{ color: EmotionalOpcodes.textMuted }}>Tx Hash:</span> <span style={{ fontFamily: "monospace", fontSize: 11, color: EmotionalOpcodes.textMuted }}>{r.eventId.replace("rupture-", "").slice(0, 18)}...</span></div>
              )}
            </div>
            {r.whyItMatters && (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: "6px 8px", background: "#0f0f1a", borderRadius: 4, borderLeft: "2px solid #334155" }}>
                <span style={{ fontWeight: 600, color: EmotionalOpcodes.textMuted }}>Why it matters: </span>{r.whyItMatters}
              </div>
            )}
            <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 11, marginTop: 6 }}>
              {r.chain} · {r.id}
            </div>
          </div>
        ))
      )}
    </TabPanel>
  );

  const assetsTab = (
    <TabPanel>
      <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13, margin: "0 0 12px" }}>
        {report.assets.length} assets across {report.summary?.chains?.join(" & ") || "—"}
      </p>
      {report.assets.length === 0 ? (
        <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>No assets found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {report.assets.map((a: any) => (
            <div key={a.id} style={{ background: EmotionalOpcodes.panel, borderRadius: 12, padding: "1rem" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: EmotionalOpcodes.accent, marginBottom: 4 }}>
                {a.balance} {a.symbol}
              </div>
              <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>
                {a.chain === "bitcoin" ? "₿ Bitcoin" : "⟠ Ethereum"}
              </div>
              {a.contractAddress && (
                <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 11, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {a.contractAddress}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </TabPanel>
  );

  const reportTab = (
    <TabPanel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Section title="🔏 Signed Report">
          {signedReport ? (
            <>
              <Row label="Algorithm" value={signedReport.algorithm} />
              <Row label="Digest" value={signedReport.digest?.slice(0, 24) + "..."} />
              <Row label="Signature" value={signedReport.signature?.slice(0, 24) + "..."} />
              <Row label="Public Key" value={signedReport.publicKey} />
              <div style={{ marginTop: 8, padding: 8, background: EmotionalOpcodes.panelMuted, borderRadius: 6, fontSize: 11, color: EmotionalOpcodes.textMuted, fontFamily: "monospace", wordBreak: "break-all" }}>
                Full signature: {signedReport.signature}
              </div>
            </>
          ) : (
            <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>Not signed yet.</p>
          )}
        </Section>
        <Section title="⚙️ Report Metadata">
          <Row label="Generated" value={report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"} />
          <Row label="Protocol" value="Adam Sin & Saint Protocol" />
          <Row label="Version" value={report.version} />
          <Row label="Events" value={report.events.length} />
          <Row label="Ruptures" value={report.ruptures.length} />
          <Row label="Assets" value={report.assets.length} />
          <Row label="Data Sources" value={(report.dataSources || []).map((d: any) => d.provider).join(", ")} />
          <Row label="Forensic Score" value={`${score.level}`} />
        </Section>
      </div>

      <Section title="📝 Analyst Notes">
        <textarea
          value={notes || ""}
          onChange={(e) => onNotesChange?.(e.target.value)}
          placeholder="Add case notes here — observations, suspicious addresses, follow-up items..."
          style={{
            width: "100%", minHeight: 80, padding: "10px 12px", borderRadius: 8,
            border: `1px solid ${EmotionalOpcodes.border}`, background: EmotionalOpcodes.panelMuted,
            color: EmotionalOpcodes.text, fontSize: 13, fontFamily: "inherit",
            boxSizing: "border-box", resize: "vertical"
          }}
        />
        <div style={{ fontSize: 11, color: EmotionalOpcodes.textMuted, marginTop: 4 }}>
          Notes are saved locally and included in JSON export
        </div>
      </Section>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => exportCSV(report)}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${EmotionalOpcodes.border}`, background: "transparent", color: EmotionalOpcodes.text, fontSize: 13, cursor: "pointer" }}>
          ⬇ Export CSV
        </button>
      </div>

      <Section title="📄 Raw Report JSON">
        <pre style={{
          background: "#0a0a0f", borderRadius: 8, padding: "1rem", fontSize: 11,
          color: EmotionalOpcodes.textMuted, overflow: "auto", maxHeight: 400, margin: 0,
          border: `1px solid ${EmotionalOpcodes.border}`
        }}>
          {JSON.stringify({ ...report, signing: signedReport, analystNotes: notes || "" }, null, 2)}
        </pre>
      </Section>
    </TabPanel>
  );

  const tabs: Record<string, React.ReactNode> = {
    overview: overviewTab,
    timeline: timelineTab,
    ruptures: rupturesTab,
    assets: assetsTab,
    report: reportTab
  };

  return <div>{tabs[activeTab] || overviewTab}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: EmotionalOpcodes.panel, borderRadius: 12, padding: "1rem", marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: EmotionalOpcodes.textMuted }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: EmotionalOpcodes.textMuted }}>{label}</span>
      <span style={{ color: EmotionalOpcodes.text, fontWeight: 500, textAlign: "right" }}>{value ?? "—"}</span>
    </div>
  );
}
