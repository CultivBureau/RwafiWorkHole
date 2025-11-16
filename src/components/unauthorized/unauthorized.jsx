import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Home } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-all)" }}>
      <div className="max-w-md w-full mx-4">
        <div 
          className="rounded-2xl border p-8 text-center"
          style={{ 
            background: "var(--bg-color)",
            borderColor: "var(--border-color)"
          }}
        >
          <div className="flex justify-center mb-4">
            <div className="rounded-full p-4" style={{ background: "var(--hover-color)" }}>
              <AlertCircle className="w-12 h-12" style={{ color: "var(--accent-color)" }} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            Access Denied
          </h1>
          
          <p className="mb-6" style={{ color: "var(--sub-text-color)" }}>
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <button
            onClick={() => navigate("/pages/User/dashboard")}
            className="w-full gradient-bg text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
