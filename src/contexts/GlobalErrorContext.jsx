import React, { createContext, useContext, useState } from "react";

// Create context
export const GlobalErrorContext = createContext({
  globalError: null,
  setGlobalError: () => {},
});

// Custom hook for easy usage
export const useGlobalError = () => useContext(GlobalErrorContext);

// Provider component
export function GlobalErrorProvider({ children }) {
  const [globalError, setGlobalError] = useState(null);

  return (
    <GlobalErrorContext.Provider value={{ globalError, setGlobalError }}>
      {children}
    </GlobalErrorContext.Provider>
  );
}