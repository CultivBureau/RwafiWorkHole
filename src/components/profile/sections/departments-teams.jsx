import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Users, UserCircle2 } from "lucide-react"

const DepartmentsTeamsSection = ({ data = [], isLoading = false }) => {
  const { t } = useTranslation()
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter((dept) => dept && (dept.name || (dept.teams && dept.teams.length > 0)))
  }, [data])
  const [expandedDepartmentId, setExpandedDepartmentId] = useState(filteredData?.[0]?.id || null)

  useEffect(() => {
    setExpandedDepartmentId(filteredData?.[0]?.id || null)
  }, [filteredData])

  const renderContent = () => {
    if (isLoading) {
      return (
        <div
          className="rounded-2xl border px-6 py-8 text-center"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-color)",
          }}
        >
          <div className="w-10 h-10 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium" style={{ color: "var(--sub-text-color)" }}>
            {t("common.loading", "Loading...")}
          </p>
        </div>
      )
    }

    if (filteredData.length === 0) {
      return (
        <div
          className="rounded-2xl border px-6 py-8 text-center"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-color)",
          }}
        >
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 text-white text-xl"
            style={{ background: "var(--accent-color)" }}>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-base font-semibold" style={{ color: "var(--text-color)" }}>
            {t("profile.noDepartmentsAssigned", "No departments assigned yet.")}
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--sub-text-color)" }}>
            {t("profile.noDepartmentsAssignedHint", "Once this user joins a department, its teams will appear here.")}
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredData.map((department) => {
        const deptId = department.id || department.name
        const isExpanded = expandedDepartmentId === deptId
        const teamCount = department.teams?.length || 0
        const teamCountLabel =
          teamCount === 1
            ? t("profile.singleTeamCount", "1 team")
            : t("profile.teamsCount", { count: teamCount })

        return (
          <div
            key={deptId}
            className="rounded-2xl border transition-shadow duration-200 h-full flex flex-col"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <button
              type="button"
              onClick={() => setExpandedDepartmentId(isExpanded ? null : deptId)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-semibold" style={{ color: "var(--text-color)" }}>
                  {department.name || t("profile.department", "Department")}
                </p>
                {department.description && (
                  <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--sub-text-color)" }}>
                    {department.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "var(--menu-active-bg)",
                    color: "var(--accent-color)",
                  }}
                >
                  {teamCountLabel}
                </span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  style={{ color: "var(--accent-color)" }}
                />
              </div>
            </button>

            {isExpanded && (
              <div className="border-t px-5 py-4 space-y-3 mt-auto"
                style={{ borderColor: "var(--border-color)" }}>
                {teamCount === 0 ? (
                  <p className="text-sm text-center font-medium"
                    style={{ color: "var(--sub-text-color)" }}>
                    {t("profile.noTeamsInDepartment", "No teams inside this department yet.")}
                  </p>
                ) : (
                  department.teams.map((team) => (
                    <div
                      key={team.id || team.name}
                      className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--hover-color)",
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
                          {team.name || t("profile.team", "Team")}
                        </p>
                        {team.description && (
                          <p className="text-xs mt-1" style={{ color: "var(--sub-text-color)" }}>
                            {team.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-left">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "var(--bg-color)", border: `1px solid var(--border-color)` }}>
                            <UserCircle2 className="w-5 h-5" style={{ color: "var(--accent-color)" }} />
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide font-semibold"
                              style={{ color: "var(--sub-text-color)" }}>
                              {t("profile.teamLead", "Team lead")}
                            </p>
                            <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                              {team.leadResolvedName || team.leadName || t("profile.notAssigned", "Not assigned")}
                            </p>
                            {team.leadEmail && (
                              <p className="text-xs" style={{ color: "var(--sub-text-color)" }}>
                                {team.leadEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <h3
          className="text-xl sm:text-2xl font-bold"
          style={{ color: "var(--text-color)" }}
        >
          {t("profile.departmentsHeader", "Departments")}
        </h3>
      </div>
      {renderContent()}
    </div>
  )
}

export default DepartmentsTeamsSection

