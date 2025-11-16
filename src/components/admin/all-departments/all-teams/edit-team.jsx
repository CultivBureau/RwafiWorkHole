import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, Check, Save, Search } from "lucide-react";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../../services/apis/RoleApi";
import { useUpdateTeamMutation, useUpdateUsersInTeamMutation, useGetTeamUsersQuery } from "../../../../services/apis/TeamApi";
export default function EditTeamModal({ isOpen, onClose, onUpdateTeam, teamData, departmentId }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [editTeam, setEditTeam] = useState({ 
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

    // Get departmentId from teamData if not provided
    const teamDepartmentId = departmentId || teamData?.departmentId;

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

    // Fetch existing team members - API returns user objects in the response
    const { data: teamUsersData, isLoading: isLoadingMembers } = useGetTeamUsersQuery(teamData?.id, {
        skip: !teamData?.id || !isOpen
    });
    const teamUsers = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
    // Extract user objects from teamUsers response (API returns { userId, user: {...} })
    // Use useMemo to prevent infinite re-renders
    const teamMembersArray = useMemo(() => {
        if (!Array.isArray(teamUsers)) return [];
        return teamUsers.map(item => item?.user || { id: item?.userId || item?.id }).filter(Boolean);
    }, [teamUsers]);

    const [updateTeam, { isLoading: isUpdating }] = useUpdateTeamMutation();
    const [updateUsersInTeam, { isLoading: isUpdatingUsers }] = useUpdateUsersInTeamMutation();

    // Pre-populate form when teamData changes
    useEffect(() => {
        if (teamData && isOpen) {
            // Set team leader if available - try multiple property names
            const teamLeader = teamData.teamLeader || teamData.teamLead || teamData.teamLeadUser || null;
            
            // Set form data
            setEditTeam({
                name: teamData.name || '',
                description: teamData.description || '',
                selectedEmployees: [], // Will be set in separate effect
                teamLeader: teamLeader || null
            });

            // Reset dropdown states when modal opens
            setIsLeaderRoleOpen(false);
            setIsLeaderUserOpen(false);
            setIsMembersRoleOpen(false);
            setIsMembersOpen(false);
            setLeaderRole(null);
            setMembersRole(null);
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
        } else {
            // Reset form when modal closes
            setEditTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setLeaderRole(null);
            setMembersRole(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamData?.id, isOpen]); // Only depend on teamData.id and isOpen

    // Update selectedEmployees when teamMembersArray changes (separate effect to prevent infinite loop)
    useEffect(() => {
        if (teamData && isOpen && teamMembersArray.length >= 0) {
            setEditTeam(prev => {
                // Only update if team name matches (to avoid updating when editing)
                if (prev.name === (teamData?.name || '')) {
                    const currentIds = prev.selectedEmployees.map(e => e?.id || e?.userId || e?.userID).filter(Boolean).sort();
                    const newIds = teamMembersArray.map(e => e?.id || e?.userId || e?.userID).filter(Boolean).sort();
                    
                    // Check if they're different
                    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
                        return {
                            ...prev,
                            selectedEmployees: teamMembersArray
                        };
                    }
                }
                return prev;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamMembersArray, teamData?.id, isOpen]);

    const toggleEmployee = (employee) => {
        // Get employee ID (try multiple property names) - same as add team
        const employeeId = employee?.id || employee?.userId || employee?.userID || employee?.UserId || employee?.Id || employee?._id;
        
        if (!employeeId) {
            return;
        }
        
        setEditTeam(prev => {
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
        setEditTeam(prev => ({ ...prev, teamLeader: leader }));
        setIsLeaderUserOpen(false);
    };

    const handleUpdateTeam = async () => {
        // Extract team leader ID (try multiple property names) - same as step 3 in adding department
        const teamLeadId = editTeam.teamLeader?.id || 
                          editTeam.teamLeader?.userId || 
                          editTeam.teamLeader?.userID || 
                          editTeam.teamLeader?.UserId ||
                          editTeam.teamLeader?._id;
        
        if (!editTeam.name.trim()) {
            alert(t("allTeams.editTeam.errors.enterTeamName"));
            return;
        }
        
        if (!teamLeadId) {
            alert(t("allTeams.editTeam.errors.selectTeamLeader"));
            return;
        }
        
        if (!teamData?.id) {
            alert(t("allTeams.editTeam.errors.teamIdMissing"));
            return;
        }
        
        if (!teamDepartmentId) {
            alert(t("allTeams.editTeam.errors.departmentIdMissing"));
            return;
        }
        
        try {
            // Step 1: Update the team details
            const updatePayload = {
                id: teamData.id,
                name: editTeam.name,
                description: editTeam.description || '',
                teamLeadId,
                departmentId: teamDepartmentId,
            };
            
            await updateTeam(updatePayload).unwrap();

            // Step 2: Update team members using UpdateUsersInTeam (replaces all members)
            const userIds = editTeam.selectedEmployees.map(member => {
                const memberId = member?.id || 
                                member?.userId || 
                                member?.userID || 
                                member?.UserId ||
                                member?.Id ||
                                member?._id;
                return memberId;
            }).filter(Boolean);
            
            await updateUsersInTeam({
                teamId: teamData.id,
                userIds,
                departmentId: teamDepartmentId
            }).unwrap();

            // Step 3: Callback to trigger refetch and update UI
            onUpdateTeam({
                id: teamData.id,
                name: editTeam.name,
                description: editTeam.description || '',
                departmentId: teamDepartmentId,
                teamLeadId,
                teamLeader: editTeam.teamLeader,
                teamMembers: editTeam.selectedEmployees.length,
                selectedEmployees: editTeam.selectedEmployees,
            });
            
            console.log('✅ Team update process completed successfully');
            
            // Reset form
            setEditTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
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
            const errorMessage = error?.data?.errorMessage || error?.message || t("allTeams.editTeam.errors.updateFailed");
            alert(errorMessage);
        }
    };

    const handleCancel = () => {
        // Reset form to original data
        if (teamData) {
            const teamLeader = teamData.teamLeader || teamData.teamLead || null;
            setEditTeam({
                name: teamData.name || '',
                description: teamData.description || '',
                selectedEmployees: teamMembersArray || [],
                teamLeader: teamLeader
            });
        }
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
                        {t("allTeams.editTeam.title")}
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
                    {isLoadingMembers ? (
                        <div className="text-center py-8">
                            <div className="text-[var(--sub-text-color)]">{t("allTeams.editTeam.loadingTeamData")}</div>
                        </div>
                    ) : (
                        <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="form-input"
                            placeholder={t("departments.newDepartmentForm.setupTeams.teamName")}
                            type="text"
                            value={editTeam.name}
                            onChange={(e) => setEditTeam(prev => ({ ...prev, name: e.target.value }))}
                        />
                        
                                {/* Team Leader: Role then User */}
                                <div className="space-y-2">
                        <div className="relative">
                                        <div className="form-input cursor-pointer flex items-center justify-between" onClick={(e) => {
                                            e.stopPropagation();
                                            setIsLeaderRoleOpen(!isLeaderRoleOpen);
                                        }}>
                                            <span className="text-[var(--sub-text-color)]">{leaderRole ? leaderRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                            <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isLeaderRoleOpen ? 'rotate-180' : ''}`} size={16} />
                                        </div>
                                        {isLeaderRoleOpen && (
                                            <div 
                                                className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {(roles || []).map(role => (
                                                    <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={(e) => { 
                                                        e.stopPropagation();
                                                        setLeaderRole(role); 
                                                        setIsLeaderRoleOpen(false); 
                                                        setIsLeaderUserOpen(true); 
                                                    }}>
                                                        <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                                                    </div>
                                                ))}
                                                {(!roles || roles.length === 0) && <div className="p-3 text-[var(--sub-text-color)]">{t("allTeams.editTeam.noRolesFound")}</div>}
                                            </div>
                                        )}
                                            </div>
                                    <div className="relative">
                                        <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => {
                                            if (leaderRole) {
                                                setIsLeaderUserOpen(!isLeaderUserOpen);
                                            } else {
                                                setIsLeaderRoleOpen(true);
                                            }
                                        }}>
                                            <span className="text-[var(--sub-text-color)]">
                                                {editTeam.teamLeader 
                                                    ? (editTeam.teamLeader.name || `${editTeam.teamLeader.firstName || ''} ${editTeam.teamLeader.lastName || ''}`.trim() || editTeam.teamLeader.email || editTeam.teamLeader.userName)
                                                    : t("departments.newDepartmentForm.assignSupervisor.chooseSupervisor")
                                                }
                                            </span>
                                            <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isLeaderUserOpen ? 'rotate-180' : ''}`} size={16} />
                                        </div>
                                        {isLeaderUserOpen && leaderRole && (
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
                                                    {filteredLeaderUsers.length > 0 ? (
                                                        filteredLeaderUsers.map(u => (
                                                            <div key={u.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={(e) => {
                                                                e.stopPropagation();
                                                                selectTeamLeader(u);
                                                                setLeaderSearchTerm("");
                                                            }}>
                                                                <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                                                <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-[var(--sub-text-color)]">
                                                            {leaderSearchTerm ? "No users found matching your search" : t("allTeams.editTeam.noUsersFound")}
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
                                    <div className="form-input cursor-pointer flex items-center justify-between" onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMembersRoleOpen(!isMembersRoleOpen);
                                    }}>
                                        <span className="text-[var(--sub-text-color)]">{membersRole ? membersRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                        <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersRoleOpen ? 'rotate-180' : ''}`} size={16} />
                                    </div>
                                    {isMembersRoleOpen && (
                                        <div 
                                            className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {(roles || []).map(role => (
                                                <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={(e) => { 
                                                    e.stopPropagation();
                                                    setMembersRole(role); 
                                                    setIsMembersRoleOpen(false); 
                                                    setIsMembersOpen(true); 
                                                }}>
                                                    <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                                                </div>
                                            ))}
                                            {(!roles || roles.length === 0) && <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>}
                                        </div>
                                    )}
                                </div>
                    <div className="relative">
                                    <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => {
                                        if (membersRole) {
                                            setIsMembersOpen(!isMembersOpen);
                                        } else {
                                            setIsMembersRoleOpen(true);
                                        }
                                    }}>
                            <span className="text-[var(--sub-text-color)]">
                                            {editTeam.selectedEmployees.length > 0 ? `${editTeam.selectedEmployees.length} ${t("allTeams.editTeam.selected")}` : t("departments.newDepartmentForm.setupTeams.chooseEmployee")}
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
                                                        // Get user ID for comparison - same as add team
                                                        const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id;
                                                        const isSelected = userId && editTeam.selectedEmployees.some(emp => {
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
                                                        {membersRole ? (membersSearchTerm ? "No users found matching your search" : t("allTeams.editTeam.noUsersFound")) : "Select a role first"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                        </div>
                            </div>
                            
                            {/* Display selected members */}
                            {editTeam.selectedEmployees && editTeam.selectedEmployees.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-[var(--text-color)]">
                                        {t("allTeams.editTeam.selectedMembers")} ({editTeam.selectedEmployees.length}):
                                    </div>
                                    <div className="flex flex-wrap gap-2 p-3 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                                        {editTeam.selectedEmployees.map((emp, idx) => {
                                            const empId = emp.id || emp.userId || emp.userID || emp.Id || `emp-${idx}`;
                                            return (
                                                <div 
                                                    key={empId} 
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] text-sm hover:border-[var(--accent-color)] transition-colors"
                                                >
                                                    <span className="text-[var(--text-color)] font-medium">
                                                        {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                                                    </span>
                                                    <span className="text-xs text-[var(--sub-text-color)]">
                                                        {emp.email || emp.username || ''}
                                                    </span>
                                                    <X 
                                                        size={14} 
                                                        className="text-[var(--sub-text-color)] cursor-pointer hover:text-red-500 ml-1" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleEmployee(emp);
                                                        }}
                                                        title={t("allTeams.editTeam.removeMember")}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                            </div>
                        )}
                    
                    {/* Team Description - Full Width */}
                    <textarea
                        className="form-input w-full"
                        placeholder={t("departments.newDepartmentForm.setupTeams.description")}
                        rows="3"
                        value={editTeam.description}
                        onChange={(e) => setEditTeam(prev => ({ ...prev, description: e.target.value }))}
                    />
                    
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={handleCancel}
                        >
                            {t("allTeams.editTeam.cancel")}
                        </button>
                        <button 
                            type="button" 
                            className="btn-primary flex items-center gap-2"
                            onClick={handleUpdateTeam}
                                    disabled={!editTeam.name.trim() || !editTeam.teamLeader || isUpdating || isUpdatingUsers}
                                >
                                    {(isUpdating || isUpdatingUsers) ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>{isUpdating ? t("allTeams.editTeam.updatingTeam") : t("allTeams.editTeam.updatingMembers")}</span>
                                        </>
                                    ) : (
                                        <>
                            <Save size={16} />
                            {t("allTeams.editTeam.saveChanges")}
                                        </>
                                    )}
                        </button>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
