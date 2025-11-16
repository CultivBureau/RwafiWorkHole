import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./i18n";
import ClientProvider from "./services/ClientProvider.jsx";
import { GlobalErrorProvider } from "./contexts/GlobalErrorContext"; 
import { PermissionProvider } from "./services/PermissionProvider.jsx";

export default function ThemeBootstrap({ children }) {
  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();
    const initial = saved || "light";
    document.documentElement.dataset.theme = initial;
  }, []);
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeBootstrap>
      <ClientProvider>
        <GlobalErrorProvider>
          <PermissionProvider>
            <App />
          </PermissionProvider>
        </GlobalErrorProvider>
      </ClientProvider>
    </ThemeBootstrap>
  </StrictMode>
);
