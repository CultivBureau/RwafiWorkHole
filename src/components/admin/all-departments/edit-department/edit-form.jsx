import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Users, UserCheck, Eye, ChevronDown, X, Plus, Check, Save, Edit, Trash2, Search } from "lucide-react";
import { useGetDepartmentByIdQuery, useGetDepartmentSupervisorQuery, useUpdateDepartmentMutation } from "../../../../services/apis/DepartmentApi";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../../services/apis/RoleApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation, useGetTeamsByDepartmentQuery, useUpdateTeamMutation, useDeleteTeamMutation, useUpdateUsersInTeamMutation, useGetTeamUsersQuery } from "../../../../services/apis/TeamApi";
import { useHasPermission } from "../../../../hooks/useHasPermission";

export default function EditDepartmentForm() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    
    // Permission checks for Department actions
    const canAssignSupervisor = useHasPermission('Department.AssignSupervisor');
    const canRemoveSupervisor = useHasPermission('Department.RemoveSupervisor');
    const canGetSupervisor = useHasPermission('Department.GetSupervisor');
    
    // Permission checks for Team actions
    const canViewTeams = useHasPermission('Team.View');
    const canCreateTeam = useHasPermission('Team.Create');
    const canUpdateTeam = useHasPermission('Team.Update');
    const canDeleteTeam = useHasPermission('Team.Delete');
    const canAddMember = useHasPermission('Team.AddMember');
    const canUpdateMember = useHasPermission('Team.UpdateMember');
    const canRemoveMember = useHasPermission('Team.RemoveMember');

    // Filter steps based on permissions
    const allSteps = [
        { label: t("departments.editDepartmentForm.steps.departmentInfo"), icon: Building2, key: 'info' },
        { label: t("departments.editDepartmentForm.steps.assignSupervisor"), icon: UserCheck, key: 'supervisor', requiresPermission: canAssignSupervisor || canRemoveSupervisor },
        { label: t("departments.editDepartmentForm.steps.setupTeams"), icon: Users, key: 'teams', requiresPermission: canViewTeams },
        { label: t("departments.editDepartmentForm.steps.reviewAndSave"), icon: Eye, key: 'review' },
    ];
    
    // Only show steps user has permission for
    const steps = allSteps.filter(step => !step.requiresPermission || step.requiresPermission);

    const [departmentData, setDepartmentData] = useState({ id, name: "", description: "", supervisorId: null, teams: [] });
    
    // Fetch department by ID
    const { data: departmentResponse, isLoading: isLoadingDepartment, isError: isErrorDepartment } = useGetDepartmentByIdQuery(id, {
        skip: !id
    });
    
    const foundDepartment = useMemo(() => {
        if (!departmentResponse) return null;
        return departmentResponse?.value || departmentResponse?.data || departmentResponse || null;
    }, [departmentResponse]);

    // Fetch supervisor data if supervisorId exists AND user has permission to view supervisor
    const { data: supervisorResponse } = useGetDepartmentSupervisorQuery(id, {
        skip: !id || !foundDepartment?.supervisorId || !canGetSupervisor
    });
    const supervisorData = supervisorResponse?.value || supervisorResponse?.data || supervisorResponse || null;

    // Pre-fill department fields when loaded
    useEffect(() => {
        if (foundDepartment) {
            setDepartmentData((prev) => ({
                ...prev,
                id: foundDepartment.id || id,
                name: foundDepartment.name || "",
                description: foundDepartment.description || "",
                supervisorId: foundDepartment.supervisorId || null,
                teams: foundDepartment.teams || [],
            }));
        }
    }, [foundDepartment, id]);

    // Supervisor selection (role -> users)
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [supervisorSearchTerm, setSupervisorSearchTerm] = useState("");
    
    // Fetch roles first (needed before other useEffects)
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50 });
    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []));
    
    // Pre-select supervisor when data is loaded
    useEffect(() => {
        if (supervisorData && !selectedUser) {
            setSelectedUser(supervisorData);
            // Try to find and pre-select the role for this supervisor
            // We'll need to fetch users for each role to find the match
        }
    }, [supervisorData, selectedUser]);

    // Try to find the role for the supervisor by checking all roles
    useEffect(() => {
        if (selectedUser && selectedUser.id && roles.length > 0 && !selectedRole) {
            // We'll need to check each role's users to find which role this supervisor belongs to
            // This is a bit complex, so we'll just show the supervisor without a role pre-selected
            // User can still see the supervisor is selected
        }
    }, [selectedUser, roles, selectedRole]);
    const { data: roleUsersData } = useGetRoleUsersQuery(
        selectedRole ? { id: selectedRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !selectedRole }
    );
    const users = Array.isArray(roleUsersData?.value) ? roleUsersData.value : (Array.isArray(roleUsersData?.data) ? roleUsersData.data : (Array.isArray(roleUsersData) ? roleUsersData : []));

    // Filter supervisor users based on search term
    const filteredSupervisorUsers = useMemo(() => {
        if (!supervisorSearchTerm.trim()) return users || [];
        const search = supervisorSearchTerm.toLowerCase();
        return (users || []).filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [users, supervisorSearchTerm]);

    const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();

    // Handle loading and error states
    if (isLoadingDepartment) {
        return (
            <div className="w-full mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] p-8 text-center" dir={isArabic ? "rtl" : "ltr"}>
                <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">Loading department...</h3>
            </div>
        );
    }

    if (isErrorDepartment || !foundDepartment) {
        return (
            <div className="w-full mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] p-8 text-center" dir={isArabic ? "rtl" : "ltr"}>
                <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">Failed to load department</h3>
                <p className="text-[var(--sub-text-color)] mb-4">Department not found or error loading data.</p>
                <button onClick={() => navigate('/pages/admin/all-departments')} className="btn-secondary">
                    Back to Departments
                </button>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)]" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header with Breadcrumb */}
            <div className="p-6 border-b border-[var(--border-color)]">
                <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">
                    {t("departments.editDepartmentForm.title")} - {departmentData.name || foundDepartment.name || ""}
                </h1>
                <div className="flex items-center text-sm text-[var(--sub-text-color)]">
                    <span>{t("departments.editDepartmentForm.breadcrumb.allDepartments")}</span>
                    <span className={`mx-2 ${isArabic ? 'rotate-180' : ''}`}>›</span>
                    <span>{t("departments.editDepartmentForm.breadcrumb.editDepartment")}</span>
                </div>
            </div>

            <div className="p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    {/* Progress Line */}
                    <div className="relative mb-4">
                        <div className="w-full h-1 bg-[var(--border-color)] rounded" />
                        <div
                            className={`absolute top-0 h-1 gradient-bg rounded transition-all duration-300 ${isArabic ? 'right-0' : 'left-0'}`}
                            style={{ width: `${((step + 1) / 4) * 100}%` }}
                        />
                    </div>

                    {/* Step Tabs */}
                    <div className="flex justify-between">
                        {steps.map((stepItem, idx) => {
                            const IconComponent = stepItem.icon;
                            const isActive = idx === step;
                            const isCompleted = idx < step;

                            return (
                                <div
                                    key={stepItem.label}
                                    className="flex items-center"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isArabic ? 'ml-2' : 'mr-2'} ${
                                        isActive || isCompleted ? 'gradient-bg text-white' :
                                        'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                    }`}>
                                        <IconComponent size={16} />
                                    </div>
                                    <span className={`text-sm font-medium hidden sm:block ${isActive || isCompleted
                                        ? 'gradient-text'
                                        : 'text-[var(--sub-text-color)]'
                                        }`}>
                                        {stepItem.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="mt-8">
                    {step === 0 && <EditDepartmentInfoStep departmentData={departmentData} setDepartmentData={setDepartmentData} onNext={() => setStep(1)} />}
                    {step === 1 && (canAssignSupervisor || canRemoveSupervisor) && (
                        <EditAssignSupervisorStep
                            departmentData={departmentData}
                            setDepartmentData={setDepartmentData}
                            onNext={() => setStep(2)}
                            onBack={() => setStep(0)}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            roles={roles}
                            users={users}
                            isRoleOpen={isRoleOpen}
                            setIsRoleOpen={setIsRoleOpen}
                            isUserOpen={isUserOpen}
                            setIsUserOpen={setIsUserOpen}
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                            supervisorSearchTerm={supervisorSearchTerm}
                            setSupervisorSearchTerm={setSupervisorSearchTerm}
                            filteredSupervisorUsers={filteredSupervisorUsers}
                            canAssignSupervisor={canAssignSupervisor}
                            canRemoveSupervisor={canRemoveSupervisor}
                        />
                    )}
                    {step === 2 && (
                        <EditSetupTeamsStep 
                            departmentData={departmentData} 
                            setDepartmentData={setDepartmentData} 
                            onNext={() => setStep(3)} 
                            onBack={() => setStep(1)}
                            canCreateTeam={canCreateTeam}
                            canUpdateTeam={canUpdateTeam}
                            canDeleteTeam={canDeleteTeam}
                            canAddMember={canAddMember}
                            canUpdateMember={canUpdateMember}
                            canRemoveMember={canRemoveMember}
                        />
                    )}
                    {step === 3 && <EditReviewStep departmentData={departmentData} selectedUser={selectedUser} onBack={() => setStep(2)} onSubmit={async () => {
                        const supervisorId = selectedUser?.id || selectedUser?.userId || selectedUser?.userID || selectedUser?.UserId || departmentData.supervisorId;
                        const body = {
                            name: departmentData.name,
                            description: departmentData.description || "",
                            supervisorId: supervisorId || null
                        };
                        try {
                            await updateDepartment({ id, ...body }).unwrap();
                        } catch (error) {
                            throw error;
                        }
                    }} isSubmitting={isUpdating} />}
                </div>
            </div>
        </div>
    );
}

// Step 1: Edit Department Information
function EditDepartmentInfoStep({ departmentData, setDepartmentData, onNext }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();

    const handleInputChange = (field, value) => {
        setDepartmentData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("departments.editDepartmentForm.departmentInfo.departmentName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                        className="form-input w-full"
                        placeholder={t("departments.editDepartmentForm.departmentInfo.departmentName")}
                        type="text"
                        value={departmentData.name || ""}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                </div>
                {/* shortName removed */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("departments.editDepartmentForm.departmentInfo.description")}
                    </label>
                    <textarea
                        className="form-input w-full"
                        placeholder={t("departments.editDepartmentForm.departmentInfo.description")}
                        rows="4"
                        value={departmentData.description || ""}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                </div>
                {/* status removed */}
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={() => navigate('/pages/admin/all-departments')}>{t("departments.editDepartmentForm.buttons.cancel")}</button>
                <button type="button" className="btn-primary" onClick={onNext}>{t("departments.editDepartmentForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 2: Edit Assign Supervisor
function EditAssignSupervisorStep({
    onNext,
    onBack,
    selectedUser,
    setSelectedUser,
    roles,
    users,
    isRoleOpen,
    setIsRoleOpen,
    isUserOpen,
    setIsUserOpen,
    selectedRole,
    setSelectedRole,
    supervisorSearchTerm,
    setSupervisorSearchTerm,
    filteredSupervisorUsers,
    canAssignSupervisor = true,
    canRemoveSupervisor = true,
}) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const safeRoles = Array.isArray(roles) ? roles : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeFilteredUsers = Array.isArray(filteredSupervisorUsers) ? filteredSupervisorUsers : safeUsers;

    return (
        <div className="space-y-6">
            {/* Role selection */}
            <div className="relative">
                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsRoleOpen(!isRoleOpen)}>
                    <span className="text-[var(--sub-text-color)]">{selectedRole ? selectedRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} size={16} />
                </div>
                {isRoleOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {safeRoles.map((role) => (
                            <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { setSelectedRole(role); setIsRoleOpen(false); setSelectedUser(null); }}>
                                <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                            </div>
                        ))}
                        {safeRoles.length === 0 && <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>}
                    </div>
                )}
            </div>

            {/* User selection */}
            <div className="relative">
                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => selectedRole && setIsUserOpen(!isUserOpen)}>
                    <span className="text-[var(--sub-text-color)]">{selectedUser ? (selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()) : t("departments.newDepartmentForm.assignSupervisor.chooseSupervisor")}</span>
                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isUserOpen ? 'rotate-180' : ''}`} size={16} />
                </div>
                {isUserOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                        {/* Search Input */}
                        <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                <input
                                    type="text"
                                    value={supervisorSearchTerm}
                                    onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                                    placeholder={t("departments.newDepartmentForm.assignSupervisor.searchUsers") || "Search users..."}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                    onClick={(e) => e.stopPropagation()}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>
                        {/* Users List */}
                        <div className="overflow-y-auto max-h-[240px]">
                            {!selectedRole && <div className="p-3 text-[var(--sub-text-color)]">Select a role first</div>}
                            {selectedRole && safeFilteredUsers.length > 0 ? (
                                safeFilteredUsers.map((u) => (
                                    <div key={u.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { 
                                        setSelectedUser(u); 
                                        setIsUserOpen(false);
                                        setSupervisorSearchTerm("");
                                    }}>
                                        <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                        <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                    </div>
                                ))
                            ) : (
                                selectedRole && <div className="p-3 text-[var(--sub-text-color)]">
                                    {supervisorSearchTerm ? "No users found matching your search" : "No users found"}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>{t("departments.editDepartmentForm.buttons.back")}</button>
                <button type="button" className="btn-primary" onClick={onNext} disabled={!selectedUser}>{t("departments.editDepartmentForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 3: Edit Setup Teams
function EditSetupTeamsStep({ 
    departmentData, 
    setDepartmentData, 
    onNext, 
    onBack,
    canCreateTeam = true,
    canUpdateTeam = true,
    canDeleteTeam = true,
    canAddMember = true,
    canUpdateMember = true,
    canRemoveMember = true,
}) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    
    // Permission check for viewing teams
    const canViewTeams = useHasPermission('Team.View');
    const canViewMembers = useHasPermission('Team.ViewMembers');
    
    // Fetch teams from API - only if user has permission
    const { data: teamsData, isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByDepartmentQuery(departmentData.id, {
        skip: !departmentData?.id || !canViewTeams
    });
    
    const teams = useMemo(() => {
        const items = teamsData?.value || teamsData?.data || teamsData?.items || teamsData || [];
        return Array.isArray(items) ? items : [];
    }, [teamsData]);
    
    // State for add/edit team modal
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', selectedEmployees: [], teamLeader: null });
    
    // Role/user selection states
    const [leaderRole, setLeaderRole] = useState(null);
    const [membersRole, setMembersRole] = useState(null);
    const [isLeaderRoleOpen, setIsLeaderRoleOpen] = useState(false);
    const [isLeaderUserOpen, setIsLeaderUserOpen] = useState(false);
    const [isMembersRoleOpen, setIsMembersRoleOpen] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [membersSearchTerm, setMembersSearchTerm] = useState("");
    
    // API hooks
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50 });
    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []));
    
    const { data: leaderUsersData } = useGetRoleUsersQuery(
        leaderRole ? { id: leaderRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !leaderRole }
    );
    const leaderUsers = Array.isArray(leaderUsersData?.value) ? leaderUsersData.value : (Array.isArray(leaderUsersData?.data) ? leaderUsersData.data : (Array.isArray(leaderUsersData) ? leaderUsersData : []));
    
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
    
    // Fetch team members for editing
    const { data: teamUsersData } = useGetTeamUsersQuery(editingTeam?.id, {
        skip: !editingTeam?.id
    });
    
    const existingTeamMembers = useMemo(() => {
        const items = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
        return Array.isArray(items) ? items.map(item => item.user || item) : [];
    }, [teamUsersData]);
    
    const [createTeam, { isLoading: isCreatingTeam }] = useCreateTeamMutation();
    const [addUsersToTeam] = useAddUsersToTeamMutation();
    const [updateTeam, { isLoading: isUpdatingTeam }] = useUpdateTeamMutation();
    const [updateUsersInTeam] = useUpdateUsersInTeamMutation();
    const [deleteTeam, { isLoading: isDeletingTeam }] = useDeleteTeamMutation();
    
    // Initialize edit form when editingTeam changes
    useEffect(() => {
        if (editingTeam) {
            setNewTeam({
                name: editingTeam.name || '',
                description: editingTeam.description || '',
                selectedEmployees: existingTeamMembers || [],
                teamLeader: editingTeam.teamLeader || editingTeam.teamLeadUser || null
            });
        }
    }, [editingTeam, existingTeamMembers]);

    const toggleEmployee = (user, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Get user ID (try multiple property names)
        const userId = user?.id || user?.userId || user?.userID || user?.UserId || user?._id;
        
        if (!userId) {
            return;
        }
        
        setNewTeam(prev => {
            // Check if this user is already selected by comparing IDs strictly
            const isAlreadySelected = prev.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?._id;
                // Use strict comparison with string conversion to handle different types
                return String(empId) === String(userId) && empId != null && userId != null;
            });
            
            if (isAlreadySelected) {
                // Remove this user from selection - use strict filter
                const filtered = prev.selectedEmployees.filter(emp => {
                    const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?._id;
                    const shouldKeep = String(empId) !== String(userId) || empId == null || userId == null;
                    return shouldKeep;
                });
                return {
                    ...prev,
                    selectedEmployees: filtered
                };
            } else {
                // Add this user to selection - only add if not already there
                const alreadyExists = prev.selectedEmployees.some(emp => {
                    const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?._id;
                    return String(empId) === String(userId) && empId != null && userId != null;
                });
                
                if (alreadyExists) {
                    return prev;
                }
                
                return {
                    ...prev,
                    selectedEmployees: [...prev.selectedEmployees, user]
                };
            }
        });
    };

    const handleAddTeam = async () => {
        const teamName = newTeam.name?.trim();
        const teamLeader = newTeam.teamLeader;
        const teamLeadId = teamLeader?.id || teamLeader?.userId || teamLeader?.userID || teamLeader?.UserId || teamLeader?._id;
        
        if (!teamName) {
            alert('Please enter a team name');
            return;
        }
        
        if (!teamLeader || !teamLeadId) {
            alert('Please select a team leader');
            return;
        }
        
        if (!departmentData.id) {
            alert('Department ID is missing');
            return;
        }
        
        try {
            // Create team
            const res = await createTeam({
                name: teamName,
                description: newTeam.description || '',
                teamLeadId: teamLeadId,
                departmentId: departmentData.id,
            }).unwrap();
            
            const value = res?.value || res;
            const createdTeamId = value?.id;
            
            if (!createdTeamId) {
                throw new Error('Team was created but no team ID was returned');
            }
            
            // Add members if any
            if (newTeam.selectedEmployees.length > 0) {
                const userIds = newTeam.selectedEmployees.map(member => {
                    return member?.id || member?.userId || member?.userID || member?.UserId || member?.Id || member?._id;
                }).filter(Boolean);
                
                if (userIds.length > 0) {
                    await addUsersToTeam({ 
                        teamId: createdTeamId, 
                        userIds,
                        departmentId: departmentData.id
                    }).unwrap();
                }
            }
            
            // Reset form
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setLeaderRole(null);
            setMembersRole(null);
            setShowAddTeam(false);
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
            
            // Refetch teams
            refetchTeams();
            
            alert(`Team "${teamName}" created successfully!`);
        } catch (err) {
            const errorMessage = err?.data?.errorMessage || err?.message || 'Failed to create team';
            alert(errorMessage);
        }
    };
    
    const handleEditTeam = async () => {
        if (!editingTeam?.id) return;
        
        const teamName = newTeam.name?.trim();
        const teamLeader = newTeam.teamLeader;
        const teamLeadId = teamLeader?.id || teamLeader?.userId || teamLeader?.userID || teamLeader?.UserId || teamLeader?._id;
        
        if (!teamName) {
            alert('Please enter a team name');
            return;
        }
        
        if (!teamLeader || !teamLeadId) {
            alert('Please select a team leader');
            return;
        }
        
        try {
            // Update team
            await updateTeam({
                id: editingTeam.id,
                name: teamName,
                description: newTeam.description || '',
                teamLeadId: teamLeadId,
                departmentId: departmentData.id,
            }).unwrap();
            
            // Update team members using UpdateUsersInTeam (replaces all members)
            const userIds = newTeam.selectedEmployees.map(member => {
                return member?.id || member?.userId || member?.userID || member?.UserId || member?.Id || member?._id;
            }).filter(Boolean);
            
            await updateUsersInTeam({
                teamId: editingTeam.id,
                userIds,
                departmentId: departmentData.id
            }).unwrap();
            
            // Reset form
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setEditingTeam(null);
            setLeaderRole(null);
            setMembersRole(null);
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
            
            // Refetch teams
            refetchTeams();
            
            alert(`Team "${teamName}" updated successfully!`);
        } catch (err) {
            const errorMessage = err?.data?.errorMessage || err?.message || 'Failed to update team';
            alert(errorMessage);
        }
    };
    
    const handleDeleteTeam = async (teamId) => {
        if (!confirm('Are you sure you want to delete this team?')) return;
        
        try {
            // Pass both id and departmentId for proper cache invalidation
            await deleteTeam({ id: teamId, departmentId: id }).unwrap();
            refetchTeams();
            alert('Team deleted successfully!');
        } catch (err) {
            const errorMessage = err?.data?.errorMessage || err?.message || 'Failed to delete team';
            alert(errorMessage);
        }
    };
    
    const openEditModal = (team) => {
        setEditingTeam(team);
        setShowAddTeam(true);
    };
    
    const closeModal = () => {
        setShowAddTeam(false);
        setEditingTeam(null);
        setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
        setLeaderRole(null);
        setMembersRole(null);
        setLeaderSearchTerm("");
        setMembersSearchTerm("");
    };

    return (
        <div className="space-y-6">
            {/* Add New Team Form */}
            {showAddTeam && (
                <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--text-color)]">
                            {editingTeam ? 'Edit Team' : 'Add New Team'}
                        </h3>
                        <button onClick={closeModal} className="p-2 hover:bg-[var(--hover-color)] rounded-lg">
                            <X className="text-[var(--sub-text-color)]" size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className="form-input"
                            placeholder={t("departments.editDepartmentForm.setupTeams.teamName")}
                            type="text"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                        />
                        {/* Leader role/user selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                {t("departments.newDepartmentForm.setupTeams.teamLeader")} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsLeaderRoleOpen(!isLeaderRoleOpen)}>
                                    <span className="text-[var(--sub-text-color)]">{leaderRole ? leaderRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isLeaderRoleOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isLeaderRoleOpen && (
                                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
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
                                                    <div key={u.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={(e) => { 
                                                        e.stopPropagation();
                                                        setNewTeam(prev => ({ ...prev, teamLeader: u })); 
                                                        setIsLeaderUserOpen(false);
                                                        setLeaderSearchTerm("");
                                                    }}>
                                                        <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                                        <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                leaderRole && <div className="p-3 text-[var(--sub-text-color)]">
                                                    {leaderSearchTerm ? "No users found matching your search" : "No users found"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Members selection: role then users */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                Team Members <span className="text-[var(--sub-text-color)] text-xs">(Optional - Select multiple)</span>
                            </label>
                            <div className="relative">
                                <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsMembersRoleOpen(!isMembersRoleOpen)}>
                                    <span className="text-[var(--sub-text-color)]">{membersRole ? membersRole.name : "Select Role for Members"}</span>
                                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersRoleOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isMembersRoleOpen && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                <div 
                                    className="form-input cursor-pointer flex items-center justify-between" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (membersRole) {
                                            setIsMembersOpen(!isMembersOpen);
                                        } else {
                                            alert('Please select a role first');
                                        }
                                    }}
                                >
                                    <span className="text-[var(--sub-text-color)]">
                                        {newTeam.selectedEmployees.length > 0 
                                            ? `${newTeam.selectedEmployees.length} member${newTeam.selectedEmployees.length > 1 ? 's' : ''} selected` 
                                            : membersRole 
                                                ? "Click to select members (multiple allowed)" 
                                                : "Select a role first"}
                                    </span>
                                    <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isMembersOpen && membersRole && (
                                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
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
                                            {filteredMemberUsers && filteredMemberUsers.length > 0 ? (
                                                filteredMemberUsers.map(u => {
                                                    // Get user ID for comparison
                                                    const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id;
                                                    const isSelected = userId && newTeam.selectedEmployees.some(emp => {
                                                        const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?._id;
                                                        // Strict comparison with string conversion and null checks
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
                                                                toggleEmployee(u, e);
                                                            }}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="text-sm text-[var(--text-color)] font-medium">
                                                                    {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                                                                </div>
                                                                <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                                            </div>
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
                                                    {membersSearchTerm ? "No users found matching your search" : "No users found for this role"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <textarea
                        className="form-input w-full"
                        placeholder={t("departments.editDepartmentForm.setupTeams.description")}
                        rows="3"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    />
                    
                    {/* Display selected members */}
                    {newTeam.selectedEmployees && newTeam.selectedEmployees.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-[var(--text-color)]">
                                Selected Members ({newTeam.selectedEmployees.length}):
                            </div>
                            <div className="flex flex-wrap gap-2 p-3 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                                {newTeam.selectedEmployees.map((emp, idx) => (
                                    <div 
                                        key={emp.id || `emp-${idx}`} 
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
                                                toggleEmployee(emp, e);
                                            }}
                                            title="Remove member"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn-primary"
                            onClick={editingTeam ? handleEditTeam : handleAddTeam}
                            disabled={isCreatingTeam || isUpdatingTeam}
                        >
                            {isCreatingTeam || isUpdatingTeam ? 'Saving...' : (editingTeam ? 'Update Team' : t("departments.editDepartmentForm.buttons.add"))}
                        </button>
                    </div>
                </div>
            )}

            {/* Add New Team Button - Only show if user has permission */}
            {!showAddTeam && canCreateTeam && (
                <button
                    type="button"
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setShowAddTeam(true)}
                >
                    <Plus size={16} />
                    {t("departments.editDepartmentForm.setupTeams.addNewTeam")}
                </button>
            )}

            {/* Teams List */}
            {isLoadingTeams ? (
                <div className="text-center py-8">
                    <div className="text-[var(--sub-text-color)]">Loading teams...</div>
                </div>
            ) : teams.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--text-color)]">
                        Teams ({teams.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teams.map((team) => {
                            const teamLeader = team.teamLeader || team.teamLeadUser || null;
                            const teamLeaderName = teamLeader 
                                ? `${teamLeader.firstName || ''} ${teamLeader.lastName || ''}`.trim() || teamLeader.userName || teamLeader.email || 'Unknown'
                                : 'No leader';
                            
                            return (
                                <div key={team.id} className="p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center flex-shrink-0">
                                                <Users className="text-white" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[var(--text-color)] font-medium">{team.name}</div>
                                                <div className="text-[var(--sub-text-color)] text-sm mt-1">{team.description || 'No description'}</div>
                                                <div className="text-xs text-[var(--sub-text-color)] mt-1">
                                                    Lead by: <span className="font-medium">{teamLeaderName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {canUpdateTeam && (
                                                <button 
                                                    className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                                                    onClick={() => openEditModal(team)}
                                                    title="Edit team"
                                                >
                                                    <Edit className="text-[var(--sub-text-color)]" size={16} />
                                                </button>
                                            )}
                                            {canDeleteTeam && (
                                                <button 
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    disabled={isDeletingTeam}
                                                    title="Delete team"
                                                >
                                                    <Trash2 className="text-red-500" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {canViewMembers && (
                                        <div className="text-sm text-[var(--sub-text-color)] mt-2">
                                            {team.teamMembers || team.memberCount || 0} {t("departments.editDepartmentForm.setupTeams.members", "Members")}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-[var(--sub-text-color)]">No teams found. Click "Add New Team" to create one.</div>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>{t("departments.editDepartmentForm.buttons.back")}</button>
                <button type="button" className="btn-primary" onClick={onNext}>{t("departments.editDepartmentForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 4: Review & Save
function EditReviewStep({ departmentData, onBack, selectedUser, onSubmit, isSubmitting }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    const [isCompleted, setIsCompleted] = useState(false);
    
    // Permission checks
    const canViewTeams = useHasPermission('Team.View');
    const canViewMembers = useHasPermission('Team.ViewMembers');
    const handleSubmit = async () => {
        try {
            await onSubmit();
            setIsCompleted(true);
        } catch (e) {}
    };

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center">
                    <Check className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-color)] mb-2">
                    {t("departments.editDepartmentForm.success.title")}
                </h2>
                <p className="text-[var(--sub-text-color)] mb-8">
                    {t("departments.editDepartmentForm.success.message")}
                </p>
                <button type="button" className="btn-secondary" onClick={() => navigate('/pages/admin/all-departments')}>
                    {t("departments.editDepartmentForm.buttons.allDepartments")}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold text-[var(--text-color)]">
                {t("departments.editDepartmentForm.review.reviewDepartmentDetails")}
            </h2>

            {/* Department Information */}
            <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">
                            {t("departments.editDepartmentForm.review.departmentName")}:
                        </span>
                        <div className="text-[var(--text-color)] font-medium">{departmentData.name}</div>
                    </div>
                    
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">
                            {t("departments.editDepartmentForm.review.description")}:
                        </span>
                        <div className="text-[var(--text-color)] font-medium">{departmentData.description}</div>
                    </div>
                </div>
            </div>

            {/* Supervisor */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                    {t("departments.editDepartmentForm.review.supervisor")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser ? (
                        <div className="flex items-center gap-3 p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                            <img src="/assets/navbar/Avatar.png" alt={selectedUser.name || selectedUser.email} className="w-10 h-10 rounded-full" />
                            <div>
                                <div className="text-[var(--text-color)] font-medium">{selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}</div>
                                <div className="text-[var(--sub-text-color)] text-sm">{selectedUser.email || selectedUser.username}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[var(--sub-text-color)]">No supervisor selected</div>
                    )}
                </div>
            </div>

            {/* Teams - Only show if user has Team.View permission */}
            {canViewTeams && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--text-color)]">Teams</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departmentData.teams.map((team, index) => {
                            const teamId = team.id || `team-${index}`;
                            return (
                            <div key={teamId} className="p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                                        <Users className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[var(--text-color)] font-medium">{team.name}</div>
                                        <div className="text-[var(--sub-text-color)] text-sm">{team.description}</div>
                                    </div>
                                </div>
                                {canViewMembers && (
                                    <span className="text-[var(--sub-text-color)] text-sm">
                                        {(() => {
                                            // Count members: team leader (1) + employees (selectedEmployees.length)
                                            const teamLeaderCount = team.teamLeader ? 1 : 0;
                                            const employeesCount = team.selectedEmployees?.length || 0;
                                            return (teamLeaderCount + employeesCount) || team.members || 0;
                                        })()} {t("departments.editDepartmentForm.setupTeams.members")}
                                    </span>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    {t("departments.editDepartmentForm.buttons.back")}
                </button>
                <button 
                    type="button" 
                    className="btn-primary flex items-center gap-2" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            {t("departments.editDepartmentForm.buttons.save")}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
