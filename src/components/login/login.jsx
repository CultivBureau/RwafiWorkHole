import React, { useState } from "react";
import { useLoginMutation } from "../../services/apis/AuthApi";
import { useGetUserCompaniesByEmailMutation } from "../../services/apis/CompanyApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import LogoIcon from "../../assets/side-menu-icons/logo.svg";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  CheckCircle,
  Loader2,
  Building2,
  ChevronDown,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { setPermissionsFromToken, getAuthToken } from "../../utils/page";

const Login = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [login, { isLoading }] = useLoginMutation();
  const [getUserCompanies, { isLoading: isLoadingCompanies }] = useGetUserCompaniesByEmailMutation();
  
  const [step, setStep] = useState(1); // 1 = email step, 2 = company/password step
  const [email, setEmail] = useState("");
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyId: "",
  });

  const isRtl = i18n.language === 'ar';

  // Set document direction on mount and when language changes
  React.useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  // Step 1: Handle email submission to fetch companies
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('login.enterEmail') || 'Please enter your email');
      return;
    }

    try {
      const result = await getUserCompanies(email).unwrap();
      
      const fetchedCompanies = result.value || [];
      
      if (fetchedCompanies.length === 0) {
        toast.error(t('login.noCompanies') || 'No companies found for this email');
        return;
      }

      setCompanies(fetchedCompanies);
      setStep(2); // Move to company/password step
    } catch (err) {
      const errorMessage = err?.data?.errorMessage || err?.data?.message || err?.message || 'Failed to fetch companies';
      toast.error(errorMessage);
    }
  };

  // Step 2: Handle final login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !formData.password) {
      toast.error(t('login.fillAllFields') || 'Please fill all fields');
      return;
    }

    try {
      const loginPayload = {
        email: email,
        password: formData.password,
        companyId: selectedCompany.companyId,
      };

      const res = await login(loginPayload).unwrap();

      toast.success(t('login.loginSuccess') || 'Login successful!');

      // Handle new API response structure with 'value' wrapper
      const responseValue = res.value || res;

      // Get accessToken from new API structure (accessToken instead of token)
      const accessToken = responseValue?.accessToken || responseValue?.token || res.value?.value?.token;
      const refreshToken = responseValue?.refreshToken;
      
      if (accessToken) {
        try {
          // Tokens are already saved by AuthApi onQueryStarted handler
          // Decode accessToken to extract user info and roles
          const decoded = jwtDecode(accessToken);
          
          // Save decoded user info in cookies (must be done before navigation)
          Cookies.set('user_info', JSON.stringify(decoded), { expires: 2 });
          
          // Extract and save permissions from accessToken
          const permissions = setPermissionsFromToken(accessToken);
          
          // Store refreshToken expiry if available
          if (responseValue?.refreshTokenExpiresAt) {
            Cookies.set("refresh_token_expires_at", responseValue.refreshTokenExpiresAt, { expires: 20 });
          }
          
          // Check for roles in MS identity claim
          const msRoleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
          let roles = decoded[msRoleKey] || [];
          const rolesArray = Array.isArray(roles) ? roles : [roles];
          
          // Helper function to normalize role - handle both object format {id, name} and string format
          const normalizeRole = (role) => {
            if (!role) return null;
            if (typeof role === 'string') return role.toLowerCase();
            if (typeof role === 'object' && role?.name) return role.name.toLowerCase();
            return null;
          };
          
          const normalizedRoles = rolesArray.map(normalizeRole).filter(Boolean);
          const isAdmin = normalizedRoles.some(r => r === 'admin');
          
          // Determine dashboard path based on role
          const dashboardPath = isAdmin ? "/pages/admin/dashboard" : "/pages/User/dashboard";
          
          // Ensure cookies are saved before navigation
          // Small delay to ensure cookies are persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          // Navigate to dashboard - React Router will handle the rest
          // No page reload needed - cookies are already set and ProtectedRoute will allow access
          navigate(dashboardPath, { replace: true });
        } catch (decodeError) {
          toast.error('Failed to decode authentication token');
          return;
        }
      } else {
        // fallback to old logic if no token found
        const isAdmin = responseValue?.isAdmin || false;
        const dashboardPath = isAdmin ? "/pages/admin/dashboard" : "/pages/User/dashboard";
        
        // Ensure cookies are saved before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        navigate(dashboardPath, { replace: true });
      }

    } catch (err) {
      const errorMessage = err?.data?.errorMessage || err?.data?.message || err?.message || t('login.loginFailed');
      toast.error(errorMessage);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBackToEmail = () => {
    setStep(1);
    setSelectedCompany(null);
    setCompanies([]);
    setFormData({ ...formData, password: "" });
    setShowCompanyDropdown(false);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    // Update document direction for RTL support
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCompanyDropdown && !event.target.closest('.company-dropdown')) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompanyDropdown]);

  return (
    <div className="min-h-screen h-screen flex overflow-hidden">
      {/* Left Panel - hidden on mobile */}
      <div className="hidden lg:flex flex-1 bg-[var(--bg-color)] items-center justify-center relative overflow-hidden">
        <img
          src="/assets/back.png"
          alt="Login dashboard mockup"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Panel */}
      <div className="w-full lg:flex-1 bg-[var(--bg-color)] lg:border-l border-[var(--border-color)] lg:rounded-l-3xl lg:shadow-2xl lg:shadow-gray-500 flex items-center justify-center relative">
        {/* Language Toggle */}
        <div className={`absolute top-4 z-10 ${isRtl ? "left-4" : "right-4"}`}>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            <Globe className="w-4 h-4" />
            <span>
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </span>
          </button>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md px-6 py-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={LogoIcon} alt="WorkHole" className="w-10 h-10" />
              <h1 className="text-3xl">
                <span className="font-bold gradient-text">Work</span>
                <span style={{ color: "var(--text-color)" }}>Hole</span>
              </h1>
            </div>
            <img
              src="/assets/Login.png"
              alt="Login Illustration"
              className="mx-auto mb-6 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
            />
          </div>

          {/* Login Form - Step 1: Email */}
          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className={`text-gray-600 block text-sm ${isRtl ? "text-right" : "text-left"}`}
                >
                  {t('login.emailAddress')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('login.enterEmail')}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${isRtl ? "text-right" : "text-left"}`}
                  dir={isRtl ? "rtl" : "ltr"}
                />
              </div>

              {/* Submit Button for Step 1 */}
              <button
                type="submit"
                disabled={isLoadingCompanies || !email}
                className="w-full gradient-bg text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingCompanies ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('login.loading')}</span>
                  </div>
                ) : (
                  <div className={`flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t('login.continue')}</span>
                    {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                  </div>
                )}
              </button>
            </form>
          ) : (
            /* Login Form - Step 2: Company Dropdown & Password */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToEmail}
                className={`flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors mb-2 ${isRtl ? "ml-auto flex-row-reverse" : ""}`}
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{t('login.backToEmail')}</span>
              </button>

              {/* Company Dropdown */}
              <div className="space-y-2">
                <label
                  htmlFor="company"
                  className={`text-gray-600 block text-sm ${isRtl ? "text-right" : "text-left"}`}
                >
                  {t('login.selectCompany')}
                </label>
                <div className="relative company-dropdown">
                  <button
                    type="button"
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all flex items-center justify-between ${
                      selectedCompany ? 'text-gray-900' : 'text-gray-400'
                    } ${isRtl ? "text-right flex-row-reverse" : "text-left"}`}
                    dir={isRtl ? "rtl" : "ltr"}
                  >
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Building2 className="w-5 h-5" />
                      <span>
                        {selectedCompany?.companyName || t('login.chooseCompany')}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showCompanyDropdown && (
                    <div 
                      className={`absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto ${isRtl ? 'right-0' : 'left-0'}`}
                      dir={isRtl ? "rtl" : "ltr"}
                    >
                      {companies.map((company) => (
                        <button
                          key={company.companyId}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className={`w-full px-4 py-3 text-sm transition-all flex items-center justify-between hover:bg-gray-50 ${
                            selectedCompany?.companyId === company.companyId
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-gray-900'
                          } ${isRtl ? "text-right flex-row-reverse" : "text-left"}`}
                        >
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Building2 className="w-5 h-5" />
                            <span className="font-medium">{company.companyName}</span>
                          </div>
                          {selectedCompany?.companyId === company.companyId && (
                            <Check className="w-5 h-5 text-teal-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Show count of companies */}
                {companies.length > 0 && (
                  <p className={`text-xs text-gray-500 ${isRtl ? "text-right" : "text-left"}`}>
                    {companies.length} {companies.length === 1 ? t('login.companyAvailable') : t('login.companiesAvailable')}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative">
                  <label
                    htmlFor="password"
                    className={`text-gray-600 block text-sm ${isRtl ? "text-right" : "text-left"}`}
                  >
                    {t('login.password')}
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder={t('login.enterPassword')}
                    className={`w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${isRtl ? "text-right pr-12 pl-4" : "text-left pl-4 pr-12"}`}
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isRtl ? "left-3" : "right-3"} top-[38px] text-gray-400 hover:text-gray-600`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className={`text-sm text-gray-600 ${isRtl ? "mr-2" : "ml-2"}`}>
                    {t('login.rememberMe')}
                  </span>
                </label>
                <Link
                  to="/forget-password"
                  className="text-sm gradient-text font-semibold hover:text-teal-600 hover:underline"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedCompany || !formData.password}
                className="w-full gradient-bg text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('login.signingIn')}</span>
                  </div>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
