import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, ArrowLeft } from "lucide-react";
import EnrichedTeamCard from "./enriched-team-card";
import TeamsStatusCards from "./status-cards";
import AddTeamModal from "./add-team";
import EditTeamModal from "./edit-team";
import { useGetTeamsByDepartmentQuery, useDeleteTeamMutation } from "../../../../services/apis/TeamApi";
import { useTeamDetails } from "./useTeamDetails";
import { useHasPermission } from "../../../../hooks/useHasPermission";

export default function AllTeams() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const departmentId = params.get('departmentId');
    
    // Permission checks for Team actions
    const canCreateTeam = useHasPermission('Team.Create');
    const canUpdateTeam = useHasPermission('Team.Update');
    const canDeleteTeam = useHasPermission('Team.Delete');
    const canRestoreTeam = useHasPermission('Team.Restore');
    const canViewMembers = useHasPermission('Team.ViewMembers');
    const canAddMember = useHasPermission('Team.AddMember');
    const canUpdateMember = useHasPermission('Team.UpdateMember');
    const canRemoveMember = useHasPermission('Team.RemoveMember');

    // Fetch teams from API
    const { data: teamsData, isLoading, isError, refetch } = useGetTeamsByDepartmentQuery(departmentId, {
        skip: !departmentId
    });
    
    // Delete team mutation
    const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

    // Parse teams from API response (basic structure - details will be enriched by TeamCard)
    const teams = useMemo(() => {
        const items = teamsData?.value || teamsData?.data || teamsData?.items || teamsData || [];
        return Array.isArray(items) ? items.map(team => {
            // Extract teamLeader from new API structure (teamLeader can be null)
            const teamLeader = team.teamLeader || team.teamLead || null;
            const teamLeaderName = teamLeader 
                ? `${teamLeader.firstName || ''} ${teamLeader.lastName || ''}`.trim() || teamLeader.userName || teamLeader.email || null
                : null;
            
            return {
                id: team.id,
                name: team.name,
                description: team.description || '',
                department: team.department?.name || team.departmentName || null,
                departmentId: team.departmentId || team.department?.id,
                teamLeadId: team.teamLeadId || team.teamLeader?.id || team.teamLead?.id || team.teamLead?.userId || null,
                teamLead: teamLeader, // Store full teamLeader object for compatibility
                teamLeader: teamLeader, // New API structure
                // Legacy fields for compatibility
                lead: teamLeaderName,
                leadAvatar: teamLeader?.avatar || null,
                leadRole: teamLeader?.jobTitle || teamLeader?.role || null,
            };
        }) : [];
    }, [teamsData]);

    const handleAddNewTeam = () => {
        setIsAddTeamModalOpen(true);
    };

    const handleAddTeam = (teamData) => {
        // Team is created via API, just refetch
        refetch();
    };

    const handleEditTeam = (team) => {
        setSelectedTeam(team);
        setIsEditTeamModalOpen(true);
    };

    const handleUpdateTeam = (updatedTeam) => {
        // Team is updated via API, just refetch
        refetch();
        setIsEditTeamModalOpen(false);
        setSelectedTeam(null);
    };

    const handleDeleteTeam = async (teamId) => {
        // Find the team to get its name and departmentId for confirmation
        const teamToDelete = teams.find(t => t.id === teamId);
        const teamName = teamToDelete?.name || 'this team';
        const teamDepartmentId = teamToDelete?.departmentId || departmentId;
        
        // Confirm deletion
        if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Call deleteTeam with both id and departmentId for cache invalidation
            await deleteTeam({ 
                id: teamId,
                departmentId: teamDepartmentId 
            }).unwrap();
            // Refetch teams to update the UI (RTK Query should handle this automatically via cache invalidation)
            refetch();
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.message || 'Failed to delete team. Please try again.';
            alert(errorMessage);
        }
    };

    const handleGoBack = () => {
        navigate('/pages/admin/all-departments');
    };

    // Filter teams based on search term
    const filteredTeams = teams.filter(team =>
        team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.lead?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header with Back Button */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
                <button 
                    onClick={handleGoBack}
                    className={`flex items-center gap-2 text-[var(--accent-color)] hover:text-[var(--accent-hover-color)] transition-colors ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                    <ArrowLeft size={20} className={`${isArabic ? 'rotate-180' : ''}`} />
                    <span className="font-medium text-sm sm:text-base">All Department</span>
                </button>
                <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                    <span className="text-sm text-[var(--sub-text-color)]">Teams</span>
                </div>
            </div>

            {/* Status Cards */}
            {/* <TeamsStatusCards /> */}

            {/* Search and Action Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search
                        className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 ${isArabic ? 'right-3' : 'left-3'}`}
                        style={{ color: 'var(--sub-text-color)' }}
                    />
                    <input
                        type="text"
                        placeholder={t("allTeams.search.placeholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                        style={{
                            borderColor: 'var(--border-color)',
                            backgroundColor: 'var(--bg-color)',
                            color: 'var(--text-color)',
                            paddingLeft: isArabic ? '16px' : '40px',
                            paddingRight: isArabic ? '40px' : '16px',
                            focusRingColor: 'var(--accent-color)',
                            textAlign: isArabic ? 'right' : 'left'
                        }}
                    />
                </div>

                {/* Action Buttons */}
                <div className={` ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {canCreateTeam && (
                        <button 
                            onClick={handleAddNewTeam}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">{t("allTeams.search.addNewTeam")}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mb-4" />
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">Loading...</h3>
                    </div>
                ) : isError ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mb-4">
                            <Search className="text-[var(--sub-text-color)]" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">Failed to load teams</h3>
                        <button onClick={() => refetch()} className="btn-secondary">Retry</button>
                    </div>
                ) : filteredTeams.length > 0 ? (
                    filteredTeams.map((team) => (
                        <EnrichedTeamCard 
                            key={team.id} 
                            team={team} 
                            onEdit={handleEditTeam}
                            onDelete={handleDeleteTeam}
                            canUpdate={canUpdateTeam}
                            canDelete={canDeleteTeam}
                            canRestore={canRestoreTeam}
                            canViewMembers={canViewMembers}
                            canAddMember={canAddMember}
                            canUpdateMember={canUpdateMember}
                            canRemoveMember={canRemoveMember}
                        />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mb-4">
                            <Search className="text-[var(--sub-text-color)]" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">
                            No teams found
                        </h3>
                        <p className="text-[var(--sub-text-color)] max-w-sm">
                            {searchTerm 
                                ? `No teams match "${searchTerm}". Try adjusting your search.`
                                : departmentId
                                ? "No teams available for this department at the moment."
                                : "Please select a department to view teams."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {searchTerm && filteredTeams.length > 0 && (
                <div className={`text-sm text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                    Showing {filteredTeams.length} of {teams.length} teams
                </div>
            )}

            {/* Add Team Modal */}
            <AddTeamModal 
                isOpen={isAddTeamModalOpen}
                onClose={() => setIsAddTeamModalOpen(false)}
                onAddTeam={handleAddTeam}
                departmentId={departmentId}
            />

            {/* Edit Team Modal */}
            <EditTeamModal
                isOpen={isEditTeamModalOpen}
                onClose={() => {
                    setIsEditTeamModalOpen(false);
                    setSelectedTeam(null);
                }}
                onUpdateTeam={handleUpdateTeam}
                teamData={selectedTeam}
                departmentId={departmentId}
            />
        </div>
    );
}
