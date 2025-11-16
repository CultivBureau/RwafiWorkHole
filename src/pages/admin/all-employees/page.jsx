import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import StatusCards from "../../../components/admin/all-employees/status-cards";
import EmployeesTable from "../../../components/admin/all-employees/table";
import Loading from "../../../components/Loading/Loading";
import { useGetAllUsersQuery } from "../../../services/apis/UserApi";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import { useTranslation } from "react-i18next";
const AllEmployees = () => {
  // Fetch users data at the page level to check loading state (initial load only)
  const { isLoading: isLoadingUsers, data: initialData } = useGetAllUsersQuery({ pageNumber: 1, pageSize: 100 });
  const { t } = useTranslation();
  // Only show loading on initial load (when there's no data yet)
  const isInitialLoading = isLoadingUsers && !initialData;

  // Show loading component only on initial load
  if (isInitialLoading) {
    return <Loading />;
  }

  return (
    <PermissionGuard 
      backendPermissions={["User.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
      {/* Navigation Bar */}
      <NavBarAdmin />

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <SideBarAdmin />


        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-all)" }}>
          <div
            className="h-max rounded-2xl border border-gray-200"
            style={{ background: "var(--bg-color)" }}
          >
            {/* Break Tracking content */}
            <div className="w-full h-max p-6">
              {/* Status Cards Row */}
              <StatusCards />
              <EmployeesTable />
            </div>
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default AllEmployees;