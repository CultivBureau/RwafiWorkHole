import React, { useEffect, useMemo } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import Card from "../../../components/Time_Tracking_Components/Stats/Card";
import Table from "../../../components/admin/attendance/AttendanceTable/Table";
import { useGetClockinLogsSummaryQuery } from "../../../services/apis/ClockinLogApi";

const AttendanceAdmin = () => {
  const { t, i18n } = useTranslation();

  // Sync language from localStorage
  useEffect(() => {
    const storedLang = localStorage.getItem("lang") || "en";
    if (i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }
  }, [i18n]);

  // Fetch clock-in logs summary
  const { 
    data: summaryData
  } = useGetClockinLogsSummaryQuery();

  // Create card data from API statistics
  const cardData = useMemo(() => {
    const summary = summaryData?.value || {};
    
    return [
      {
        title: t("adminAttendance.cards.presentToday", "Present Today"),
        value: summary?.totalPresent ?? 0,
        icon: <img src="/assets/AdminDashboard/today.svg" alt="present" />
      },
      {
        title: t("adminAttendance.cards.absentToday", "Absent Today"),
        value: summary?.totalAbsent ?? 0,
        icon: <img src="/assets/AdminDashboard/leavee.svg" alt="absent" />
      },
      {
        title: t("adminAttendance.cards.mostActiveDepartment", "Most Active Department"),
        value: summary?.mostActiveDepartment || t("adminAttendance.cards.noData", "No data"),
        icon: <img src="/assets/AdminDashboard/task.svg" alt="most active" />
      },
      {
        title: t("adminAttendance.cards.leastActiveDepartment", "Least Active Department"),
        value: summary?.leastActiveDepartment || t("adminAttendance.cards.noData", "No data"),
        icon: <img src="/assets/AdminAttendance/total.svg" alt="least active" />
      },
    ];
  }, [summaryData, t]);

  return (
    <PermissionGuard 
      backendPermissions={["ClockinLog.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col bg-[var(--bg-color)]">
        <NavBarAdmin
        />
      <div className="flex flex-1 min-h-0">
        <SideBarAdmin />
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-[var(--bg-color)]">
          {/* Stats Cards - Responsive Grid */}
          <div className="w-full h-max grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
            {cardData.map((card, index) => (
              <Card
                    key={index}
                header={card.title}
                rightIcon={card.icon}
                title={card.value}
              />
            ))}
          </div>

          <div className="w-full h-max">
            <Table />
      </div>

        </main>
      </div>

    </div>
    </PermissionGuard>
  );
};

export default AttendanceAdmin;