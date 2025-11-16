import { MoreHorizontal, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

const TransactionTable = () => {
  const { t } = useTranslation()
  
  const data = [
    {
      id: 1,
      TransactionDate: "Sep 9, 2024, 04:30pm",
      IssuedBy: "Shamy wael",
      Team: "Design Team",
      Employee: "Ahmed Hassan",
      Action: "Penalty",
      Amount: "EGP 1,000",
      Reason: "Will help the team speed up the process and deliver projects on time",
      Avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 2,
      TransactionDate: "Sep 9, 2024, 04:30pm",
      IssuedBy: "Shamy wael",
      Team: "Design Team",
      Employee: "Ahmed Hassan",
      Action: "Penalty",
      Amount: "EGP 1,000",
      Reason: "Will help the team speed up the process and deliver projects on time",
      Avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 3,
      TransactionDate: "Sep 9, 2024, 04:30pm",
      IssuedBy: "Shamy wael",
      Team: "Design Team",
      Employee: "Ahmed Hassan",
      Action: "Penalty",
      Amount: "EGP 1,000",
      Reason: "Will help the team speed up the process and deliver projects on time",
      Avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 4,
      TransactionDate: "Sep 9, 2024, 04:30pm",
      IssuedBy: "Shamy wael",
      Team: "Design Team",
      Employee: "Ahmed Hassan",
      Action: "Penalty",
      Amount: "EGP 1,000",
      Reason: "Will help the team speed up the process and deliver projects on time",
      Avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 5,
      TransactionDate: "Sep 9, 2024, 04:30pm",
      IssuedBy: "Shamy wael",
      Team: "Design Team",
      Employee: "Ahmed Hassan",
      Action: "Penalty",
      Amount: "EGP 1,000",
      Reason: "Will help the team speed up the process and deliver projects on time",
      Avatar: "/assets/AdminDashboard/avatar.svg",
    }
  ]

  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ backgroundColor: "var(--table-bg)" }}>
          <thead>
            <tr className="border-b border-[var(--border-color)]" style={{ backgroundColor: "var(--table-header-bg, var(--bg-color))" }}>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.transactionDate")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.issuedBy")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.team")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.employee")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.action")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm whitespace-nowrap" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.amount")}
              </th>
              <th className="text-left py-4 px-6 font-medium text-sm min-w-[200px]" style={{ color: "var(--sub-text-color)" }}>
                {t("adminTeamWallet.table.columns.reason")}
              </th>
              <th className="w-20 py-4 px-6"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors duration-200 group"
              >
                <td className="py-4 px-6">
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--text-color)" }}>
                    {row.TransactionDate}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={row.Avatar || "/placeholder.svg"}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--text-color)" }}>
                      {row.IssuedBy}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--text-color)" }}>
                    {row.Team}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--text-color)" }}>
                    {row.Employee}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                    {t("adminTeamWallet.table.actionTypes.penalty")}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--text-color)" }}>
                    {row.Amount}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="max-w-[250px]">
                    <span className="text-sm line-clamp-2" style={{ color: "var(--sub-text-color)" }}>
                      {row.Reason}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors duration-150"
                      title={t("adminTeamWallet.table.actions.viewDetails")}
                    >
                      <Eye className="w-4 h-4" style={{ color: "var(--sub-text-color)" }} />
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors duration-150"
                      title={t("adminTeamWallet.table.actions.moreOptions")}
                    >
                      <MoreHorizontal className="w-4 h-4" style={{ color: "var(--sub-text-color)" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View (only visible on small screens) */}
      <div className="md:hidden">
        <div className="space-y-4 p-4 sm:p-6">
          {data.map((row, index) => (
            <div
              key={row.id}
              className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={row.Avatar || "/placeholder.svg"}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                      {row.IssuedBy}
                    </p>
                    <p className="text-xs" style={{ color: "var(--sub-text-color)" }}>
                      {row.TransactionDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors"
                    title={t("adminTeamWallet.table.actions.viewDetails")}
                  >
                    <Eye className="w-4 h-4" style={{ color: "var(--sub-text-color)" }} />
                  </button>
                  <button 
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors"
                    title={t("adminTeamWallet.table.actions.moreOptions")}
                  >
                    <MoreHorizontal className="w-4 h-4" style={{ color: "var(--sub-text-color)" }} />
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--sub-text-color)" }}>{t("adminTeamWallet.table.columns.team")}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>{row.Team}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--sub-text-color)" }}>{t("adminTeamWallet.table.columns.employee")}</p>
                  <p className="font-medium" style={{ color: "var(--text-color)" }}>{row.Employee}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--sub-text-color)" }}>{t("adminTeamWallet.table.columns.action")}</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full">
                    {t("adminTeamWallet.table.actionTypes.penalty")}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--sub-text-color)" }}>{t("adminTeamWallet.table.columns.amount")}</p>
                  <p className="font-semibold" style={{ color: "var(--text-color)" }}>{row.Amount}</p>
                </div>
              </div>

              {/* Reason */}
              <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                <p className="text-xs font-medium mb-1" style={{ color: "var(--sub-text-color)" }}>{t("adminTeamWallet.table.columns.reason")}</p>
                <p className="text-sm" style={{ color: "var(--sub-text-color)" }}>{row.Reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-color)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--sub-text-color)" }}>
            {t("adminTeamWallet.table.pagination.showing", { from: 1, to: 5, total: 25 })}
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-color)] transition-colors disabled:opacity-50" disabled>
              {t("adminTeamWallet.table.pagination.previous")}
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 text-sm rounded-lg bg-[var(--accent-color)] text-white">1</button>
              <button className="w-8 h-8 text-sm rounded-lg hover:bg-[var(--hover-color)] transition-colors" style={{ color: "var(--text-color)" }}>2</button>
              <button className="w-8 h-8 text-sm rounded-lg hover:bg-[var(--hover-color)] transition-colors" style={{ color: "var(--text-color)" }}>3</button>
            </div>
            <button className="px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-color)] transition-colors" style={{ color: "var(--text-color)" }}>
              {t("adminTeamWallet.table.pagination.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionTable
