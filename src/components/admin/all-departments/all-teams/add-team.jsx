import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, Plus, Check, Users, Search } from "lucide-react";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../../services/apis/RoleApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation } from "../../../../services/apis/TeamApi";

export default function AddTeamModal({ isOpen, onClose, onAddTeam, departmentId }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [newTeam, setNewTeam] = useState({ 
        name: '', 
        description: '', 
        selectedEmployees: [],
        teamLeader: null
    });
    const [isLeaderRoleOpen, setIsLeaderRoleOpen] = useState(false);
    const [isLeaderUserOpen, setIsLeaderUserOpen] = useState(false);
    const [leaderRole, setLeaderRole] = useState(null);
    const [membersRole, setMembersRole] = useState(null);
    const [isMembersRoleOpen, setIsMembersRoleOpen] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [membersSearchTerm, setMembersSearchTerm] = useState("");

    // Roles and users for leader selection
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50 });
    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []));
    const { data: leaderUsersData } = useGetRoleUsersQuery(
        leaderRole ? { id: leaderRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !leaderRole }
    );
    const leaderUsers = Array.isArray(leaderUsersData?.value) ? leaderUsersData.value : (Array.isArray(leaderUsersData?.data) ? leaderUsersData.data : (Array.isArray(leaderUsersData) ? leaderUsersData : []));

    // Members selection via a (possibly) different role
    const { data: membersUsersData } = useGetRoleUsersQuery(
        membersRole ? { id: membersRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !membersRole }
    );
    const memberUsers = Array.isArray(membersUsersData?.value) ? membersUsersData.value : (Array.isArray(membersUsersData?.data) ? membersUsersData.data : (Array.isArray(membersUsersData) ? membersUsersData : []));

    // Filter leader users based on search term
    const filteredLeaderUsers = useMemo(() => {
        if (!leaderSearchTerm.trim()) return leaderUsers || [];
        const search = leaderSearchTerm.toLowerCase();
        return (leaderUsers || []).filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [leaderUsers, leaderSearchTerm]);

    // Filter member users based on search term
    const filteredMemberUsers = useMemo(() => {
        if (!membersSearchTerm.trim()) return memberUsers || [];
        const search = membersSearchTerm.toLowerCase();
        return (memberUsers || []).filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [memberUsers, membersSearchTerm]);

    const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
    const [addUsersToTeam, { isLoading: isAddingUsers }] = useAddUsersToTeamMutation();

    const toggleEmployee = (employee) => {
        // Get employee ID (try multiple property names) - same as step 3 in adding department
        const employeeId = employee?.id || employee?.userId || employee?.userID || employee?.UserId || employee?.Id || employee?._id;
        
        if (!employeeId) {
            return;
        }
        
        setNewTeam(prev => {
            // Check if this employee is already selected by comparing IDs strictly
            const isAlreadySelected = prev.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
                // Use strict comparison with string conversion to handle different types
                return String(empId) === String(employeeId) && empId != null && employeeId != null;
            });
            
            if (isAlreadySelected) {
                // Remove this employee from selection
                return {
                    ...prev,
                    selectedEmployees: prev.selectedEmployees.filter(emp => {
                        const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
                        return String(empId) !== String(employeeId) || empId == null || employeeId == null;
                    })
                };
            } else {
                // Add this employee to selection
                return {
                    ...prev,
                    selectedEmployees: [...prev.selectedEmployees, employee]
                };
            }
        });
    };

    const selectTeamLeader = (leader) => {
        setNewTeam(prev => ({ ...prev, teamLeader: leader }));
        setIsLeaderUserOpen(false);
    };

    const handleAddTeam = async () => {
        // Extract team leader ID (try multiple property names) - same as step 3 in adding department
        const teamLeadId = newTeam.teamLeader?.id || 
                          newTeam.teamLeader?.userId || 
                          newTeam.teamLeader?.userID || 
                          newTeam.teamLeader?.UserId ||
                          newTeam.teamLeader?._id;
        
        if (!newTeam.name.trim() || !departmentId || !teamLeadId) {
            if (!newTeam.name.trim()) alert('Please enter a team name');
            else if (!departmentId) alert('Department ID is missing');
            else if (!teamLeadId) alert('Please select a team leader');
            return;
        }
        
        try {
            // Step 1: Create the team - same as step 3 in adding department
            const payload = {
                name: newTeam.name,
                description: newTeam.description || '',
                teamLeadId,
                departmentId,
            };
            
            const teamResult = await createTeam(payload).unwrap();
            const createdTeam = teamResult?.value || teamResult;
            const createdTeamId = createdTeam?.id;
            
            if (!createdTeamId) {
                throw new Error('Team was created but no team ID was returned');
            }

            // Step 2: Add team members using /api/v1/Team/AddUsersToTeam/{teamId}/users (plural - accepts array)
            // Same as step 3 in adding department
            if (createdTeamId && Array.isArray(newTeam.selectedEmployees) && newTeam.selectedEmployees.length > 0) {
                // Extract all userIds from selected employees - same as step 3
                const userIds = newTeam.selectedEmployees.map(member => {
                    const memberId = member?.id || 
                                    member?.userId || 
                                    member?.userID || 
                                    member?.UserId ||
                                    member?.Id ||
                                    member?._id;
                    return memberId;
                }).filter(Boolean); // Remove any null/undefined values
                
                if (userIds.length === 0) {
                    alert(`Warning: Team "${newTeam.name}" was created but no valid user IDs found in selected members.`);
                } else {
                    try {
                        await addUsersToTeam({ 
                            teamId: createdTeamId, 
                            userIds,
                            departmentId: departmentId
                        }).unwrap();
                    } catch (addUsersError) {
                        // Log detailed error but don't fail the whole operation - team was created successfully
                        const errorMsg = addUsersError?.data?.errorMessage || 
                                       addUsersError?.data?.message || 
                                       addUsersError?.message || 
                                       'Unknown error';
                        alert(`Team "${newTeam.name}" created successfully, but failed to add members: ${errorMsg}`);
                    }
                }
            }

            // Step 3: Callback to trigger refetch and update UI
            onAddTeam({
                id: createdTeam.id,
                name: createdTeam.name,
                description: createdTeam.description || '',
                departmentId: createdTeam.departmentId,
                teamLeadId: createdTeam.teamLeadId,
                teamLeader: createdTeam.teamLeader || newTeam.teamLeader,
                teamMembers: createdTeam.teamMembers || newTeam.selectedEmployees.length,
                selectedEmployees: newTeam.selectedEmployees,
            });
            
            console.log('✅ Team creation process completed successfully');
            
            // Reset form
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setLeaderRole(null);
            setMembersRole(null);
            setIsLeaderRoleOpen(false);
            setIsLeaderUserOpen(false);
            setIsMembersRoleOpen(false);
            setIsMembersOpen(false);
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
            onClose();
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.message || 'Failed to create team. Please try again.';
            alert(errorMessage);
        }
    };

    const handleCancel = () => {
        // Reset form
        setNewTeam({ 
            name: '', 
            description: '', 
            selectedEmployees: [],
            teamLeader: null
        });
        setLeaderRole(null);
        setMembersRole(null);
        setIsLeaderRoleOpen(false);
        setIsLeaderUserOpen(false);
        setIsMembersRoleOpen(false);
        setIsMembersOpen(false);
        setLeaderSearchTerm("");
        setMembersSearchTerm("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div 
                className="bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-bold text-[var(--text-color)]">
                        {t("departments.newDepartmentForm.setupTeams.addNewTeam")}
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                    >
                        <X className="text-[var(--sub-text-color)]" size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] space-y-4 m-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="form-input"
                            placeholder={t("departments.newDepartmentForm.setupTeams.teamName")}
                            type="text"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                        />
                        
                        {/* Team Leader: Role then User */}
                        <div className="space-y-2">
                            <div className="relative">
                                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsLeaderRoleOpen(!isLeaderRoleOpen)}>
                                    <span className="text-[var(--sub-text-color)]">{leaderRole ? leaderRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isLeaderRoleOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isLeaderRoleOpen && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {(roles || []).map(role => (
                                            <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { setLeaderRole(role); setIsLeaderRoleOpen(false); setIsLeaderUserOpen(true); }}>
                                                <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                                            </div>
                                        ))}
                                        {(!roles || roles.length === 0) && <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => leaderRole && setIsLeaderUserOpen(!isLeaderUserOpen)}>
                                    <span className="text-[var(--sub-text-color)]">{newTeam.teamLeader ? (newTeam.teamLeader.name || `${newTeam.teamLeader.firstName || ''} ${newTeam.teamLeader.lastName || ''}`.trim()) : t("departments.newDepartmentForm.assignSupervisor.chooseSupervisor")}</span>
                                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isLeaderUserOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isLeaderUserOpen && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                                        {/* Search Input */}
                                        <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                                <input
                                                    type="text"
                                                    value={leaderSearchTerm}
                                                    onChange={(e) => setLeaderSearchTerm(e.target.value)}
                                                    placeholder={t("departments.newDepartmentForm.assignSupervisor.searchUsers") || "Search users..."}
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                                    onClick={(e) => e.stopPropagation()}
                                                    dir={isArabic ? 'rtl' : 'ltr'}
                                                />
                                            </div>
                                        </div>
                                        {/* Users List */}
                                        <div className="overflow-y-auto max-h-[240px]">
                                            {leaderRole && filteredLeaderUsers.length > 0 ? (
                                                filteredLeaderUsers.map(u => (
                                                    <div key={u.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => {
                                                        selectTeamLeader(u);
                                                        setLeaderSearchTerm("");
                                                    }}>
                                                        <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                                        <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-[var(--sub-text-color)]">
                                                    {leaderRole ? (leaderSearchTerm ? "No users found matching your search" : "No users found") : "Select a role first"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Team Members multi-select (choose role then users) */}
                    <div className="space-y-2">
                        <div className="relative">
                            <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsMembersRoleOpen(!isMembersRoleOpen)}>
                                <span className="text-[var(--sub-text-color)]">{membersRole ? membersRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersRoleOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>
                            {isMembersRoleOpen && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {(roles || []).map(role => (
                                        <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { setMembersRole(role); setIsMembersRoleOpen(false); setIsMembersOpen(true); }}>
                                            <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                                        </div>
                                    ))}
                                    {(!roles || roles.length === 0) && <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => membersRole && setIsMembersOpen(!isMembersOpen)}>
                                <span className="text-[var(--sub-text-color)]">
                                    {newTeam.selectedEmployees.length > 0 ? `${newTeam.selectedEmployees.length} selected` : t("departments.newDepartmentForm.setupTeams.chooseEmployee")}
                                </span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>
                            {isMembersOpen && (
                                <div 
                                    className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                            <input
                                                type="text"
                                                value={membersSearchTerm}
                                                onChange={(e) => setMembersSearchTerm(e.target.value)}
                                                placeholder={t("departments.newDepartmentForm.assignSupervisor.searchUsers") || "Search users..."}
                                                className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                                onClick={(e) => e.stopPropagation()}
                                                dir={isArabic ? 'rtl' : 'ltr'}
                                            />
                                        </div>
                                    </div>
                                    {/* Users List */}
                                    <div className="overflow-y-auto max-h-[240px]">
                                        {membersRole && filteredMemberUsers.length > 0 ? (
                                            filteredMemberUsers.map(u => {
                                                // Get user ID for comparison - same as step 3 in adding department
                                                const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id;
                                                const isSelected = userId && newTeam.selectedEmployees.some(emp => {
                                                    const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
                                                    // Use strict comparison with string conversion to handle different types
                                                    return String(empId) === String(userId) && empId != null && userId != null;
                                                });
                                                
                                                return (
                                                    <div 
                                                        key={`user-${userId || u.id || u.email || Math.random()}`} 
                                                        className={`p-3 cursor-pointer flex items-center justify-between ${
                                                            isSelected ? 'bg-[var(--accent-color)] bg-opacity-10' : 'hover:bg-[var(--hover-color)]'
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleEmployee(u);
                                                        }}
                                                    >
                                                        <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                            isSelected 
                                                                ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' 
                                                                : 'border-[var(--border-color)]'
                                                        }`}>
                                                            {isSelected && <Check className="text-white" size={12} />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-[var(--sub-text-color)]">
                                                {membersRole ? (membersSearchTerm ? "No users found matching your search" : "No users found") : "Select a role first"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Team Description - Full Width */}
                    <textarea
                        className="form-input w-full"
                        placeholder={t("departments.newDepartmentForm.setupTeams.description")}
                        rows="3"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    />
                    
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn-primary flex items-center gap-2"
                            onClick={handleAddTeam}
                            disabled={!newTeam.name.trim() || !departmentId || !newTeam.teamLeader || isCreating || isAddingUsers}
                        >
                            {(isCreating || isAddingUsers) ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{isCreating ? 'Creating team...' : 'Adding members...'}</span>
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    {t("departments.newDepartmentForm.buttons.add")}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
