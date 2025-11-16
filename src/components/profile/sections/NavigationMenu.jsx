"use client"

import { User, CalendarCheck, FileText, ClipboardList } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function NavigationMenu({ activeSection, onSectionChange }) {
  const { t } = useTranslation()
  
  const sections = [
    { id: "profile", label: t("profile.profile"), icon: User },
    { id: "attendance", label: t("aside.all_attendance"), icon: CalendarCheck },
    { id: "leave", label: t("aside.leaves"), icon: ClipboardList },
  ]

  return (
    <div 
      className="rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border"
      style={{ 
        backgroundColor: 'var(--bg-color)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-color)'
      }}
    >
      {/* Horizontal layout for 1024px-1140px range, vertical for xl and above */}
      <div className="flex xl:flex-col overflow-x-auto xl:overflow-x-visible">
        {sections.map((section, index) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          const isFirst = index === 0
          const isLast = index === sections.length - 1

          return (
            <div key={section.id} className="flex-shrink-0 xl:w-full">
              <button
                onClick={() => onSectionChange(section.id)}
                className={`
                  w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 text-left transition-all duration-200
                  ${isFirst ? "xl:rounded-t-xl xl:sm:rounded-t-2xl" : ""}
                  ${isLast ? "xl:rounded-b-xl xl:sm:rounded-b-2xl" : ""}
                  ${isActive ? "" : "hover:bg-[var(--hover-color)]"}
                `}
                style={{
                  background: isActive 
                    ? 'linear-gradient(135deg, #09D1C7 0%, #15919B 100%)' 
                    : 'transparent',
                }}
              >
                <Icon 
                  className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" 
                  strokeWidth={1.5}
                  style={{
                    color: isActive ? '#ffffff' : 'var(--sub-text-color)'
                  }}
                />
                <span 
                  className="text-sm sm:text-lg font-medium whitespace-nowrap"
                  style={{
                    color: isActive ? '#ffffff' : 'var(--text-color)'
                  }}
                >
                  {section.label}
                </span>
              </button>
              
              {/* Divider line between non-active items - only show on xl screens */}
              {index < sections.length - 1 && !isActive && (
                <div 
                  className="h-px mx-4 sm:mx-6 hidden xl:block" 
                  style={{ backgroundColor: 'var(--divider-color)' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
