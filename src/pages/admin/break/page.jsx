import React, { useState, useCallback } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import BreakTable from "../../../components/admin/break/BreakTable";
import BreakLogsTable from "../../../components/admin/break/BreakLogsTable";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const BreakAdmin = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("types"); // "types" or "logs"

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
                {/* Tabs */}
                <div className="mb-6 border-b border-[var(--border-color)]">
                  <div className={`flex gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => setActiveTab("types")}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "types"
                          ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                          : "border-transparent text-[var(--sub-text-color)] hover:text-[var(--text-color)]"
                      }`}
                      style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    >
                      {t("breakAdmin.tabs.types", "Break Types")}
                    </button>
                    <button
                      onClick={() => setActiveTab("logs")}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === "logs"
                          ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                          : "border-transparent text-[var(--sub-text-color)] hover:text-[var(--text-color)]"
                      }`}
                      style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    >
                      {t("breakAdmin.tabs.logs", "Break Logs")}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === "types" ? <BreakTable /> : <BreakLogsTable />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default BreakAdmin;
