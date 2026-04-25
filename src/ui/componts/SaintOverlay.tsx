
import React, { useMemo, useState } from "react";
import { EmotionalOpcodes } from "../theme/EmotionalOpcodes";

type LiveState = {
  featureFlags: {
    newCheckout: boolean;
    betaSearch: boolean;
  };
  checkout: {
    mode: "test" | "live";
    timeoutMs: number;
    cartCount: number;
  };
  viewer: {
    id: string;
    role: "admin" | "viewer";
  };
};

type Snapshot = {
  id: number;
  createdAt: string;
  state: LiveState;
};

type AuditEvent = {
  id: number;
  createdAt: string;
  message: string;
};

const baseState: LiveState = {
  featureFlags: {
    newCheckout: false,
    betaSearch: false
  },
  checkout: {
    mode: "test",
    timeoutMs: 3000,
    cartCount: 5
  },
  viewer: {
    id: "user-12345",
    role: "admin"
  }
};

function sectionTitle(text: string) {
  return <h3 style={{ margin: "0 0 10px", fontSize: 14, letterSpacing: 0.3, textTransform: "uppercase" }}>{text}</h3>;
}

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${EmotionalOpcodes.border}`,
    borderRadius: 12,
    padding: 14,
    background: EmotionalOpcodes.panelMuted
  };
}

export function SaintOverlay() {
  const [liveState, setLiveState] = useState<LiveState>(baseState);
  const [latencyMs, setLatencyMs] = useState(2300);
  const [offline, setOffline] = useState(false);
  const [mocks, setMocks] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([
    { id: 1, createdAt: new Date(Date.now() - 180_000).toISOString(), state: baseState },
    { id: 2, createdAt: new Date(Date.now() - 90_000).toISOString(), state: baseState },
    { id: 3, createdAt: new Date().toISOString(), state: baseState }
  ]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const renderedState = useMemo(() => JSON.stringify(liveState, null, 2), [liveState]);

  const addAuditEvent = (message: string) => {
    setAuditEvents((previous) => [
      { id: previous.length + 1, createdAt: new Date().toISOString(), message },
      ...previous
    ]);
  };

  const onToggleCheckout = () => {
    setLiveState((previous) => {
      const next = {
        ...previous,
        featureFlags: {
          ...previous.featureFlags,
          newCheckout: !previous.featureFlags.newCheckout
        }
      };
      addAuditEvent(`newCheckout toggled to ${String(next.featureFlags.newCheckout)}`);
      return next;
    });
  };

  const onAddCartItem = () => {
    setLiveState((previous) => {
      const next = {
        ...previous,
        checkout: {
          ...previous.checkout,
          cartCount: previous.checkout.cartCount + 1
        }
      };
      addAuditEvent(`cartCount increased to ${String(next.checkout.cartCount)}`);
      return next;
    });
  };

  const onIncreaseTimeout = () => {
    setLiveState((previous) => {
      const next = {
        ...previous,
        checkout: {
          ...previous.checkout,
          timeoutMs: previous.checkout.timeoutMs + 500
        }
      };
      setLatencyMs((current) => current + 100);
      addAuditEvent(`timeoutMs increased to ${String(next.checkout.timeoutMs)}`);
      return next;
    });
  };

  const onConsoleError = () => {
    console.error("Compass Ultra test error from local evaluation shell");
    addAuditEvent("console.error was triggered from demo controls");
  };

  const onCaptureSnapshot = () => {
    setSnapshots((previous) => {
      const next = [{ id: previous.length + 1, createdAt: new Date().toISOString(), state: liveState }, ...previous];
      addAuditEvent(`Snapshot ${String(next[0].id)} captured`);
      return next;
    });
  };

  const onRestoreSnapshot = (snapshot: Snapshot) => {
    setLiveState(snapshot.state);
    addAuditEvent(`Snapshot ${String(snapshot.id)} restored`);
  };

  const onExport = () => {
    addAuditEvent("Snapshot payload exported to clipboard");
    void navigator?.clipboard?.writeText(renderedState);
  };

  return (
    <main style={{ fontFamily: "Inter, system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Compass Ultra Demo Host</h1>
      <p style={{ color: EmotionalOpcodes.textMuted }}>
        Local evaluation shell for Compass Ultra. Press <strong>Ctrl + Shift + D</strong> or use the launcher in the
        lower-right corner.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <div style={cardStyle()}><strong>Cart count</strong><div>{liveState.checkout.cartCount}</div></div>
        <div style={cardStyle()}><strong>Checkout mode</strong><div>{liveState.checkout.mode}</div></div>
        <div style={cardStyle()}><strong>Timeout</strong><div>{liveState.checkout.timeoutMs} ms</div></div>
        <div style={cardStyle()}><strong>Viewer role</strong><div>{liveState.viewer.role}</div></div>
      </section>

      <section style={{ ...cardStyle(), marginTop: 16 }}>
        {sectionTitle("Live state")}
        <pre style={{ margin: 0, color: EmotionalOpcodes.textMuted, overflow: "auto" }}>{renderedState}</pre>
      </section>

      <section style={{ ...cardStyle(), marginTop: 16 }}>
        {sectionTitle("Demo controls")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={onToggleCheckout}>Toggle new checkout</button>
          <button onClick={onAddCartItem}>Add cart item</button>
          <button onClick={onIncreaseTimeout}>Increase timeout</button>
          <button onClick={onConsoleError}>Send console error</button>
        </div>
      </section>

      <section style={{ ...cardStyle(), marginTop: 16 }}>
        {sectionTitle("Transport controls")}
        <p style={{ marginTop: 0 }}>Artificial latency: {latencyMs} ms</p>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={offline}
            onChange={() => {
              setOffline((current) => !current);
              addAuditEvent(`Offline mode ${offline ? "disabled" : "enabled"}`);
            }}
          />
          Force offline mode
        </label>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <div style={cardStyle()}>
          {sectionTitle("Capture state")}
          <p style={{ marginTop: 0, color: EmotionalOpcodes.textMuted }}>Checkout timeout: {liveState.checkout.timeoutMs} ms</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onCaptureSnapshot}>Capture snapshot</button>
            <button onClick={onExport}>Export JSON</button>
          </div>
        </div>

        <div style={cardStyle()}>
          {sectionTitle("Saved snapshots")}
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} style={{ marginBottom: 10, borderTop: `1px solid ${EmotionalOpcodes.border}`, paddingTop: 10 }}>
              <div style={{ fontWeight: 600 }}>Snapshot {snapshot.id}</div>
              <small style={{ color: EmotionalOpcodes.textMuted }}>{new Date(snapshot.createdAt).toLocaleTimeString()}</small>
              <div>
                <button onClick={() => onRestoreSnapshot(snapshot)}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...cardStyle(), marginTop: 16 }}>
        {sectionTitle("Audit stream")}
        <button onClick={() => setAuditEvents([])}>Clear</button>
        {auditEvents.length === 0 ? (
          <p style={{ color: EmotionalOpcodes.textMuted }}>No events captured yet.</p>
        ) : (
          <ul>
            {auditEvents.map((event) => (
              <li key={event.id}>
                <strong>{new Date(event.createdAt).toLocaleTimeString()}:</strong> {event.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
