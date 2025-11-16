import React from "react";
import { useGetUserByIdQuery } from "../../../../services/apis/UserApi";
import { ChevronRight } from "lucide-react";

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
      className={`flex items-center justify-between p-3 bg-[var(--bg-color)] rounded-lg hover:bg-[var(--hover-color)] transition-colors cursor-pointer ${isArabic ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
        {user?.avatar && (
          <img
            src={user.avatar}
            alt={userName}
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-medium text-[var(--text-color)]">
            {userName}
          </p>
          {(user?.jobTitle || user?.role || user?.email) && (
            <p className="text-xs text-[var(--sub-text-color)]">
              {user?.jobTitle || user?.role || user?.email}
            </p>
          )}
        </div>
      </div>

      <ChevronRight size={14} className={`text-[var(--sub-text-color)] ${isArabic ? 'rotate-180' : ''}`} />
    </div>
  );
}

