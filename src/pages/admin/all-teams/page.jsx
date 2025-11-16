import React from 'react';
import SideBarAdmin from '../../../components/admin/SideBarAdmin';
import NavBarAdmin from '../../../components/admin/NavBarAdmin';
import AllTeamsComponent from '../../../components/admin/all-departments/all-teams/all-teams';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { useTranslation } from 'react-i18next';

const AllTeamsPage = () => {
  const { t } = useTranslation();
  
  return (
    <PermissionGuard 
      backendPermissions={["Team.View"]}
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
            {/* All Teams content */}
            <div className="w-full h-max p-6">
               <AllTeamsComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default AllTeamsPage;