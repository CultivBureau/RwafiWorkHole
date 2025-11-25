import React, { useState } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  AlertTriangle,
  User,
  CalendarDays,
  MessageSquare,
  Paperclip,
  Settings,
} from "lucide-react";

import Card from "../../../components/Time_Tracking_Components/Stats/Card";
import TeamLeadLeavesTable from "../../../components/admin/leaves/LeavesTable/TeamLeadLeavesTable";
import HrLeavesTable from "../../../components/admin/leaves/LeavesTable/HrLeavesTable";
import LeaveTypesModal from "../../../components/admin/leaves/LeaveTypesModal";
import { hasBackendPermission } from "../../../utils/permissionMapping";
import { getPermissions } from "../../../utils/page";
import { useGetLeaveStatisticsQuery } from "../../../services/apis/LeaveApi";

const LeavesAdmin = () => {
  const { t } = useTranslation();
  const backendPermissions = getPermissions() || [];
  const [showLeaveTypesModal, setShowLeaveTypesModal] = useState(false);
  const { data: statsData, isLoading: isLoadingStats } = useGetLeaveStatisticsQuery();

  // Check if user has Team Lead permissions (ViewTeams OR Review)
  const hasTeamLeadPermissions = hasBackendPermission(backendPermissions, [
    "LeaveRequest.ViewTeams",
    "LeaveRequest.Review",
  ]);

  // Check if user has HR permissions (Confirm)
  const hasHrPermissions = hasBackendPermission(backendPermissions, [
    "LeaveRequest.Confirm",
  ]);

  // Determine which view to show (only one table should be visible)
  // Priority: HR permissions take precedence
  const showHrView = hasHrPermissions;
  const showTeamLeadView = hasTeamLeadPermissions && !hasHrPermissions;

  // Extract statistics from API response
  const stats = statsData?.value || {};

  // Helper function to convert camelCase to Title Case
  const formatHeader = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Dynamically create cards from API response fields
  const iconMap = {
    totalRequests: <img src="/assets/AdminDashboard/total.svg" alt="Total Requests" />,
    pendingApprovals: <img src="/assets/AdminDashboard/leavee.svg" alt="Pending Approvals" />,
    approvedRequests: <img src="/assets/AdminDashboard/app.svg" alt="Approved Requests" />,
    rejectedRequests: <img src="/assets/AdminDashboard/task.svg" alt="Rejected Requests" />,
  };

  const cardData = Object.entries(stats).map(([key, value]) => {
    const translationKey = `adminLeaves.statusCards.${key}`;
    const translatedTitle = t(translationKey);
    const title =
      translatedTitle !== translationKey
        ? translatedTitle
        : formatHeader(key);

    return {
      title,
      value: isLoadingStats || value === undefined || value === null ? "..." : value.toString(),
      icon: iconMap[key] || <img src="/assets/AdminDashboard/total.svg" alt={title} />,
    };
  });

  const gridColsClass = cardData.length === 1 ? "lg:grid-cols-1" : 
                        cardData.length === 2 ? "lg:grid-cols-2" : 
                        cardData.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <PermissionGuard 
      backendPermissions={["LeaveRequest.View", "LeaveRequest.ViewTeams", "LeaveRequest.Review", "LeaveRequest.Confirm", "LeaveRequest.Override"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
    <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
      <NavBarAdmin/>
      <div className="flex flex-1 min-h-0">
        <SideBarAdmin />
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-[var(--bg-all)]">
          {/* Stats Cards - Responsive Grid */}
          <div className={`w-full h-max grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5`}>
            {cardData.map((card, index) => (
              <Card
                key={index}
                header={card.title}
                rightIcon={card.icon}
                title={card.value}
              />
            ))}
          </div>

          {/* Leave Types Management Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowLeaveTypesModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Settings size={16} />
              <span>{t("adminLeaves.manageLeaveTypes", "Manage Leave Types")}</span>
            </button>
          </div>
          
          {/* Conditional rendering based on permissions - only one table should show */}
          {showHrView && (
            <div className="w-full h-max">
              <HrLeavesTable />
            </div>
          )}
          
          {showTeamLeadView && (
            <div className="w-full h-max">
              <TeamLeadLeavesTable />
            </div>
          )}

          {/* Leave Types Modal */}
          {showLeaveTypesModal && (
            <LeaveTypesModal
              isOpen={showLeaveTypesModal}
              onClose={() => setShowLeaveTypesModal(false)}
            />
          )}
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default LeavesAdmin;