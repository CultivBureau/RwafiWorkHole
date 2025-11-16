import React from 'react'
import { RefreshCw, AlertTriangle, Home, ArrowLeft } from 'lucide-react'

const Error = ({ 
  title = "Oops! Something went wrong", 
  message = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
  showRefresh = true,
  showHome = true,
  showBack = false,
  onRefresh,
  onGoHome,
  onGoBack,
  errorCode = "500"
}) => {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      window.location.href = '/'
    }
  }

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      window.history.back()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: "var(--card-bg)",
              border: "2px solid var(--error-color)",
            }}
          >
            <AlertTriangle className="w-12 h-12 text-[var(--error-color)]" />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-4">
          <span 
            className="text-6xl font-bold gradient-text"
            style={{ 
              background: "linear-gradient(135deg, var(--error-color), var(--warning-color))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {errorCode}
          </span>
        </div>

        {/* Title */}
        <h1 
          className="text-2xl font-bold mb-4"
          style={{ color: "var(--text-color)" }}
        >
          {title}
        </h1>

        {/* Message */}
        <p 
          className="text-base mb-8 leading-relaxed"
          style={{ color: "var(--sub-text-color)" }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRefresh && (
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent-color), var(--accent-hover))",
              }}
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          )}

          {showHome && (
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 border"
              style={{
                backgroundColor: "var(--card-bg)",
                color: "var(--text-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <Home className="w-5 h-5" />
              Go Home
            </button>
          )}

          {showBack && (
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 border"
              style={{
                backgroundColor: "var(--card-bg)",
                color: "var(--text-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          )}
        </div>


      </div>
    </div>
  )
}

export default Error