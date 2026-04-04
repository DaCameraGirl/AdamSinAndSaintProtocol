import React from "react";
import { EmotionalOpcodes } from "../theme/EmotionalOpcodes";

export function SaintOverlay() {
  return (
    <div
      style={{
        ...EmotionalOpcodes.overlay,
        color: EmotionalOpcodes.text,
        boxShadow: EmotionalOpcodes.glow,
        margin: "40px",
        textAlign: "center"
      }}
    >
      <h1 style={{ color: EmotionalOpcodes.accent }}>
        Adam Sin & Saint Protocol
      </h1>

      <p style={{ marginTop: "10px", color: EmotionalOpcodes.states.saint }}>
        UI Layer Active — Emotional Opcodes Loaded
      </p>

      <p style={{ marginTop: "10px", color: EmotionalOpcodes.states.idle }}>
        Awaiting Engine Signal…
      </p>
    </div>
  );
}
