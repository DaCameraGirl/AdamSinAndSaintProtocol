import React from "react";
import ReactDOM from "react-dom/client";
import { SaintOverlay } from "./components/SaintOverlay";
import { EmotionalOpcodes } from "./theme/EmotionalOpcodes";

function App() {
  return (
    <div style={{ background: EmotionalOpcodes.background, color: EmotionalOpcodes.text }}>
      <SaintOverlay />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
