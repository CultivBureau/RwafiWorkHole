import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import NavBarAdmin from "../../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../../components/admin/SideBarAdmin";
import ShiftAssignmentsComponent from "../../../../components/admin/all-shifts/shift-assignments";
import { PermissionGuard } from "../../../../components/common/PermissionGuard";

const ShiftAssignments = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { shiftId } = useParams();
  const navigate = useNavigate();

  return (
    <PermissionGuard 
      backendPermissions={["ShiftAssignment.View", "ShiftAssignment.AssignUser"]}
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
            {/* Shift Assignments content */}
            <div className="w-full h-max p-6">
              <ShiftAssignmentsComponent shiftId={shiftId} onBack={() => navigate('/pages/admin/shifts')} />
            </div>
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default ShiftAssignments;

