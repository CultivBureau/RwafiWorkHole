 "use client"

import { useState } from "react"
import { User, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

const PersonalInfo = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profile")

  const tabs = [
    { id: "profile", label: t("profile.profile"), icon: User },
  ]

  const handleClose = () => {
    navigate("/pages/User/dashboard")
  }

  const renderTabContent = () => {
    if (activeTab === "profile") {
      return (
        <div className="relative">
          {/* Sub-tabs for Profile */}
          <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg bg-transparent border-none">
              <User className="w-4 h-4" style={{ color: "var(--gradient-start)" }} />
              <span className="gradient-text font-semibold">{t("profile.personalInformation")}</span>
            </button>
          </div>

          {/* Personal Information Content */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {/* First Name */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.firstName")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                Brooklyn
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.lastName")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                Simmons
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.mobileNumber")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                01110238273
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.emailAddress")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                brooklyn.s@example.com
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.department")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                Project Manager
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.position")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                Project Manager
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.dateOfBirth")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                July 14, 1995
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                {t("profile.gender")}
              </label>
              <div className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                {t("profile.female")}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--sub-text-color)" }}>Content for {activeTab} tab</p>
      </div>
    )
  }

  return (
    <div className="flex gap-6 relative">
      {/* Sidebar with tabs */}
      <div
        className="w-48 flex flex-col flex-shrink-0 rounded-t-2xl"
        style={{
          background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
          color: "#fff",
          alignSelf: "flex-start"
        }}
      >
        <div className="space-y-1 pt-2 pb-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 bg-transparent hover:bg-white/10 rounded-none rounded-t-xl`}
                style={{
                  color: "#fff",
                }}
              >
                <IconComponent className="w-4 h-4" color="#fff" />
                <span className={activeTab === tab.id ? "font-bold" : ""}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Main content area */}
      <div className="flex-1">
        {renderTabContent()}
      </div>
      {/* X Button - Bottom Corner */}
      <button
        onClick={handleClose}
        className="absolute bottom-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        style={{
          backgroundColor: "var(--sub-text-color)",
          color: "var(--bg-color)",
          right: 0
        }}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

export default PersonalInfo
