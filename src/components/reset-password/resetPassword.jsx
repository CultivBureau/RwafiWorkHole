import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Key, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ 
    email: location.state?.email || "", 
    code: "", 
    newPassword: "" 
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(form).unwrap();
      toast.success("Password reset successful! Please login with your new password.");
      navigate("/");
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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-color)" }}>
            Reset Password
          </h1>
          <p className="text-[var(--sub-text-color)] text-sm">
            Enter the code from your email and your new password.
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
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
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

            {/* Reset Code Input */}
            <div className="space-y-2">
              <label 
                htmlFor="code" 
                className="block text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                Reset Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--sub-text-color)]" />
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
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

            {/* New Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="newPassword" 
                className="block text-sm font-medium"
                style={{ color: "var(--text-color)" }}
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--sub-text-color)]" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#09D1C7] focus:border-transparent"
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)] hover:text-[var(--text-color)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
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
            Didn't receive the code?{" "}
            <Link
              to="/forget-password"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "var(--accent-color)" }}
            >
              Resend code
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword
