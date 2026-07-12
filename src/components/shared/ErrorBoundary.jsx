import { Component } from "react";
import { clearState } from "../../utils/storage";

// Last-resort catch for render crashes. Without it, an unexpected error
// (e.g. malformed persisted state) is a blank white page with no way out,
// and the broken state re-persists on every reload.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Render crash:", error, info);
  }

  handleStartFresh = () => {
    clearState();
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          background: "#000000",
          color: "#ffffff",
          fontFamily: "Hanken Grotesk, sans-serif",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", maxWidth: 420, margin: 0 }}>
          The app hit an unexpected error. Reloading usually fixes it. If it
          keeps happening, start fresh (this clears your saved work).
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              background: "#c6453c",
              color: "#ffffff",
              border: "none",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            onClick={this.handleStartFresh}
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.4)",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Start fresh
          </button>
        </div>
      </div>
    );
  }
}
