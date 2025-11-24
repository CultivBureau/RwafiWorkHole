import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import NewTeamForm from "../../../components/admin/all-departments/all-teams/new-team-form";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const NewTeam = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const departmentId = params.get('departmentId');

  return (
    <PermissionGuard 
      backendPermissions={["Team.Create"]}
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
          <main className="flex-1 overflow-auto p-6" style={{ background: "var(--bg-all)" }}>
            <div
              className="h-max rounded-2xl border-2 border-[var(--border-color)] shadow-lg"
              style={{ background: "var(--bg-color)" }}
            >
              {/* New Team content */}
              <div className="w-full h-max p-8">
                <NewTeamForm departmentId={departmentId} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default NewTeam;

