"use client"

import { Mail, Briefcase, Pencil } from "lucide-react"
import { useTranslation } from "react-i18next"

const HeaderSection = ({ firstName, lastName, email, role, avatar, teamLeader, teamLeaderAvatar, isAdminView = false }) => {
  const { t } = useTranslation()

  return (
    <div className="bg-[var(--bg-color)] shadow-sm rounded-lg border border-[var(--border-color)]">
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6">
        {/* Left side - User Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          {/* User Profile Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={avatar || "/api/placeholder/80/80"} 
              alt={`${firstName} ${lastName}`} 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* User Details */}
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--text-color)' }}>
              {firstName} {lastName}
            </h1>
            
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Briefcase className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
              <span className="text-sm" style={{ color: 'var(--sub-text-color)' }}>
                {role || t("profile.projectManager")}
              </span>
            </div>
            
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
              <span className="text-sm break-all sm:break-normal" style={{ color: 'var(--text-color)' }}>
                {email}
              </span>
            </div>
          </div>
        </div>

        {/* Center - Team Lead Section */}
        {teamLeader && (
          <div className="flex flex-col items-center gap-3 order-last sm:order-none">
            <span className="text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
              {t("profile.teamLead")}
            </span>
            <div className="flex items-center gap-3">
              {teamLeaderAvatar && (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100">
                  <img 
                    src={teamLeaderAvatar || "/api/placeholder/48/48"} 
                    alt={teamLeader} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                  {teamLeader}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right side - Edit Button (only show if not in admin view) */}
        {!isAdminView && (
          <button
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:opacity-90 w-full sm:w-auto justify-center sm:justify-start"
            style={{ backgroundColor: "#4DB8AC" }}
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">{t("profile.editProfile")}</span>
            <span className="sm:hidden">{t("profile.editProfile")}</span>
          </button>
        )}
      </div>

      {/* Bottom border */}
      <div className="w-full h-px bg-gray-200"></div>
    </div>
  )
}

export default HeaderSection
