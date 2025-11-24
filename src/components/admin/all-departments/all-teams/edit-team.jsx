import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, ChevronDown, Check, Save, Search, Users, Crown, UserPlus, AlertCircle, Sparkles, User } from "lucide-react";
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
    const [formErrors, setFormErrors] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

    // Validation function
    const validateForm = () => {
        const errors = {};
        
        if (!editTeam.name?.trim()) {
            errors.name = t("allTeams.editTeam.errors.enterTeamName", "Team name is required");
        }
        
        if (!editTeam.teamLeader) {
            errors.teamLeader = t("allTeams.editTeam.errors.selectTeamLeader", "Team leader is required");
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check if form is valid for enabling/disabling save button
    const isFormValid = useMemo(() => {
        return editTeam.name?.trim() && editTeam.teamLeader;
    }, [editTeam.name, editTeam.teamLeader]);

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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div 
                className="bg-[var(--bg-color)] rounded-2xl border-2 border-[var(--border-color)] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Enhanced Gradient Header */}
                <div className="relative bg-gradient-to-r from-[#15919B] via-[#09D1C7] to-[#15919B] p-6 rounded-t-2xl pb-14 overflow-hidden">
                    {/* Decorative background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className={`absolute ${isArabic ? '-left-10' : '-right-10'} -top-10 w-40 h-40 bg-white rounded-full blur-3xl`}></div>
                        <div className={`absolute ${isArabic ? '-right-10' : '-left-10'} -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl`}></div>
                    </div>
                    
                    <div className={`flex items-center justify-between relative z-10 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                                <Users className="text-white w-7 h-7" />
                            </div>
                            <div className={isArabic ? 'text-right' : 'text-left'}>
                                <div className={`flex items-center gap-2 mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Sparkles className="text-white/80 w-4 h-4" />
                                    <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                                        {t("allTeams.editTeam.subtitle", "Team Management")}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {t("allTeams.editTeam.title", "Edit Team")}
                                </h2>
                                {teamData?.name && (
                                    <p className="text-white/90 text-sm font-medium">
                                        {teamData.name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 group relative backdrop-blur-sm"
                            aria-label={t("common.close", "Close")}
                        >
                            <X className="text-white group-hover:rotate-90 transition-transform duration-300" size={24} />
                        </button>
                    </div>
                    
                    {/* Progress indicator */}
                    {hasUnsavedChanges && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div className="h-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '100%' }}></div>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoadingMembers ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-12 bg-[var(--container-color)] rounded-lg"></div>
                            <div className="h-32 bg-[var(--container-color)] rounded-lg"></div>
                            <div className="h-24 bg-[var(--container-color)] rounded-lg"></div>
                        </div>
                    ) : (
                    <>
                        {/* Section 1: Team Information */}
                        <div className="space-y-4 p-5 bg-gradient-to-br from-[var(--accent-color)]/5 to-transparent rounded-xl border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all duration-300">
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[var(--accent-color)]" />
                                </div>
                                <div className={isArabic ? 'text-right' : 'text-left'}>
                                    <h3 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wide">
                                        {t("allTeams.editTeam.teamInfo", "Team Information")}
                                    </h3>
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {t("allTeams.editTeam.teamInfoDesc", "Basic team details")}
                                    </p>
                                </div>
                            </div>

                            {/* Team Name */}
                            <div className="space-y-2">
                                <label className={`block text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                    {t("allTeams.editTeam.teamNameLabel", "Team Name")} <span className="text-[var(--error-color)]">*</span>
                                </label>
                                <input
                                    className={`form-input w-full transition-all duration-200 ${
                                        formErrors.name 
                                            ? 'border-[var(--error-color)] ring-2 ring-[var(--error-color)]/20' 
                                            : 'focus:ring-2 focus:ring-[var(--accent-color)]/50 focus:border-[var(--accent-color)]'
                                    }`}
                                    placeholder={t("allTeams.editTeam.teamNamePlaceholder", "Enter team name...")}
                                    type="text"
                                    value={editTeam.name}
                                    onChange={(e) => {
                                        setEditTeam(prev => ({ ...prev, name: e.target.value }));
                                        setHasUnsavedChanges(true);
                                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null }));
                                    }}
                                />
                                {formErrors.name && (
                                    <div className={`flex items-center gap-2 text-xs text-[var(--error-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <AlertCircle size={14} />
                                        <span>{formErrors.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Team Description */}
                            <div className="space-y-2">
                                <label className={`block text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                    {t("allTeams.editTeam.descriptionLabel", "Team Description")}
                                </label>
                                <textarea
                                    className="form-input w-full resize-none focus:ring-2 focus:ring-[var(--accent-color)]/50 focus:border-[var(--accent-color)] transition-all duration-200"
                                    placeholder={t("allTeams.editTeam.descriptionPlaceholder", "Describe the team's purpose and responsibilities...")}
                                    rows="3"
                                    value={editTeam.description}
                                    onChange={(e) => {
                                        setEditTeam(prev => ({ ...prev, description: e.target.value }));
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Section 2: Team Leader */}
                        <div className="space-y-4 p-5 bg-gradient-to-br from-[#09D1C7]/5 to-transparent rounded-xl border-2 border-[var(--border-color)] hover:border-[#09D1C7]/30 transition-all duration-300">
                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#09D1C7]/20 to-[#09D1C7]/10 flex items-center justify-center">
                                        <Crown className="w-5 h-5 text-[#09D1C7]" />
                                    </div>
                                    <div className={isArabic ? 'text-right' : 'text-left'}>
                                        <h3 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wide">
                                            {t("allTeams.editTeam.teamLeaderTitle", "Team Leader")} <span className="text-[var(--error-color)] text-xs">*</span>
                                        </h3>
                                        <p className="text-xs text-[var(--sub-text-color)]">
                                            {t("allTeams.editTeam.teamLeaderDesc", "Choose who will lead this team")}
                                        </p>
                                    </div>
                                </div>
                                {editTeam.teamLeader && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#09D1C7]/10 border border-[#09D1C7]/30">
                                        <Check className="w-3 h-3 text-[#09D1C7]" />
                                        <span className="text-xs font-semibold text-[#09D1C7]">
                                            {t("allTeams.editTeam.assigned", "Assigned")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Current Team Leader Display */}
                            {editTeam.teamLeader && (
                                <div className="p-4 bg-gradient-to-r from-[#09D1C7]/10 to-[#09D1C7]/5 rounded-lg border border-[#09D1C7]/20">
                                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-[#09D1C7]" />
                                        </div>
                                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <p className="text-sm font-bold text-[var(--text-color)]">
                                                {editTeam.teamLeader.name || `${editTeam.teamLeader.firstName || ''} ${editTeam.teamLeader.lastName || ''}`.trim() || editTeam.teamLeader.email}
                                            </p>
                                            <p className="text-xs text-[var(--sub-text-color)]">
                                                {editTeam.teamLeader.email || editTeam.teamLeader.userName || t("allTeams.editTeam.teamLeaderRole", "Team Leader")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditTeam(prev => ({ ...prev, teamLeader: null }));
                                                setLeaderRole(null);
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="p-2 hover:bg-[var(--error-color)]/10 rounded-lg transition-colors group"
                                            title={t("allTeams.editTeam.removeLeader", "Remove leader")}
                                        >
                                            <X size={16} className="text-[var(--error-color)] group-hover:text-[var(--error-color)]" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Leader Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Step 1: Select Role */}
                                <div className="space-y-2">
                                    <label className={`block text-sm font-medium text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {t("allTeams.editTeam.step1", "Step 1: Select Role")}
                                    </label>
                                    <div className="relative">
                                        <div 
                                            className={`form-input cursor-pointer flex items-center justify-between group transition-all duration-200 ${
                                                isLeaderRoleOpen 
                                                    ? 'ring-2 ring-[var(--warning-color)]/50 border-[var(--warning-color)]' 
                                                    : 'hover:border-[var(--warning-color)]/50'
                                            }`}
                                            onClick={() => setIsLeaderRoleOpen(!isLeaderRoleOpen)}
                                        >
                                            <span className={leaderRole ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                                {leaderRole ? leaderRole.name : t("allTeams.editTeam.selectRole", "Select a role...")}
                                            </span>
                                            <ChevronDown className={`transition-transform duration-300 ${isLeaderRoleOpen ? 'rotate-180 text-[var(--warning-color)]' : 'text-[var(--sub-text-color)]'}`} size={18} />
                                        </div>
                                        {isLeaderRoleOpen && (
                                            <div className={`absolute top-full ${isArabic ? 'right-0 left-0' : 'left-0 right-0'} z-30 mt-2 bg-[var(--bg-color)] border-2 border-[var(--warning-color)]/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200`}>
                                                {roles && roles.length > 0 ? (
                                                    roles.map((role, index) => (
                                                        <div 
                                                            key={role.id} 
                                                            className={`p-3 cursor-pointer transition-all duration-200 hover:bg-[var(--warning-color)]/10 ${
                                                                index !== 0 ? 'border-t border-[var(--border-color)]' : ''
                                                            } ${leaderRole?.id === role.id ? 'bg-[var(--pending-leave-box-bg)]' : ''}`}
                                                            onClick={() => { 
                                                                setLeaderRole(role); 
                                                                setIsLeaderRoleOpen(false); 
                                                                setIsLeaderUserOpen(true);
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--warning-color)]/20 to-[var(--warning-color)]/10 flex items-center justify-center">
                                                                    <Users className="w-4 h-4 text-[var(--warning-color)]" />
                                                                </div>
                                                                <span className="text-sm font-medium text-[var(--text-color)]">{role.name}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-[var(--sub-text-color)]">
                                                        {t("allTeams.editTeam.noRolesFound", "No roles available")}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Select User */}
                                <div className="space-y-2">
                                    <label className={`block text-sm font-medium text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {t("allTeams.editTeam.step2", "Step 2: Select Leader")}
                                    </label>
                                    <div className="relative">
                                        <div 
                                            className={`form-input cursor-pointer flex items-center justify-between group transition-all duration-200 ${
                                                !leaderRole ? 'opacity-50 cursor-not-allowed' : ''
                                            } ${isLeaderUserOpen ? 'ring-2 ring-[var(--warning-color)]/50 border-[var(--warning-color)]' : 'hover:border-[var(--warning-color)]/50'}
                                            ${formErrors.teamLeader ? 'border-[var(--error-color)] ring-2 ring-[var(--error-color)]/20' : ''}`}
                                            onClick={() => {
                                                if (leaderRole) {
                                                    setIsLeaderUserOpen(!isLeaderUserOpen);
                                                }
                                            }}
                                        >
                                            <span className={editTeam.teamLeader ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                                {editTeam.teamLeader 
                                                    ? (editTeam.teamLeader.name || `${editTeam.teamLeader.firstName || ''} ${editTeam.teamLeader.lastName || ''}`.trim() || editTeam.teamLeader.email)
                                                    : (leaderRole ? t("allTeams.editTeam.selectUser", "Select a user...") : t("allTeams.editTeam.selectRoleFirst", "Select role first"))
                                                }
                                            </span>
                                            <ChevronDown className={`transition-transform duration-300 ${isLeaderUserOpen ? 'rotate-180 text-[var(--warning-color)]' : 'text-[var(--sub-text-color)]'}`} size={18} />
                                        </div>
                                        {isLeaderUserOpen && leaderRole && (
                                            <div className={`absolute top-full ${isArabic ? 'right-0 left-0' : 'left-0 right-0'} z-30 mt-2 bg-[var(--bg-color)] border-2 border-[var(--warning-color)]/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                                {/* Search Bar */}
                                                <div className="p-3 border-b-2 border-[var(--border-color)] bg-gradient-to-r from-[var(--pending-leave-box-bg)]/50 to-transparent sticky top-0 z-10">
                                                    <div className="relative">
                                                        <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--warning-color)]`} />
                                                        <input
                                                            type="text"
                                                            value={leaderSearchTerm}
                                                            onChange={(e) => setLeaderSearchTerm(e.target.value)}
                                                            placeholder={t("allTeams.editTeam.searchPlaceholder", "Search by name or email...")}
                                                            className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--warning-color)]/50 focus:border-[var(--warning-color)]`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <p className="text-xs text-[var(--sub-text-color)] mt-2">
                                                        {filteredLeaderUsers.length} {t("allTeams.editTeam.usersFound", "user(s) found")}
                                                    </p>
                                                </div>
                                                {/* Users List */}
                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredLeaderUsers.length > 0 ? (
                                                        filteredLeaderUsers.map((u, index) => {
                                                            const userId = u?.id || u?.userId || u?.userID || u?.email || `leader-${index}`;
                                                            return (
                                                            <div 
                                                                key={userId} 
                                                                className={`p-3 cursor-pointer transition-all duration-200 hover:bg-[var(--warning-color)]/10 ${
                                                                    index !== 0 ? 'border-t border-[var(--border-color)]' : ''
                                                                }`}
                                                                onClick={() => {
                                                                    selectTeamLeader(u);
                                                                    setLeaderSearchTerm("");
                                                                    setHasUnsavedChanges(true);
                                                                    if (formErrors.teamLeader) setFormErrors(prev => ({ ...prev, teamLeader: null }));
                                                                }}
                                                            >
                                                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--warning-color)]/20 to-[var(--warning-color)]/10 flex items-center justify-center flex-shrink-0">
                                                                        <User className="w-5 h-5 text-[var(--warning-color)]" />
                                                                    </div>
                                                                    <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                                        <p className="text-sm font-semibold text-[var(--text-color)]">
                                                                            {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown'}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-8 text-center">
                                                            <User className="w-12 h-12 mx-auto mb-3 text-[var(--sub-text-color)] opacity-30" />
                                                            <p className="text-sm text-[var(--sub-text-color)]">
                                                                {leaderSearchTerm 
                                                                    ? t("allTeams.editTeam.noResults", "No users match your search") 
                                                                    : t("allTeams.editTeam.noUsersInRole", "No users in this role")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.teamLeader && (
                                        <div className={`flex items-center gap-2 text-xs text-[var(--error-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <AlertCircle size={14} />
                                            <span>{formErrors.teamLeader}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Team Members */}
                        <div className="space-y-4 p-5 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)] hover:border-[#15919B]/30 transition-all duration-300">
                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#15919B]/20 to-[#15919B]/10 flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 text-[#15919B]" />
                                    </div>
                                    <div className={isArabic ? 'text-right' : 'text-left'}>
                                        <h3 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wide">
                                            {t("allTeams.editTeam.teamMembersTitle", "Team Members")}
                                        </h3>
                                        <p className="text-xs text-[var(--sub-text-color)]">
                                            {t("allTeams.editTeam.teamMembersDesc", "Add team members to collaborate")}
                                        </p>
                                    </div>
                                </div>
                                {editTeam.selectedEmployees.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#15919B]/10 border border-[#15919B]/30">
                                        <Users className="w-3 h-3 text-[#15919B]" />
                                        <span className="text-xs font-bold text-[#15919B]">
                                            {editTeam.selectedEmployees.length} {t("allTeams.editTeam.members", "Members")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Member Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Step 1: Select Role */}
                                <div className="space-y-2">
                                    <label className={`block text-sm font-medium text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {t("allTeams.editTeam.step1", "Step 1: Select Role")}
                                    </label>
                                    <div className="relative">
                                        <div 
                                            className={`form-input cursor-pointer flex items-center justify-between group transition-all duration-200 ${
                                                isMembersRoleOpen 
                                                    ? 'ring-2 ring-[#15919B]/50 border-[#15919B]' 
                                                    : 'hover:border-[#15919B]/50'
                                            }`}
                                            onClick={() => setIsMembersRoleOpen(!isMembersRoleOpen)}
                                        >
                                            <span className={membersRole ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                                {membersRole ? membersRole.name : t("allTeams.editTeam.selectRole", "Select a role...")}
                                            </span>
                                            <ChevronDown className={`transition-transform duration-300 ${isMembersRoleOpen ? 'rotate-180 text-[#15919B]' : 'text-[var(--sub-text-color)]'}`} size={18} />
                                        </div>
                                        {isMembersRoleOpen && (
                                            <div className={`absolute top-full ${isArabic ? 'right-0 left-0' : 'left-0 right-0'} z-20 mt-2 bg-[var(--bg-color)] border-2 border-[#15919B]/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200`}>
                                                {roles && roles.length > 0 ? (
                                                    roles.map((role, index) => (
                                                        <div 
                                                            key={role.id} 
                                                            className={`p-3 cursor-pointer transition-all duration-200 hover:bg-[#15919B]/10 ${
                                                                index !== 0 ? 'border-t border-[var(--border-color)]' : ''
                                                            } ${membersRole?.id === role.id ? 'bg-[#15919B]/10' : ''}`}
                                                            onClick={() => { 
                                                                setMembersRole(role); 
                                                                setIsMembersRoleOpen(false); 
                                                                setIsMembersOpen(true);
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center">
                                                                    <Users className="w-4 h-4 text-[var(--success-color)]" />
                                                                </div>
                                                                <span className="text-sm font-medium text-[var(--text-color)]">{role.name}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-[var(--sub-text-color)]">
                                                        {t("allTeams.editTeam.noRolesFound", "No roles available")}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Select Users */}
                                <div className="space-y-2">
                                    <label className={`block text-sm font-medium text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {t("allTeams.editTeam.step2Members", "Step 2: Select Members")}
                                    </label>
                                    <div className="relative">
                                        <div 
                                            className={`form-input cursor-pointer flex items-center justify-between group transition-all duration-200 ${
                                                !membersRole ? 'opacity-50 cursor-not-allowed' : ''
                                            } ${isMembersOpen ? 'ring-2 ring-[#15919B]/50 border-[#15919B]' : 'hover:border-[#15919B]/50'}`}
                                            onClick={() => {
                                                if (membersRole) {
                                                    setIsMembersOpen(!isMembersOpen);
                                                }
                                            }}
                                        >
                                            <span className={editTeam.selectedEmployees.length > 0 ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                                {editTeam.selectedEmployees.length > 0 
                                                    ? `${editTeam.selectedEmployees.length} ${t("allTeams.editTeam.selected", "selected")}` 
                                                    : (membersRole ? t("allTeams.editTeam.selectUsers", "Select users...") : t("allTeams.editTeam.selectRoleFirst", "Select role first"))
                                                }
                                            </span>
                                            <ChevronDown className={`transition-transform duration-300 ${isMembersOpen ? 'rotate-180 text-[#15919B]' : 'text-[var(--sub-text-color)]'}`} size={18} />
                                        </div>
                                        {isMembersOpen && membersRole && (
                                            <div className={`absolute top-full ${isArabic ? 'right-0 left-0' : 'left-0 right-0'} z-20 mt-2 bg-[var(--bg-color)] border-2 border-[#15919B]/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                                {/* Search Bar */}
                                                <div className="p-3 border-b-2 border-[var(--border-color)] bg-gradient-to-r from-[#15919B]/5 to-transparent sticky top-0 z-10">
                                                    <div className="relative">
                                                        <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#15919B]`} />
                                                        <input
                                                            type="text"
                                                            value={membersSearchTerm}
                                                            onChange={(e) => setMembersSearchTerm(e.target.value)}
                                                            placeholder={t("allTeams.editTeam.searchPlaceholder", "Search by name or email...")}
                                                            className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#15919B]/50 focus:border-[#15919B]`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-[var(--sub-text-color)] mt-2">
                                                        {filteredMemberUsers.length} {t("allTeams.editTeam.usersFound", "user(s) found")}
                                                    </p>
                                                </div>
                                                {/* Users List */}
                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredMemberUsers.length > 0 ? (
                                                        filteredMemberUsers.map((u, index) => {
                                                            const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id;
                                                            const isSelected = userId && editTeam.selectedEmployees.some(emp => {
                                                                const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
                                                                return String(empId) === String(userId) && empId != null && userId != null;
                                                            });
                                                            
                                                            return (
                                                                <div 
                                                                    key={`user-${userId || u?.id || u?.email || `member-${index}`}`} 
                                                                    className={`p-3 cursor-pointer transition-all duration-200 ${
                                                                        isSelected 
                                                                            ? 'bg-[#15919B]/10' 
                                                                            : 'hover:bg-[#15919B]/5'
                                                                    } ${index !== 0 ? 'border-t border-[var(--border-color)]' : ''}`}
                                                                    onClick={() => {
                                                                        toggleEmployee(u);
                                                                        setHasUnsavedChanges(true);
                                                                    }}
                                                                >
                                                                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                            isSelected 
                                                                                ? 'bg-gradient-to-br from-[#15919B]/30 to-[#15919B]/20' 
                                                                                : 'bg-gradient-to-br from-[#15919B]/10 to-[#15919B]/5'
                                                                        }`}>
                                                                            <User className={`w-5 h-5 ${isSelected ? 'text-[#15919B]' : 'text-[var(--sub-text-color)]'}`} />
                                                                        </div>
                                                                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                                            <p className="text-sm font-semibold text-[var(--text-color)]">
                                                                                {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown'}
                                                                            </p>
                                                                            <p className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</p>
                                                                        </div>
                                                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                                                            isSelected 
                                                                                ? 'border-[#15919B] bg-[#15919B] scale-110' 
                                                                                : 'border-[var(--border-color)]'
                                                                        }`}>
                                                                            {isSelected && <Check className="text-white" size={14} strokeWidth={3} />}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-8 text-center">
                                                            <UserPlus className="w-12 h-12 mx-auto mb-3 text-[var(--sub-text-color)] opacity-30" />
                                                            <p className="text-sm text-[var(--sub-text-color)]">
                                                                {membersSearchTerm 
                                                                    ? t("allTeams.editTeam.noResults", "No users match your search") 
                                                                    : t("allTeams.editTeam.noUsersInRole", "No users in this role")}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Selected Members Display */}
                            {editTeam.selectedEmployees.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <h4 className="text-sm font-semibold text-[var(--text-color)]">
                                            {t("allTeams.editTeam.selectedMembersTitle", "Selected Members")} ({editTeam.selectedEmployees.length})
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setEditTeam(prev => ({ ...prev, selectedEmployees: [] }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="text-xs text-[var(--error-color)] hover:underline font-medium"
                                        >
                                            {t("allTeams.editTeam.clearAll", "Clear all")}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-[var(--bg-color)] rounded-xl border-2 border-dashed border-[var(--border-color)]">
                                        {editTeam.selectedEmployees.map((emp, idx) => {
                                            const empId = emp.id || emp.userId || emp.userID || emp.Id || `emp-${idx}`;
                                            return (
                                                <div 
                                                    key={empId} 
                                                    className="group flex items-center gap-2 px-3 py-2 bg-[#15919B]/10 rounded-lg border border-[#15919B]/30 hover:border-[#15919B]/50 hover:shadow-sm transition-all duration-200"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#15919B]/20 to-[#15919B]/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-[#15919B]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                            {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                                                        </p>
                                                        {(emp.email || emp.username) && (
                                                            <p className="text-xs text-[var(--sub-text-color)] truncate">
                                                                {emp.email || emp.username}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            toggleEmployee(emp);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                        className="p-1.5 hover:bg-[var(--rejected-leave-box-bg)] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        title={t("allTeams.editTeam.removeMember", "Remove")}
                                                    >
                                                        <X size={14} className="text-[var(--error-color)]" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                    )}
                </div>

                {/* Sticky Footer with Action Buttons */}
                <div className="flex-shrink-0 border-t-2 border-[var(--border-color)] bg-[var(--bg-color)] p-6">
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button 
                            type="button" 
                            className="flex-1 px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] hover:border-[var(--accent-color)]/30 transition-all duration-200 hover:scale-105"
                            onClick={handleCancel}
                            disabled={isUpdating || isUpdatingUsers}
                        >
                            {t("allTeams.editTeam.cancel")}
                        </button>
                        <button 
                            type="button" 
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                                isFormValid && !isUpdating && !isUpdatingUsers
                                    ? 'bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-color)]/80 text-white hover:shadow-lg hover:scale-105 border-2 border-[var(--accent-color)]'
                                    : 'bg-[var(--container-color)] text-[var(--sub-text-color)] border-2 border-[var(--border-color)] cursor-not-allowed opacity-60'
                            }`}
                            onClick={() => {
                                if (validateForm()) {
                                    handleUpdateTeam();
                                }
                            }}
                            disabled={!isFormValid || isUpdating || isUpdatingUsers}
                        >
                            {(isUpdating || isUpdatingUsers) ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{isUpdating ? t("allTeams.editTeam.updatingTeam") : t("allTeams.editTeam.updatingMembers")}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {t("allTeams.editTeam.saveChanges")}
                                </>
                            )}
                        </button>
                    </div>
                    {!isFormValid && !isLoadingMembers && (
                        <div className={`mt-3 flex items-center gap-2 text-xs text-[var(--sub-text-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <AlertCircle size={12} />
                            <span>{t("allTeams.editTeam.fillRequiredFields", "Please fill in all required fields (Team Name and Team Leader)")}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
