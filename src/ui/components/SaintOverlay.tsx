import React from "react";
import { EmotionalOpcodes } from "../theme/EmotionalOpcodes";

const severityColor: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

function fmtTime(ts: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function addrShort(addr: string | undefined, len = 12) {
  if (!addr) return "—";
  return addr.length > len + 3 ? `${addr.slice(0, len)}...` : addr;
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SaintOverlay({ report, signedReport, activeTab }: { report: any; signedReport: any; activeTab: string }) {
  const s = report.summary || {};

  const overviewTab = (
    <TabPanel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Section title="📊 Summary">
          <Row label="Transactions" value={s.totalTransactions} />
          <Row label="Chains" value={s.chains?.join(", ") || "—"} />
          <Row label="Total Inflow" value={s.totalInflow} />
          <Row label="Total Outflow" value={s.totalOutflow} />
          <Row label="Ruptures" value={s.ruptureCount} />
          <Row label="Earliest Activity" value={s.oldestActivity ? fmtTime(s.oldestActivity) : "—"} />
          <Row label="Latest Activity" value={s.newestActivity ? fmtTime(s.newestActivity) : "—"} />
        </Section>
        <Section title="👤 Owner">
          <Row label="Label" value={report.owner?.label} />
          <Row label="BTC" value={addrShort(report.owner?.btcAddresses?.[0], 20) || "—"} />
          <Row label="ETH" value={addrShort(report.owner?.ethAddresses?.[0], 20) || "—"} />
        </Section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Section title="₿ Bitcoin">
          <Row label="Transactions" value={report.events.filter((e: any) => e.chain === "bitcoin").length} />
          <Row label="Inflow" value={s.byChain?.bitcoin?.inflow?.toFixed(8) || "0"} />
          <Row label="Outflow" value={s.byChain?.bitcoin?.outflow?.toFixed(8) || "0"} />
        </Section>
        <Section title="⟠ Ethereum">
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

      <Section title="🔐 Report Integrity">
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
        </div>
      </Section>
    </TabPanel>
  );

  const timelineTab = (
    <TabPanel>
      <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13, margin: "0 0 12px" }}>
        {report.events.length} events — sorted chronologically
      </p>
      {report.events.length === 0 ? (
        <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>No events found.</p>
      ) : (
        [...report.events].reverse().map((e: any) => (
          <div key={e.id} style={{
            borderLeft: `3px solid ${e.type === "TRANSFER_OUT" ? "#ef4444" : "#22c55e"}`,
            padding: "10px 14px", marginBottom: 8, background: EmotionalOpcodes.panelMuted, borderRadius: 8, fontSize: 13
          }}>
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
              {e.txHash?.slice(0, 20)}...
            </div>
          </div>
        ))
      )}
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
            borderLeft: `3px solid ${severityColor[r.severity] ?? "#666"}`,
            padding: "12px 14px", marginBottom: 8, background: EmotionalOpcodes.panelMuted, borderRadius: 8, fontSize: 13
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{
                background: severityColor[r.severity], color: "#000", fontWeight: 700,
                padding: "2px 8px", borderRadius: 4, fontSize: 11
              }}>{r.severity}</span>
              <span style={{ color: EmotionalOpcodes.textMuted }}>{fmtTime(r.timestamp)}</span>
            </div>
            <div style={{ marginBottom: 2 }}>{r.description}</div>
            <div style={{ color: EmotionalOpcodes.textMuted, fontSize: 12 }}>
              {r.chain} {r.eventId ? `· ${r.eventId.slice(0, 20)}...` : ""}
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
            <p style={{ color: EmotionalOpcodes.textMuted, fontSize: 13 }}>Not signed yet. Run analysis first.</p>
          )}
        </Section>
        <Section title="⚙️ Report Metadata">
          <Row label="Generated" value={report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"} />
          <Row label="Protocol" value="Adam Sin & Saint Protocol" />
          <Row label="Version" value={report.version} />
          <Row label="Events" value={report.events.length} />
          <Row label="Ruptures" value={report.ruptures.length} />
          <Row label="Assets" value={report.assets.length} />
        </Section>
      </div>

      <Section title="📄 Raw Report JSON">
        <pre style={{
          background: "#0a0a0f", borderRadius: 8, padding: "1rem", fontSize: 11,
          color: EmotionalOpcodes.textMuted, overflow: "auto", maxHeight: 400, margin: 0,
          border: `1px solid ${EmotionalOpcodes.border}`
        }}>
          {JSON.stringify({ ...report, signing: signedReport }, null, 2)}
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
