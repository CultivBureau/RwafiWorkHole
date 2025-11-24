import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Edit, Trash2, MoreVertical, RotateCcw } from "lucide-react";
import GroupDepartmentIcon from '/assets/groupDepartments.svg';
import { useGetDepartmentSupervisorQuery, useDeleteDepartmentMutation, useRestoreDepartmentMutation } from "../../../services/apis/DepartmentApi";
import { useGetTeamsByDepartmentQuery, useGetTeamUsersQuery } from "../../../services/apis/TeamApi";
import { useHasPermission } from "../../../hooks/useHasPermission";

export default function DepartmentCard({ department, onDelete, canUpdate = true, canDelete = true, canRestore = true }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = i18n.language === "ar";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();
    const [restoreDepartment, { isLoading: isRestoring }] = useRestoreDepartmentMutation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    
    // Permission checks for Department actions
    const canViewSupervisor = useHasPermission('Department.GetSupervisor');
    const canAssignSupervisor = useHasPermission('Department.AssignSupervisor');
    const canRemoveSupervisor = useHasPermission('Department.RemoveSupervisor');
    
    // Permission checks for Team actions - only show teams if user has Team.View
    const canViewTeams = useHasPermission('Team.View');
    const canViewMembers = useHasPermission('Team.ViewMembers');
    
    // Determine if department is inactive/deleted based on API status field
    // Check multiple possible field names: status === false, status === 'Inactive', isDeleted === true, etc.
    const isInactive = React.useMemo(() => {
        // Check status field - could be boolean false, string 'Inactive', or number 0
        if (department?.status === false || department?.status === 0 || department?.status === 'Inactive' || department?.status === 'inactive') {
            return true;
        }
        
        // Check deleted flags
        if (department?.isDeleted === true || department?.deleted === true) {
            return true;
        }
        
        // If status exists but is not explicitly active, consider it inactive
        if (department?.status !== undefined && department?.status !== true && department?.status !== 1 && department?.status !== 'Active' && department?.status !== 'active') {
            return true;
        }
        
        return false;
    }, [department?.status, department?.isDeleted, department?.deleted]);
    
    // Only fetch supervisor if user has permission to view supervisor
    const { data: supervisorResp, isLoading: isSupervisorLoading } = useGetDepartmentSupervisorQuery(
        department.id, 
        { skip: !department?.id || !department?.supervisorId || !canViewSupervisor }
    );
    const supervisor = supervisorResp?.value || supervisorResp?.data || supervisorResp || null;
    
    // Fetch teams for this department using GetTeamsByDepartment API - only if user has permission
    const { data: teamsData, isLoading: isLoadingTeams } = useGetTeamsByDepartmentQuery(department.id, {
        skip: !department?.id || !canViewTeams
    });
    
    // Parse teams from API response
    const teams = React.useMemo(() => {
        const items = teamsData?.value || teamsData?.data || teamsData?.items || teamsData || [];
        return Array.isArray(items) ? items.map(team => {
            // Extract team leader information from new API structure
            const teamLeader = team.teamLeader || team.teamLead || null;
            const teamLeaderName = teamLeader 
                ? `${teamLeader.firstName || ''} ${teamLeader.lastName || ''}`.trim() || teamLeader.userName || teamLeader.email || null
                : null;
            
            return {
                id: team.id,
                name: team.name,
                description: team.description || null,
                teamLeader: teamLeaderName,
                teamLeaderJobTitle: teamLeader?.jobTitle || null,
                teamLeadId: team.teamLeadId || team.teamLeader?.id || team.teamLead?.id || null,
            };
        }) : [];
    }, [teamsData]);

    // Helper component to fetch and display team member count - only if user has permission
    function TeamMemberCount({ team }) {
        const { t } = useTranslation();
        const teamId = team?.id;
        const teamLeadId = team?.teamLeadId;
        
        // Permission check for viewing members
        const canViewMembers = useHasPermission('Team.ViewMembers');
        
        // Fetch team users/members - only if user has permission
        const { data: teamUsersData, isLoading: isLoadingMembers } = useGetTeamUsersQuery(teamId, {
            skip: !teamId || !canViewMembers
        });
        
        // Parse team users - extract userIds from response
        const teamUsers = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
        const teamMembersArray = Array.isArray(teamUsers) ? teamUsers : [];
        
        // Extract userIds from the response (API returns { userId, user, teamId })
        const memberUserIds = teamMembersArray
            .map(item => item?.userId || item?.id || item?.user?.id)
            .filter(Boolean);
        
        // Check if teamLeadId is a valid (non-empty) GUID
        const isValidGuid = (guid) => {
            if (!guid) return false;
            const emptyGuidPattern = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i;
            return !emptyGuidPattern.test(String(guid));
        };
        
        const hasValidTeamLeader = isValidGuid(teamLeadId);
        
        // Count: team leader (if valid and not in members) + team members
        const teamLeaderInMembers = hasValidTeamLeader && memberUserIds.some(userId => {
            return String(userId) === String(teamLeadId);
        });
        
        const memberCount = teamLeaderInMembers 
            ? memberUserIds.length 
            : (hasValidTeamLeader ? 1 : 0) + memberUserIds.length;
        
        if (isLoadingMembers) {
            return <span className="text-sm font-medium text-[var(--sub-text-color)]">...</span>;
        }
        
        return (
            <span className="text-sm font-medium text-[var(--sub-text-color)]">
                {memberCount} {t("allDepartments.departmentCard.members", "Members")}
            </span>
        );
    }

    const handleEditDepartment = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(false);
        navigate(`/pages/admin/edit-department/${department.id}`);
    };

    const openDeleteModal = (departmentData) => {
        setDepartmentToDelete({
            id: departmentData.id,
            name: departmentData.name || t("allDepartments.departmentCard.untitled", "This department"),
        });
        setDeleteError("");
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDepartmentToDelete(null);
        setDeleteError("");
    };

    const handleDeleteDepartment = (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        openDeleteModal(department);
    };

    const confirmDeleteDepartment = async () => {
        if (!departmentToDelete?.id) return;
        setDeleteError("");

        try {
            await deleteDepartment(departmentToDelete.id).unwrap();

            setTimeout(() => {
                if (onDelete) {
                    onDelete(departmentToDelete.id);
                }
            }, 300);

            closeDeleteModal();
        } catch (error) {
            const statusCode = error?.status ||
                error?.originalStatus ||
                error?.error?.status ||
                error?.data?.statusCode ||
                (error?.data && typeof error.data === 'object' && 'statusCode' in error.data ? error.data.statusCode : null);

            if (statusCode === 409) {
                const errorMessage = (error?.data?.errorMessage || "").toLowerCase();

                if (errorMessage.includes('already deleted')) {
                    if (onDelete) {
                        onDelete(departmentToDelete.id);
                    }
                    closeDeleteModal();
                    return;
                }

                const conflictMessage =
                    error?.data?.errorMessage ||
                    (error?.data?.errors && typeof error.data.errors === 'object'
                        ? Object.values(error.data.errors).flat().join(', ')
                        : null) ||
                    error?.data?.message ||
                    t("allDepartments.departmentCard.deleteHasDependencies", "This department cannot be deleted because it has related teams, employees, or other dependencies. Please remove them first.");

                setDeleteError(conflictMessage);
            } else {
                const errorMsg =
                    error?.data?.errorMessage ||
                    (error?.data?.errors && typeof error.data.errors === 'object'
                        ? Object.values(error.data.errors).flat().join(', ')
                        : null) ||
                    error?.data?.message ||
                    error?.message ||
                    t("allDepartments.departmentCard.deleteFailed", "Failed to delete department. Please try again.");

                setDeleteError(errorMsg);
            }
        }
    };

    const handleRestoreDepartment = async (e) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        
        try {
            await restoreDepartment(department.id).unwrap();
            
            // Notify parent component to refetch if callback provided
            if (onDelete) {
                onDelete(department.id);
            }
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.message || 'Failed to restore department. Please try again.';
            alert(errorMessage);
        }
    };

    const handleMenuToggle = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(!isMenuOpen);
    };

    const handleCardClick = () => {
        // Only navigate to teams page if user has Team.View permission
        if (canViewTeams) {
            navigate(`/pages/admin/all-teams?departmentId=${department.id}`);
        }
    };

    return (
        <>
        <div
            className={`bg-[var(--bg-color)] rounded-xl p-6 border border-[var(--border-color)] transition-all duration-300 relative ${
                canViewTeams ? 'hover:shadow-lg cursor-pointer' : 'cursor-default'
            }`}
            dir={isArabic ? "rtl" : "ltr"}
            onClick={canViewTeams ? handleCardClick : undefined}
        >
            {/* Department Header */}
            <div className={`flex items-start justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                        <h3 className="text-lg font-semibold text-[var(--text-color)]">
                            {department.name}
                        </h3>
                        {/* Supervisor - Only show if user has permission to view supervisor */}
                        {canViewSupervisor && (
                            <div className="mt-1 text-xs text-[var(--sub-text-color)]">
                                <span className="mr-1">Supervisor:</span>
                                {isSupervisorLoading ? (
                                    <span>Loading...</span>
                                ) : supervisor ? (
                                    <span className="text-[var(--text-color)] font-medium">
                                        {`${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.email || '-'}
                                        {supervisor.jobTitle && <span className="text-[var(--sub-text-color)] ml-1">({supervisor.jobTitle})</span>}
                                    </span>
                                ) : (
                                    <span className="text-[var(--sub-text-color)]">None</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Avatars and Three Dot Menu */}
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {/* Member Avatars - Only show if user has Team.ViewMembers permission */}
                    {canViewMembers && (
                        <div className={`flex items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                            {department.memberAvatars?.slice(0, 3).map((avatar, index) => (
                                <img
                                    key={index}
                                    src={avatar}
                                    alt={`Member ${index + 1}`}
                                    className="w-8 h-8 rounded-full border-2 border-[var(--bg-color)]"
                                    style={{ marginLeft: isArabic ? '0' : index > 0 ? '-8px' : '0', marginRight: isArabic ? index > 0 ? '-8px' : '0' : '0' }}
                                />
                            ))}
                            {department.totalMembers > 3 && (
                                <div className="w-8 h-8 rounded-full bg-[var(--container-color)] border-2 border-[var(--bg-color)] flex items-center justify-center text-xs font-medium text-[var(--sub-text-color)]"
                                    style={{ marginLeft: isArabic ? '0' : '-8px', marginRight: isArabic ? '-8px' : '0' }}>
                                    +{department.totalMembers - 3}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Status Indicator */}
                    <div className={`relative ${isArabic ? 'left-1' : 'right-1'}`}>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isInactive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <div className={`w-2 h-2 rounded-full ${isInactive ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className={`text-xs font-medium ${isInactive ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                {isInactive ? 'Inactive' : 'Active'}
                            </span>
                        </div>
                    </div>
                    {/* Three Dot Menu - Only show if user has any action permissions */}
                    {(canUpdate || canDelete || canRestore) && (
                        <div className="relative">
                            <button
                                onClick={handleMenuToggle}
                                className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                            >
                                <MoreVertical className="text-[var(--sub-text-color)]" size={16} />
                            </button>

                            {isMenuOpen && (
                                <div className={`absolute top-full mt-1 w-32 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 ${isArabic ? 'right-0' : 'left-0'}`}>
                                    {canUpdate && (
                                        <button
                                            onClick={handleEditDepartment}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2 text-[var(--text-color)]"
                                        >
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    {!isInactive && canDelete && (
                                        <button
                                            onClick={handleDeleteDepartment}
                                            disabled={isDeleting}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2 text-red-500 disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                                        </button>
                                    )}
                                    {isInactive && canRestore && (
                                        <button
                                            onClick={handleRestoreDepartment}
                                            disabled={isRestoring}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2 text-[var(--text-color)] disabled:opacity-50"
                                        >
                                            <RotateCcw size={14} />
                                            <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Teams Section - Only show if user has Team.View permission */}
            {canViewTeams && (
                <>
                    <hr className="border-[var(--border-color)] my-4" />
                    {/* Teams Count */}
                    <div className={`flex items-center mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm text-[var(--sub-text-color)]">
                            {isLoadingTeams ? (
                                <span>Loading teams...</span>
                            ) : (
                                <>
                                    {teams.length} {t("allDepartments.departmentCard.teams", "Teams")}
                                </>
                            )}
                        </span>
                    </div>

                    {/* Teams List */}
                    {isLoadingTeams ? (
                        <div className="space-y-3">
                            <div className="text-xs text-[var(--sub-text-color)] p-3 text-center">Loading teams...</div>
                        </div>
                    ) : teams.length > 0 ? (
                        <div className="space-y-3">
                            {teams.slice(0, 4).map((team) => (
                                <div
                                    key={team.id}
                                    className={`flex items-center justify-between p-3 bg-[var(--bg-color)] rounded-lg hover:bg-[var(--hover-color)] transition-colors cursor-pointer ${isArabic ? 'flex-row-reverse' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (canViewTeams) {
                                            navigate(`/pages/admin/all-teams?departmentId=${department.id}`);
                                        }
                                    }}
                                >
                                    <div className={`flex items-center gap-3 flex-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-10 h-10 bg-[var(--menu-active-bg)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <img src={GroupDepartmentIcon} alt="Team" className="w-7 h-7" />
                                        </div>
                                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <p className="text-sm font-medium text-[var(--text-color)]">
                                                {team.name}
                                            </p>
                                            {team.teamLeader && (
                                                <p className="text-xs text-[var(--sub-text-color)] mt-0.5">
                                                    {t("allDepartments.departmentCard.leadBy", "Lead by")} <span className="text-[var(--text-color)] font-medium">{team.teamLeader}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        {canViewMembers && <TeamMemberCount team={team} />}
                                        <ChevronRight size={14} className={`text-[var(--sub-text-color)] flex-shrink-0 ${isArabic ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="text-xs text-[var(--sub-text-color)] p-3 text-center">No teams yet</div>
                        </div>
                    )}
                </>
            )}

        </div>

        {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div
                    className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] p-6 max-w-md w-full shadow-2xl"
                    style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    role="dialog"
                    aria-modal="true"
                >
                    <h3 className={`text-lg font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t("allDepartments.departmentCard.deleteTitle", "Delete Department")}
                    </h3>
                    <p className={`text-sm text-[var(--sub-text-color)] mb-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t("allDepartments.departmentCard.deleteMessage", {
                            defaultValue: 'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                            name: departmentToDelete?.name || t("allDepartments.departmentCard.untitled", "this department"),
                        })}
                    </p>
                    {deleteError && (
                        <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--rejected-leave-box-bg)', color: 'var(--error-color)' }}>
                            {deleteError}
                        </div>
                    )}
                    <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={closeDeleteModal}
                            className="flex-1 px-4 py-2 border rounded-lg font-medium transition-all"
                            style={{
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)',
                                backgroundColor: 'var(--bg-color)',
                            }}
                            disabled={isDeleting}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                        <button
                            onClick={confirmDeleteDepartment}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)' }}
                        >
                            {isDeleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>{t("allDepartments.departmentCard.deleteAction", "Delete")}</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
