import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, Shield } from "lucide-react";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import AssignRoleUsersTable from "../../../components/admin/Roles&Permissions/AssignRoleUsersTable";
import { useGetRoleByIdQuery } from "../../../services/apis/RoleApi";

const AssignRoleUsers = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { roleId } = useParams();
  const navigate = useNavigate();

  // Fetch role details to get role name
  const { data: roleResponse, isLoading: isLoadingRole } = useGetRoleByIdQuery(roleId, { skip: !roleId });
  const roleName = roleResponse?.value?.name || '';

  const handleBack = () => {
    navigate("/pages/admin/Roles&Permissions");
  };

  return (
    <PermissionGuard 
      backendPermissions={["Role.Update", "Role.ViewUsers"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-t-[var(--accent-color)] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <span className="text-[var(--sub-text-color)] font-medium">{t('common.loading') || 'Loading...'}</span>
          </div>
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
          <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "var(--bg-all)" }}>
            {/* Hero Header Section */}
            <div className="mb-6">
              {/* Back Button */}
              <div className={`flex items-center mb-6 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                <button
                  onClick={handleBack}
                  className="btn-secondary flex items-center gap-2 hover:scale-105 transition-transform"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {isArabic ? (
                    <ArrowRight className="w-4 h-4" />
                  ) : (
                    <ArrowLeft className="w-4 h-4" />
                  )}
                  <span>{t('roles.back') || t('common.back') || 'Back'}</span>
                </button>
              </div>

              {/* Header with Gradient Icon Badge */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
                {/* Gradient Icon Badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 ${isArabic ? '-left-1' : '-right-1'} w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white`}>
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Title and Subtitle */}
                <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                  <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
                    {t('roles.assignUsersPage.title') || 'Manage Role Assignments'}
                  </h1>
                  {!isLoadingRole && roleName && (
                    <p className={`text-[var(--sub-text-color)] text-sm flex items-center gap-2 mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <span>{t('roles.assignUsersPage.roleLabel') || 'Role'}:</span>
                      <span className="font-semibold text-[var(--accent-color)]">{roleName}</span>
                    </p>
                  )}
                  <p className="text-[var(--sub-text-color)] text-sm">
                    {t('roles.assignUsersPage.description') || 'Assign or remove users from this role'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="rounded-2xl border-2 border-[var(--border-color)] p-6 shadow-lg" style={{ background: "var(--bg-color)" }}>
              {/* Users Table */}
              <AssignRoleUsersTable roleId={roleId} roleName={roleName} />
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AssignRoleUsers;

