import React from "react";
import { useGetUserByIdQuery } from "../../../../services/apis/UserApi";
import { ChevronRight, User } from "lucide-react";

/**
 * Component that fetches and displays a single team member
 * Fetches user details by userId
 */
export default function TeamMemberItem({ userId, isArabic }) {
  const { data: userData, isLoading, error } = useGetUserByIdQuery(userId, {
    skip: !userId
  });

  const user = userData?.value || userData?.data || userData || null;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-between p-3 bg-[var(--bg-color)] rounded-lg ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div className="text-xs text-[var(--sub-text-color)]">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return null; // Don't show anything if user can't be fetched
  }

  // Only show if we have actual user data
  const userName = user?.name || 
                   (user?.firstName || user?.lastName 
                     ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                     : null) ||
                   user?.email || 
                   null;
  
  if (!userName) {
    return null; // Don't render if no valid name/email
  }

  return (
    <div
      className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex items-center gap-3 flex-1 min-w-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={userName}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
        )}
        <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-semibold text-[var(--text-color)] truncate">
            {userName}
          </p>
          {(user?.jobTitle || user?.role || user?.email) && (
            <p className="text-xs text-[var(--sub-text-color)] truncate">
              {user?.jobTitle || user?.role || user?.email}
            </p>
          )}
        </div>
      </div>

      <ChevronRight 
        size={16} 
        className={`text-[var(--sub-text-color)] flex-shrink-0 transition-all duration-200 group-hover/member:text-[var(--accent-color)] group-hover/member:translate-x-1 ${isArabic ? 'rotate-180 group-hover/member:-translate-x-1' : ''}`} 
      />
    </div>
  );
}

