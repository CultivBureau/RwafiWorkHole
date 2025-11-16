import { useTranslation } from 'react-i18next';

const RecentActivity = () => {
  const { t } = useTranslation();

  const recentActivity = [
    {
      id: 1,
      name: "Adam",
      title: t("adminDashboard.recentActivity.approvedLeaveRequest", "approved a leave request"),
      time: "3:45 PM",
      avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 2,
      name: "Sara",
      title: t("adminDashboard.recentActivity.approvedLeaveRequest", "approved a leave request"),
      time: "3:45 PM",
      avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 3,
      name: "Mohamed",
      title: t("adminDashboard.recentActivity.approvedLeaveRequest", "approved a leave request"),
      time: "3:45 PM",
      avatar: "/assets/AdminDashboard/avatar.svg",
    },
    {
      id: 4,
      name: "Adam",
      title: t("adminDashboard.recentActivity.approvedLeaveRequest", "approved a leave request"),
      time: "3:45 PM",
      avatar: "/assets/AdminDashboard/avatar.svg",
    },

  ]

  return (
    <div className="w-full xl:max-w-md mt-2 bg-color rounded-2xl shadow-sm border border-[var(--border-color)] p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-[12px] sm:text-[14px] font-semibold text-start text-[var(--text-color)] mb-1">
            {t("adminDashboard.recentActivity.title", "Recent Activity")}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-start text-[var(--text-color)]">
            {t("adminDashboard.recentActivity.today", "Today")}
          </p>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3 sm:space-y-4">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-center gap-2 sm:gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={activity.avatar || "/assets/AdminDashboard/avatar.svg"}
                alt={`${activity.name}'s avatar`}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 text-start min-w-0">
              <p className="text-xs sm:text-sm text-gray-900">
                <span className="font-medium">{activity.name}</span>
                <span className="text-gray-500 ml-1">{activity.title}</span>
              </p>
            </div>

            {/* Time */}
            <div className="flex-shrink-0">
              <span className="text-[10px] sm:text-xs text-gray-400">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentActivity
