import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useForgotPasswordMutation } from "../../services/apis/AuthApi";

const ForgetPassword = () => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      toast.success("Check your email for the reset code");
      // Navigate to reset-password and pass email as state
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#09D1C7] to-[#15919B] flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            Forgot Password?
          </h1>
          <p className="text-[var(--sub-text-color)] text-sm">
            Don't worry! Enter your email and we'll send you a reset code.
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-8 shadow-lg border backdrop-blur-sm"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--sub-text-color)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#09D1C7] focus:border-transparent"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #09D1C7 0%, #15919B 100%)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Code"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-[var(--divider-color)]"></div>
            <span className="px-4 text-sm text-[var(--sub-text-color)]">or</span>
            <div className="flex-1 h-px bg-[var(--divider-color)]"></div>
          </div>

          {/* Back to Login */}
          <Link
            to="/"
            className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border"
            style={{
              backgroundColor: "var(--bg-color)",
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-[var(--sub-text-color)]">
            Remember your password?{" "}
            <Link
              to="/"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "var(--accent-color)" }}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword
