import React, { useState, useCallback } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import BreakTable from "../../../components/admin/break/BreakTable";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const BreakAdmin = () => {
  const { t, i18n } = useTranslation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <PermissionGuard 
      backendPermissions={["Break.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
        <NavBarAdmin
          onMobileSidebarToggle={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        <div className="flex flex-1 min-h-0">
          <SideBarAdmin
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={closeMobileSidebar}
          />
          <main className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-all)" }}>
            <div
              className="h-max rounded-2xl border border-gray-200"
              style={{ background: "var(--bg-color)" }}
            >
              <div className="w-full h-max p-6">
                <BreakTable />
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default BreakAdmin;
