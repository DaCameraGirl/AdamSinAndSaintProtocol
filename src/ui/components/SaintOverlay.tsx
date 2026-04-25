import React from "react";
import mockReport from "../mock-report.json";
import { EmotionalOpcodes } from "../theme/EmotionalOpcodes";

export function SaintOverlay() {
  const ruptures = mockReport.ruptures || [];

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif"
      }}
    >
      <h1 style={{ color: EmotionalOpcodes.accent }}>Saint Overlay</h1>
      <p>Forensic timeline preview for owner: {mockReport.owner?.label ?? "Unknown"}</p>

      <section
        style={{
          background: EmotionalOpcodes.panel,
          padding: "1rem",
          borderRadius: 12,
          marginTop: "1rem"
        }}
      >
        <h2>Rupture Events</h2>
        {ruptures.length === 0 ? (
          <p>No rupture events detected in the sample report.</p>
        ) : (
          <ul>
            {ruptures.map((rupture: any) => (
              <li key={rupture.id}>
                [{rupture.severity}] {rupture.description}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
