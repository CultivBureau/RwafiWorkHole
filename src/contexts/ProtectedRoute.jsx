import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getUserInfo } from "../utils/page";
import { useMeQuery } from "../services/apis/AuthApi";

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  const location = useLocation();

  // Check if token exists - redirect silently if no token
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Get user data from /me
  const { data: user, isLoading, error } = useMeQuery();
  
  // Also check cookies as fallback (for custom roles or when API fails)
  const userInfoFromCookie = getUserInfo();

  // If we have cookie data (from token), allow access immediately
  // This is critical for custom roles where /me API might fail
  if (userInfoFromCookie) {
    // Allow access even if API is still loading or failed
    return children;
  }

  // While loading user data AND no cookie data, wait
  if (isLoading) {
    return null;
  }

  // If there's an error AND no cookie data, redirect to login
  if (error && !userInfoFromCookie) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // If user is suspended, redirect (but only if we have user data)
  if (user?.status === "suspended") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // If everything is fine, render the protected component
  return children;
};

export default ProtectedRoute;