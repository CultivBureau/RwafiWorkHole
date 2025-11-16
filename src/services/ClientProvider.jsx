"use client";
import { Provider } from "react-redux";
import store from "../redux store/store";
import { Toaster } from "react-hot-toast";

export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </Provider>
  );
}
