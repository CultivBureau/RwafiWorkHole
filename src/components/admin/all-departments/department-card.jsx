import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Edit, Trash2, MoreVertical, RotateCcw } from "lucide-react";
import GroupDepartmentIcon from '/assets/groupDepartments.svg';
import { useGetDepartmentSupervisorQuery, useDeleteDepartmentMutation, useRestoreDepartmentMutation } from "../../../services/apis/DepartmentApi";
import { useGetTeamsByDepartmentQuery, useGetTeamUsersQuery } from "../../../services/apis/TeamApi";
import { useHasPermission } from "../../../hooks/useHasPermission";
import TeamDetailsPopup from "./all-teams/team-details/team-details-popup";

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
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isTeamPopupOpen, setIsTeamPopupOpen] = useState(false);
    
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
    const { data: teamsData, isLoading: isLoadingTeams, error: teamsError } = useGetTeamsByDepartmentQuery(department.id, {
        skip: !department?.id || !canViewTeams
    });
    
    // Handle 404 errors gracefully - 404 means no teams, which is a valid state
    const hasTeamsError = teamsError && teamsError?.status !== 404;
    
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
                teamLeader: teamLeaderName, // For display in card
                teamLeaderObject: teamLeader, // Full object for popup
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

    const handleTeamClick = (e, team) => {
        e.stopPropagation(); // Prevent card navigation
        // Prepare team object for popup with full teamLeader object
        const teamForPopup = {
            ...team,
            teamLeader: team.teamLeaderObject || team.teamLeader, // Use full object if available
            teamLead: team.teamLeaderObject || team.teamLeader, // Also set teamLead for popup compatibility
        };
        setSelectedTeam(teamForPopup);
        setIsTeamPopupOpen(true);
    };

    const handleCloseTeamPopup = () => {
        setIsTeamPopupOpen(false);
        setSelectedTeam(null);
    };

    return (
        <>
        <div
            className={`bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] transition-all duration-300 relative overflow-hidden group ${
                canViewTeams ? 'hover:shadow-xl hover:border-[var(--accent-color)]/30 cursor-pointer' : 'cursor-default'
            }`}
            dir={isArabic ? "rtl" : "ltr"}
            onClick={canViewTeams ? handleCardClick : undefined}
        >
            {/* Gradient Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-color)]/60"></div>
            
            <div className="p-6">
                {/* Department Header */}
                <div className={`flex items-start justify-between mb-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-start gap-4 flex-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Department Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-color)]/10 to-[var(--accent-color)]/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <img src={GroupDepartmentIcon} alt="Department" className="w-7 h-7 opacity-80" />
                        </div>
                        
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'} min-w-0`}>
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-1 truncate">
                                {department.name}
                            </h3>
                            
                            {/* Supervisor - Only show if user has permission to view supervisor */}
                            {canViewSupervisor && (
                                <div className="flex items-center gap-2 text-xs text-[var(--sub-text-color)] flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--container-color)] font-medium">
                                        {t("allDepartments.departmentCard.supervisor", "Supervisor")}
                                    </span>
                                    {isSupervisorLoading ? (
                                        <span className="text-[var(--sub-text-color)]">Loading...</span>
                                    ) : supervisor ? (
                                        <span className="text-[var(--text-color)] font-medium truncate">
                                            {`${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.email || '-'}
                                            {supervisor.jobTitle && (
                                                <span className="text-[var(--sub-text-color)] ml-1">• {supervisor.jobTitle}</span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--sub-text-color)] italic">No supervisor assigned</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions and Status */}
                    <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Status Badge */}
                        <div 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all duration-200`}
                            style={{
                                backgroundColor: isInactive ? 'var(--status-inactive-bg)' : 'var(--status-active-bg)',
                                borderColor: isInactive ? 'var(--status-inactive-border)' : 'var(--status-active-border)',
                            }}
                        >
                            <div 
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{
                                    backgroundColor: isInactive ? 'var(--status-inactive-text)' : 'var(--status-active-text)',
                                }}
                            ></div>
                            <span 
                                className="text-xs font-semibold"
                                style={{
                                    color: isInactive ? 'var(--status-inactive-text)' : 'var(--status-active-text)',
                                }}
                            >
                                {isInactive ? 'Inactive' : 'Active'}
                            </span>
                        </div>
                        
                        {/* Three Dot Menu - Only show if user has any action permissions */}
                        {(canUpdate || canDelete || canRestore) && (
                            <div className="relative">
                                <button
                                    onClick={handleMenuToggle}
                                    className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-all duration-200 hover:scale-110"
                                >
                                    <MoreVertical className="text-[var(--sub-text-color)]" size={18} />
                                </button>

                                {isMenuOpen && (
                                    <div className={`absolute top-full mt-2 w-40 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-xl z-10 overflow-hidden ${isArabic ? 'right-0' : 'left-0'}`}>
                                        {canUpdate && (
                                            <button
                                                onClick={handleEditDepartment}
                                                className="w-full px-4 py-3 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-3 text-[var(--text-color)] border-b border-[var(--border-color)]"
                                            >
                                                <Edit size={16} className="text-[var(--accent-color)]" />
                                                <span className="font-medium">Edit</span>
                                            </button>
                                        )}
                                        {!isInactive && canDelete && (
                                            <button
                                                onClick={handleDeleteDepartment}
                                                disabled={isDeleting}
                                                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400 disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                <span className="font-medium">{isDeleting ? 'Deleting...' : 'Delete'}</span>
                                            </button>
                                        )}
                                        {isInactive && canRestore && (
                                            <button
                                                onClick={handleRestoreDepartment}
                                                disabled={isRestoring}
                                                className="w-full px-4 py-3 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-3 text-[var(--text-color)] disabled:opacity-50"
                                            >
                                                <RotateCcw size={16} className="text-[var(--accent-color)]" />
                                                <span className="font-medium">{isRestoring ? 'Restoring...' : 'Restore'}</span>
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
                        {/* Divider */}
                        <div className="my-5 border-t border-[var(--border-color)]"></div>
                        
                        {/* Teams Header */}
                        <div className={`flex flex-col gap-2 mb-4 ${isArabic ? '' : ''}`}>
                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                                        <img src={GroupDepartmentIcon} alt="Teams" className="w-5 h-5 opacity-70" />
                                    </div>
                                    <span className="text-sm font-semibold text-[var(--text-color)]">
                                        {isLoadingTeams ? (
                                            <span>Loading teams...</span>
                                        ) : (
                                            <>
                                                {t("allDepartments.departmentCard.teams", "Teams")} ({teams.length})
                                            </>
                                        )}
                                    </span>
                                </div>
                                
                                {teams.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/pages/admin/all-teams?departmentId=${department.id}`);
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium text-[var(--accent-color)] bg-[var(--accent-color)]/10 rounded-lg hover:bg-[var(--accent-color)]/20 hover:scale-105 transition-all duration-200"
                                    >
                                        {t("allDepartments.departmentCard.viewAll", "View All")}
                                    </button>
                                )}
                            </div>
                            
                            {/* Hint Text */}
                            {teams.length > 0 && (
                                <p className="text-xs text-[var(--sub-text-color)] italic px-1">
                                    {t("allDepartments.departmentCard.clickTeamHint", "Click any team for quick view")}
                                </p>
                            )}
                        </div>

                        {/* Teams List */}
                        {isLoadingTeams ? (
                            <div className="space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-[var(--container-color)]/30 rounded-xl">
                                        <div className="w-10 h-10 bg-[var(--container-color)] rounded-lg"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-[var(--container-color)] rounded w-1/2"></div>
                                            <div className="h-2 bg-[var(--container-color)] rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : teams.length > 0 ? (
                            <div className="space-y-2">
                                {teams.slice(0, 3).map((team) => (
                                    <div
                                        key={team.id}
                                        className={`group/team flex items-center justify-between p-3 bg-[var(--container-color)]/30 rounded-xl hover:bg-[var(--accent-color)]/5 border border-transparent hover:border-[var(--accent-color)]/20 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${isArabic ? 'flex-row-reverse' : ''}`}
                                        onClick={(e) => handleTeamClick(e, team)}
                                        title={t("allDepartments.departmentCard.clickToView", "Click to view team details")}
                                    >
                                        <div className={`flex items-center gap-3 flex-1 min-w-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/team:scale-110 group-hover/team:rotate-3 transition-all duration-200">
                                                <img src={GroupDepartmentIcon} alt="Team" className="w-6 h-6 opacity-70 group-hover/team:opacity-100 transition-opacity duration-200" />
                                            </div>
                                            <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                <p className="text-sm font-semibold text-[var(--text-color)] truncate group-hover/team:text-[var(--accent-color)] transition-colors">
                                                    {team.name}
                                                </p>
                                                {team.teamLeader && (
                                                    <p className="text-xs text-[var(--sub-text-color)] mt-0.5 truncate">
                                                        <span className="opacity-70">{t("allDepartments.departmentCard.leadBy", "Lead by")}</span> 
                                                        <span className="text-[var(--text-color)] font-medium ml-1">{team.teamLeader}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-3 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            {canViewMembers && (
                                                <div className="px-2 py-1 rounded-md bg-[var(--bg-color)] group-hover/team:bg-[var(--accent-color)]/10 transition-all duration-200">
                                                    <TeamMemberCount team={team} />
                                                </div>
                                            )}
                                            <ChevronRight 
                                                size={16} 
                                                className={`text-[var(--sub-text-color)] group-hover/team:text-[var(--accent-color)] transition-all duration-200 ${isArabic ? 'rotate-180 group-hover/team:-translate-x-1' : 'group-hover/team:translate-x-1'}`} 
                                            />
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Show more indicator if there are more than 3 teams */}
                                {teams.length > 3 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/pages/admin/all-teams?departmentId=${department.id}`);
                                        }}
                                        className="w-full p-3 text-center text-sm font-medium text-[var(--accent-color)] hover:bg-[var(--accent-color)]/5 rounded-xl transition-all duration-200 border border-dashed border-[var(--accent-color)]/30 hover:border-[var(--accent-color)]/50 hover:scale-[1.02]"
                                    >
                                        +{teams.length - 3} more {t("allDepartments.departmentCard.teams", "teams")}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--container-color)]/30 flex items-center justify-center">
                                    <img src={GroupDepartmentIcon} alt="No Teams" className="w-8 h-8 opacity-30" />
                                </div>
                                <p className="text-sm text-[var(--sub-text-color)]">
                                    {t("allDepartments.departmentCard.noTeams", "No teams in this department yet")}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* Team Details Popup */}
        {isTeamPopupOpen && selectedTeam && (
            <TeamDetailsPopup
                isOpen={isTeamPopupOpen}
                onClose={handleCloseTeamPopup}
                team={selectedTeam}
            />
        )}

        {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div
                    className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] p-6 max-w-md w-full shadow-2xl animate-slideUp"
                    style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Icon Header */}
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Trash2 className="text-red-600 dark:text-red-400" size={28} />
                        </div>
                    </div>
                    
                    <h3 className={`text-xl font-bold text-[var(--text-color)] mb-3 text-center`}>
                        {t("allDepartments.departmentCard.deleteTitle", "Delete Department")}
                    </h3>
                    <p className={`text-sm text-[var(--sub-text-color)] mb-5 text-center leading-relaxed`}>
                        {t("allDepartments.departmentCard.deleteMessage", {
                            defaultValue: 'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                            name: departmentToDelete?.name || t("allDepartments.departmentCard.untitled", "this department"),
                        })}
                    </p>
                    
                    {deleteError && (
                        <div className="mb-5 px-4 py-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <span className="flex-1">{deleteError}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={closeDeleteModal}
                            className="flex-1 px-5 py-3 border-2 border-[var(--border-color)] rounded-xl font-semibold transition-all hover:bg-[var(--hover-color)] hover:border-[var(--accent-color)]/30"
                            style={{
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
                            className="flex-1 px-5 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)' }}
                        >
                            {isDeleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <Trash2 size={16} />
                            <span>{t("allDepartments.departmentCard.deleteAction", "Delete")}</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
