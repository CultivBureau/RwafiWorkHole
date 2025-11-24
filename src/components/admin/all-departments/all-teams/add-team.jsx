import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, Plus, Check, Users, Search, User, Crown, XCircle, Loader2 } from "lucide-react";
import { useGetAllUsersQuery } from "../../../../services/apis/UserApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation } from "../../../../services/apis/TeamApi";
import toast from "react-hot-toast";

export default function AddTeamModal({ isOpen, onClose, onAddTeam, departmentId }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [newTeam, setNewTeam] = useState({ 
        name: '', 
        description: '', 
        selectedEmployees: [],
        teamLeader: null
    });
    const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
    const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [membersSearchTerm, setMembersSearchTerm] = useState("");
    const leaderDropdownRef = useRef(null);
    const membersDropdownRef = useRef(null);

    // Fetch all users (filtered by department if provided)
    const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(
        { departmentId, pageNumber: 1, pageSize: 200 },
        { skip: !isOpen }
    );
    
    const allUsers = useMemo(() => {
        const items = usersData?.value || usersData?.data || usersData?.items || usersData || [];
        return Array.isArray(items) ? items : [];
    }, [usersData]);

    // Filter users for team leader (exclude already selected team leader)
    const availableLeaderUsers = useMemo(() => {
        return allUsers.filter(user => {
            const userId = user?.id || user?.userId;
            const teamLeaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
            return userId !== teamLeaderId;
        });
    }, [allUsers, newTeam.teamLeader]);

    // Filter users for members (exclude team leader and already selected members)
    const availableMemberUsers = useMemo(() => {
        const teamLeaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
        const selectedMemberIds = new Set(
            newTeam.selectedEmployees.map(emp => emp?.id || emp?.userId).filter(Boolean)
        );
        
        return allUsers.filter(user => {
            const userId = user?.id || user?.userId;
            return userId !== teamLeaderId && !selectedMemberIds.has(userId);
        });
    }, [allUsers, newTeam.teamLeader, newTeam.selectedEmployees]);

    // Filter leader users based on search term
    const filteredLeaderUsers = useMemo(() => {
        if (!leaderSearchTerm.trim()) return availableLeaderUsers;
        const search = leaderSearchTerm.toLowerCase();
        return availableLeaderUsers.filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.userName || u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [availableLeaderUsers, leaderSearchTerm]);

    // Filter member users based on search term
    const filteredMemberUsers = useMemo(() => {
        if (!membersSearchTerm.trim()) return availableMemberUsers;
        const search = membersSearchTerm.toLowerCase();
        return availableMemberUsers.filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.userName || u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [availableMemberUsers, membersSearchTerm]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leaderDropdownRef.current && !leaderDropdownRef.current.contains(event.target)) {
                setIsLeaderDropdownOpen(false);
            }
            if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target)) {
                setIsMembersDropdownOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
    const [addUsersToTeam, { isLoading: isAddingUsers }] = useAddUsersToTeamMutation();

    const toggleEmployee = (employee) => {
        const employeeId = employee?.id || employee?.userId;
        if (!employeeId) return;
        
        setNewTeam(prev => {
            const isAlreadySelected = prev.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) === String(employeeId);
            });
            
            if (isAlreadySelected) {
                return {
                    ...prev,
                    selectedEmployees: prev.selectedEmployees.filter(emp => {
                        const empId = emp?.id || emp?.userId;
                        return String(empId) !== String(employeeId);
                    })
                };
            } else {
                return {
                    ...prev,
                    selectedEmployees: [...prev.selectedEmployees, employee]
                };
            }
        });
    };

    const selectTeamLeader = (leader) => {
        setNewTeam(prev => ({ ...prev, teamLeader: leader }));
        setIsLeaderDropdownOpen(false);
        setLeaderSearchTerm("");
    };

    const removeTeamLeader = () => {
        setNewTeam(prev => ({ ...prev, teamLeader: null }));
    };

    const removeEmployee = (employeeId) => {
        setNewTeam(prev => ({
            ...prev,
            selectedEmployees: prev.selectedEmployees.filter(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) !== String(employeeId);
            })
        }));
    };

    const handleAddTeam = async () => {
        const teamLeadId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
        
        if (!newTeam.name.trim()) {
            toast.error(t("allTeams.addTeam.errors.nameRequired", "Please enter a team name"));
            return;
        }
        if (!departmentId) {
            toast.error(t("allTeams.addTeam.errors.departmentRequired", "Department ID is missing"));
            return;
        }
        if (!teamLeadId) {
            toast.error(t("allTeams.addTeam.errors.leaderRequired", "Please select a team leader"));
            return;
        }
        
        try {
            // Step 1: Create the team
            const payload = {
                name: newTeam.name.trim(),
                description: newTeam.description?.trim() || '',
                teamLeadId,
                departmentId,
            };
            
            toast.loading(t("allTeams.addTeam.creating", "Creating team..."), { id: 'create-team' });
            const teamResult = await createTeam(payload).unwrap();
            const createdTeam = teamResult?.value || teamResult;
            const createdTeamId = createdTeam?.id;
            
            if (!createdTeamId) {
                throw new Error('Team was created but no team ID was returned');
            }

            toast.dismiss('create-team');
            toast.success(t("allTeams.addTeam.teamCreated", "Team created successfully!"));

            // Step 2: Add team members
            if (newTeam.selectedEmployees.length > 0) {
                const userIds = newTeam.selectedEmployees
                    .map(member => member?.id || member?.userId)
                    .filter(Boolean);
                
                if (userIds.length > 0) {
                    try {
                        toast.loading(t("allTeams.addTeam.addingMembers", "Adding members..."), { id: 'add-members' });
                        await addUsersToTeam({ 
                            teamId: createdTeamId, 
                            userIds,
                            departmentId: departmentId
                        }).unwrap();
                        toast.dismiss('add-members');
                        toast.success(t("allTeams.addTeam.membersAdded", "Members added successfully!"));
                    } catch (addUsersError) {
                        toast.dismiss('add-members');
                        const errorMsg = addUsersError?.data?.errorMessage || 
                                       addUsersError?.data?.message || 
                                       addUsersError?.message || 
                                       t("allTeams.addTeam.errors.addMembersFailed", "Failed to add members");
                        toast.error(errorMsg);
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
            
            // Reset form
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
            setIsLeaderDropdownOpen(false);
            setIsMembersDropdownOpen(false);
            onClose();
        } catch (error) {
            toast.dismiss('create-team');
            const errorMessage = error?.data?.errorMessage || 
                               error?.data?.message || 
                               error?.message || 
                               t("allTeams.addTeam.errors.createFailed", "Failed to create team. Please try again.");
            toast.error(errorMessage);
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
        setLeaderSearchTerm("");
        setMembersSearchTerm("");
        setIsLeaderDropdownOpen(false);
        setIsMembersDropdownOpen(false);
        onClose();
    };

    if (!isOpen) return null;

    const getUserDisplayName = (user) => {
        return user?.name || 
               (user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
               user?.email || 
               user?.userName || 
               'Unknown';
    };

    const getUserDisplayInfo = (user) => {
        return user?.email || user?.userName || user?.jobTitle || '';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div 
                className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp"
                dir={isArabic ? "rtl" : "ltr"}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-color)]/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[var(--accent-color)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-color)]">
                                {t("departments.newDepartmentForm.setupTeams.addNewTeam", "Add New Team")}
                            </h2>
                            <p className="text-xs text-[var(--sub-text-color)] mt-0.5">
                                {t("allTeams.addTeam.subtitle", "Create a new team and assign members")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                        disabled={isCreating || isAddingUsers}
                    >
                        <X className="text-[var(--sub-text-color)]" size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Section 1: Team Basic Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-[var(--accent-color)]">1</span>
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                {t("allTeams.addTeam.sections.basicInfo", "Basic Information")}
                            </h3>
                        </div>
                        
                        <div className="bg-[var(--container-color)]/30 rounded-xl p-4 space-y-4 border border-[var(--border-color)]">
                            {/* Team Name */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                    {t("departments.newDepartmentForm.setupTeams.teamName", "Team Name")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
                                    placeholder={t("allTeams.addTeam.placeholders.teamName", "Enter team name")}
                                    type="text"
                                    value={newTeam.name}
                                    onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>

                            {/* Team Description */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                    {t("departments.newDepartmentForm.setupTeams.description", "Description")}
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all resize-none"
                                    placeholder={t("allTeams.addTeam.placeholders.description", "Enter team description (optional)")}
                                    rows="3"
                                    value={newTeam.description}
                                    onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Team Leader */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-[var(--accent-color)]">2</span>
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                {t("allTeams.addTeam.sections.teamLeader", "Team Leader")} <span className="text-red-500">*</span>
                            </h3>
                        </div>
                        
                        <div className="bg-[var(--container-color)]/30 rounded-xl p-4 border border-[var(--border-color)]">
                            {newTeam.teamLeader ? (
                                <div className="flex items-center justify-between p-3 bg-[var(--bg-color)] rounded-xl border border-[var(--accent-color)]/20">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                            <Crown className="w-5 h-5 text-[var(--accent-color)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                {getUserDisplayName(newTeam.teamLeader)}
                                            </p>
                                            {getUserDisplayInfo(newTeam.teamLeader) && (
                                                <p className="text-xs text-[var(--sub-text-color)] truncate">
                                                    {getUserDisplayInfo(newTeam.teamLeader)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={removeTeamLeader}
                                        className="p-1.5 hover:bg-[var(--hover-color)] rounded-lg transition-colors flex-shrink-0"
                                        disabled={isCreating || isAddingUsers}
                                    >
                                        <XCircle className="w-4 h-4 text-[var(--sub-text-color)]" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative" ref={leaderDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)}
                                        className="w-full px-4 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--sub-text-color)] hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/5 transition-all flex items-center justify-between"
                                        disabled={isCreating || isAddingUsers || isLoadingUsers}
                                    >
                                        <span className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {t("allTeams.addTeam.selectLeader", "Select Team Leader")}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isLeaderDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isLeaderDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80">
                                            {/* Search Input */}
                                            <div className="p-3 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                                <div className="relative">
                                                    <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]`} />
                                                    <input
                                                        type="text"
                                                        value={leaderSearchTerm}
                                                        onChange={(e) => setLeaderSearchTerm(e.target.value)}
                                                        placeholder={t("allTeams.addTeam.searchUsers", "Search users...")}
                                                        className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        dir={isArabic ? 'rtl' : 'ltr'}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Users List */}
                                            <div className="overflow-y-auto">
                                                {isLoadingUsers ? (
                                                    <div className="p-6 flex items-center justify-center">
                                                        <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                                                    </div>
                                                ) : filteredLeaderUsers.length > 0 ? (
                                                    filteredLeaderUsers.map(user => (
                                                        <button
                                                            key={user?.id || user?.userId}
                                                            type="button"
                                                            onClick={() => selectTeamLeader(user)}
                                                            className="w-full p-3 hover:bg-[var(--hover-color)] transition-colors text-left border-b border-[var(--border-color)] last:border-b-0"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                                                    <User className="w-5 h-5 text-[var(--accent-color)]" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                                        {getUserDisplayName(user)}
                                                                    </p>
                                                                    {getUserDisplayInfo(user) && (
                                                                        <p className="text-xs text-[var(--sub-text-color)] truncate">
                                                                            {getUserDisplayInfo(user)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-6 text-center text-sm text-[var(--sub-text-color)]">
                                                        {leaderSearchTerm 
                                                            ? t("allTeams.addTeam.noUsersFound", "No users found matching your search")
                                                            : t("allTeams.addTeam.noUsers", "No users available")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Team Members */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-[var(--accent-color)]">3</span>
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                {t("allTeams.addTeam.sections.members", "Team Members")} <span className="text-xs font-normal text-[var(--sub-text-color)]">({newTeam.selectedEmployees.length})</span>
                            </h3>
                        </div>
                        
                        <div className="bg-[var(--container-color)]/30 rounded-xl p-4 border border-[var(--border-color)] space-y-4">
                            {/* Selected Members Chips */}
                            {newTeam.selectedEmployees.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {newTeam.selectedEmployees.map((employee) => {
                                        const empId = employee?.id || employee?.userId;
                                        return (
                                            <div
                                                key={empId}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded-lg"
                                            >
                                                <User className="w-3 h-3 text-[var(--accent-color)]" />
                                                <span className="text-xs font-medium text-[var(--text-color)]">
                                                    {getUserDisplayName(employee)}
                                                </span>
                                                <button
                                                    onClick={() => removeEmployee(empId)}
                                                    className="p-0.5 hover:bg-[var(--accent-color)]/20 rounded transition-colors"
                                                    disabled={isCreating || isAddingUsers}
                                                >
                                                    <X className="w-3 h-3 text-[var(--accent-color)]" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Members Dropdown */}
                            <div className="relative" ref={membersDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                                    className="w-full px-4 py-3 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--sub-text-color)] hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/5 transition-all flex items-center justify-between"
                                    disabled={isCreating || isAddingUsers || isLoadingUsers}
                                >
                                    <span className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        {t("allTeams.addTeam.addMembers", "Add Team Members")}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isMembersDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isMembersDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80">
                                        {/* Search Input */}
                                        <div className="p-3 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                            <div className="relative">
                                                <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]`} />
                                                <input
                                                    type="text"
                                                    value={membersSearchTerm}
                                                    onChange={(e) => setMembersSearchTerm(e.target.value)}
                                                    placeholder={t("allTeams.addTeam.searchUsers", "Search users...")}
                                                    className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    dir={isArabic ? 'rtl' : 'ltr'}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Users List */}
                                        <div className="overflow-y-auto">
                                            {isLoadingUsers ? (
                                                <div className="p-6 flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                                                </div>
                                            ) : filteredMemberUsers.length > 0 ? (
                                                filteredMemberUsers.map(user => {
                                                    const userId = user?.id || user?.userId;
                                                    const isSelected = newTeam.selectedEmployees.some(emp => {
                                                        const empId = emp?.id || emp?.userId;
                                                        return String(empId) === String(userId);
                                                    });
                                                    
                                                    return (
                                                        <button
                                                            key={userId}
                                                            type="button"
                                                            onClick={() => toggleEmployee(user)}
                                                            className={`w-full p-3 transition-colors text-left border-b border-[var(--border-color)] last:border-b-0 flex items-center justify-between ${
                                                                isSelected 
                                                                    ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/15' 
                                                                    : 'hover:bg-[var(--hover-color)]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                    isSelected
                                                                        ? 'bg-[var(--accent-color)]/20'
                                                                        : 'bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10'
                                                                }`}>
                                                                    <User className={`w-5 h-5 ${isSelected ? 'text-[var(--accent-color)]' : 'text-[var(--accent-color)]'}`} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                                        {getUserDisplayName(user)}
                                                                    </p>
                                                                    {getUserDisplayInfo(user) && (
                                                                        <p className="text-xs text-[var(--sub-text-color)] truncate">
                                                                            {getUserDisplayInfo(user)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                                isSelected 
                                                                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' 
                                                                    : 'border-[var(--border-color)]'
                                                            }`}>
                                                                {isSelected && <Check className="text-white" size={12} />}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-6 text-center text-sm text-[var(--sub-text-color)]">
                                                    {membersSearchTerm 
                                                        ? t("allTeams.addTeam.noUsersFound", "No users found matching your search")
                                                        : t("allTeams.addTeam.noUsers", "No users available")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-[var(--border-color)] bg-[var(--container-color)]/20 flex items-center justify-end gap-3">
                    <button 
                        type="button" 
                        className="px-6 py-2.5 border-2 border-[var(--border-color)] rounded-xl font-semibold text-[var(--text-color)] hover:bg-[var(--hover-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleCancel}
                        disabled={isCreating || isAddingUsers}
                    >
                        {t("common.cancel", "Cancel")}
                    </button>
                    <button 
                        type="button" 
                        className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        style={{
                            background: (!newTeam.name.trim() || !departmentId || !newTeam.teamLeader || isCreating || isAddingUsers)
                                ? 'var(--border-color)'
                                : 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color))'
                        }}
                        onClick={handleAddTeam}
                        disabled={!newTeam.name.trim() || !departmentId || !newTeam.teamLeader || isCreating || isAddingUsers}
                    >
                        {(isCreating || isAddingUsers) ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{isCreating ? t("allTeams.addTeam.creating", "Creating...") : t("allTeams.addTeam.addingMembers", "Adding Members...")}</span>
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                <span>{t("allTeams.addTeam.createTeam", "Create Team")}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
