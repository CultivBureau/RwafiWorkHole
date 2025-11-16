import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import NewEmployeeForm from "../../../components/admin/new-employee/form";
import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const NewEmployee = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return (
    <PermissionGuard 
      backendPermissions={["User.Create"]}
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
            <div className="w-full h-max p-6" dir={isArabic ? "rtl" : "ltr"}>
              {/* Title & Breadcrumb */}
              <div className={`mb-8 ${isArabic ? 'text-right' : 'text-left'}`}>
                <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("employees.newEmployeeForm.title")}</h1>
              </div>
              {/* Status Cards Row */}
              <NewEmployeeForm />
            </div>
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default NewEmployee;