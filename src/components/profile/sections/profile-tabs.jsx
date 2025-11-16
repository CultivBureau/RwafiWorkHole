"use client"

import React from "react"
import { User, Briefcase, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function ProfileTabs({ activeTab, onTabChange, isAdmin = false }) {
  const { t } = useTranslation()
  
  const tabs = [
    { id: "personal", label: t("profile.personalInformation"), shortLabel: t("profile.personalInformation"), icon: <User className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "professional", label: t("profile.professionalInformation"), shortLabel: t("profile.professionalInformation"), icon: <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> },
    // Only show account tab if user is admin
    ...(isAdmin ? [{ id: "account", label: t("employees.newEmployeeForm.steps.accountAccess"), shortLabel: t("employees.newEmployeeForm.steps.accountAccess"), icon: <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> }] : []),
  ]

  return (
    <div
      className="flex gap-2 sm:gap-4 lg:gap-13 border-b overflow-x-auto  justify-center items-center"
      style={{ borderColor: "var(--border-color)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4 px-2 sm:px-3 transition-all duration-300 relative group
            font-medium text-xs sm:text-sm flex-shrink-0
            ${activeTab === tab.id ? "" : "hover:scale-105"}
          `}
          style={{
            color:
              activeTab === tab.id
                ? "var(--accent-color)"
                : "var(--sub-text-color)",
          }}
        >
          <div
            className={`transition-all duration-300 ${
              activeTab === tab.id
                ? "scale-110"
                : "group-hover:scale-110"
            }`}
            style={{
              color:
                activeTab === tab.id
                  ? "var(--accent-color)"
                  : "var(--sub-text-color)",
            }}
          >
            {tab.icon}
          </div>

          <span
            className={`transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? "font-semibold"
                : "group-hover:font-medium"
            }`}
            style={{
              color:
                activeTab === tab.id
                  ? "var(--accent-color)"
                  : "var(--text-color)",
            }}
          >
            {/* Show short label on mobile, full label on larger screens */}
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </span>

          {/* Active indicator line */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
              activeTab === tab.id ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundColor: "var(--accent-color)" }}
          />

          {/* Hover indicator line */}
          <div
            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
              activeTab === tab.id
                ? "w-0"
                : "w-0 group-hover:w-full opacity-30"
            }`}
            style={{ backgroundColor: "var(--accent-color)" }}
          />
        </button>
      ))}
    </div>
  )
}
