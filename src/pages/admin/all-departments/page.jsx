import { useTranslation } from "react-i18next";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import StatusCards from "../../../components/admin/all-departments/status-cards";
import AllDepartmentsComponent from "../../../components/admin/all-departments/all-departments";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const AllDepartments = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return (
    <PermissionGuard 
      backendPermissions={["Department.View"]}
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
              {/* All Departments content */}
              <div className="w-full h-max p-6">
                {/* Status Cards */}
                <StatusCards />
                
                {/* Main All Departments Component */}
                <AllDepartmentsComponent />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AllDepartments;