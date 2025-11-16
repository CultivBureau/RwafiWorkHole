import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import StatusCards from "../../../components/admin/Roles&Permissions/status_cards";
import Header from "../../../components/admin/Roles&Permissions/header";
import RolesTable from "../../../components/admin/Roles&Permissions/table";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const RolesAndPermissions = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  return (
    <PermissionGuard 
      backendPermissions={["Role.View"]}
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
                {/* Header with Search and Add Button */}
                <Header selectedRoleId={selectedRoleId} />
                {/* Roles Table */}
                <RolesTable onRoleSelect={setSelectedRoleId} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default RolesAndPermissions;