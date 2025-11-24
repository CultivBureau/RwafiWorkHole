import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DepartmentCard from './Card';
import { useGetDepartmentClockinLogsQuery } from '../../../../services/apis/ClockinLogApi';

const Departments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useGetDepartmentClockinLogsQuery();

  const departments = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((dept, index) => {
      const totalMembers = Number(dept?.departmentMembers) || 0;
      const presentToday = Number(dept?.presentToday) || 0;
      const absentToday = Number(dept?.absentToday) || 0;
      const safePositiveMembers = totalMembers > 0 ? totalMembers : presentToday + absentToday;
      const percentage = safePositiveMembers
        ? Math.min(
            100,
            Math.max(0, ((presentToday / safePositiveMembers) * 100))
          )
        : 0;

      return {
        id: dept?.department?.id || `${dept?.departmentName || 'dept'}-${index}`,
        departmentName: dept?.departmentName || dept?.department?.name || t("adminDashboard.departments.unknownDepartment", "Unknown Department"),
        memberCount: safePositiveMembers,
        presentCount: presentToday,
        absentCount: absentToday,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
  }, [data, t]);

  const handleViewAllDepartments = () => {
    navigate('/pages/admin/all-departments');
  };

  return (
    <div className="w-full h-max flex justify-center items-center shadow-lg border border-[var(--border-color)] rounded-[22px] p-2 sm:p-3 flex-col">
      <div className='w-full h-max flex pb-2 pl-2 pt-1 justify-between items-center'>
        <h1 className='text-start text-[13px] sm:text-[14px] text-[var(--text-color)] font-medium transition-colors duration-200 flex-1'>
          {t("adminDashboard.departments.overview", "Departments Overview")}
        </h1>
        <button
          onClick={handleViewAllDepartments}
          className='min-w-[60px] sm:min-w-[70px] h-max p-1 flex gradient-text border border-[var(--border-color)] rounded-[8px] text-[10px] sm:text-[11px] justify-center items-center transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.02] hover:border-[var(--accent-color)] hover:bg-[var(--hover-color)] active:scale-[0.98] active:shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-opacity-50'
        >
          {t("adminDashboard.departments.viewAll", "View All")}
        </button>
      </div>
      <div className="w-full space-y-2 sm:space-y-3">
        {isLoading ? (
          <div className="w-full py-6 text-center text-[var(--sub-text-color)] text-[11px]">
            {t("adminDashboard.departments.loading", "Loading department attendance...")}
          </div>
        ) : isError ? (
          <div className="w-full py-6 text-center text-[11px] text-[var(--error-color)] space-y-2">
            <p>{t("adminDashboard.departments.error", "Failed to load department attendance data")}</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 text-[10px] border border-[var(--border-color)] rounded hover:bg-[var(--hover-color)] transition-colors"
            >
              {t("adminDashboard.departments.retry", "Retry")}
            </button>
            {error?.data?.message && (
              <p className="text-[9px] text-[var(--sub-text-color)]">{error.data.message}</p>
            )}
          </div>
        ) : departments.length === 0 ? (
          <div className="w-full py-6 text-center text-[var(--sub-text-color)] text-[11px]">
            {t("adminDashboard.departments.empty", "No department attendance data available")}
          </div>
        ) : (
          departments.slice(0, 4).map((dept) => (
            <DepartmentCard
              key={dept.id}
              departmentName={dept.departmentName}
              memberCount={dept.memberCount}
              presentCount={dept.presentCount}
              absentCount={dept.absentCount}
              percentage={dept.percentage}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Departments;
