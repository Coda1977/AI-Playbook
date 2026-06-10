import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>
);
