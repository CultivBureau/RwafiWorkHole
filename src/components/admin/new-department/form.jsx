import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, Users, UserCheck, Eye, ChevronDown, X, Plus, Check, Search } from "lucide-react";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../services/apis/RoleApi";
import { useCreateDepartmentMutation, useAssignSupervisorMutation } from "../../../services/apis/DepartmentApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation } from "../../../services/apis/TeamApi";

export default function NewDepartmentForm() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [departmentInfo, setDepartmentInfo] = useState({ departmentName: '', description: '' });
    const [supervisor, setSupervisor] = useState(null);
    const [teams, setTeams] = useState([]);

    const steps = [
        { label: t("departments.newDepartmentForm.steps.departmentInfo"), icon: Building2 },
        { label: t("departments.newDepartmentForm.steps.assignSupervisor"), icon: UserCheck },
        { label: t("departments.newDepartmentForm.steps.setupTeams"), icon: Users },
        { label: t("departments.newDepartmentForm.steps.reviewAndDone"), icon: Eye },
    ];

    return (
        <div className="w-full mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)]" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)]">
                <h1
                    className={`text-2xl font-bold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                >
                    {t("departments.newDepartmentForm.title")}
                </h1>

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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isArabic ? 'ml-2' : 'mr-2'} ${isActive || isCompleted ? 'gradient-bg text-white' :
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
                    {step === 0 && (
                        <DepartmentInfoStep
                            value={departmentInfo}
                            onChange={setDepartmentInfo}
                            onNext={() => setStep(1)}
                        />
                    )}
                    {step === 1 && (
                        <AssignSupervisorStep
                            selectedUser={supervisor}
                            setSelectedUser={setSupervisor}
                            onNext={() => setStep(2)}
                            onBack={() => setStep(0)}
                        />
                    )}
                    {step === 2 && (
                        <SetupTeamsStep
                            teams={teams}
                            setTeams={setTeams}
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                        />
                    )}
                    {step === 3 && (
                        <ReviewStep
                            departmentInfo={departmentInfo}
                            supervisor={supervisor}
                            teams={teams}
                            onBack={() => setStep(2)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Step 1: Department Information
function DepartmentInfoStep({ onNext, value, onChange }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    const [formData, setFormData] = useState(value || { departmentName: '', description: '' });
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // propagate up when formData changes
    React.useEffect(() => {
        onChange && onChange(formData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    const handleNext = () => {
        // Validate department name
        if (!formData.departmentName || !formData.departmentName.trim()) {
            setErrors({
                departmentName: t("departments.newDepartmentForm.validation.departmentNameRequired") || "Department name is required"
            });
            return;
        }
        // Clear errors and proceed
        setErrors({});
        onNext();
    };

    const isFormValid = formData.departmentName && formData.departmentName.trim().length > 0;

    return (
        <div className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <input
                        className={`form-input ${errors.departmentName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("departments.newDepartmentForm.departmentInfo.departmentName")}
                        type="text"
                        value={formData.departmentName}
                        onChange={(e) => handleInputChange('departmentName', e.target.value)}
                    />
                    {errors.departmentName && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.departmentName}
                        </p>
                    )}
                </div>
                {/* shortName removed per API schema */}
                <textarea
                    className="form-input md:col-span-1"
                    placeholder={t("departments.newDepartmentForm.departmentInfo.description")}
                    rows="4"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                />
                {/* status field removed per request */}
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={() => navigate('/pages/admin/all-departments')}>{t("departments.newDepartmentForm.buttons.cancel")}</button>
                <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleNext}
                    disabled={!isFormValid}
                    style={{
                        opacity: !isFormValid ? 0.6 : 1,
                        cursor: !isFormValid ? 'not-allowed' : 'pointer'
                    }}
                    title={!isFormValid ? (t("departments.newDepartmentForm.validation.departmentNameRequired") || "Please enter a department name") : ''}
                >
                    {t("departments.newDepartmentForm.buttons.next")}
                </button>
            </div>
        </div>
    );
}

// Step 2: Assign Supervisor
function AssignSupervisorStep({ onNext, onBack, selectedUser, setSelectedUser }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isUserOpen, setIsUserOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [supervisorSearchTerm, setSupervisorSearchTerm] = useState("");
    // selectedUser managed by parent

    const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles, refetch: refetchRoles } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50 });
    const { data: roleUsersData, isLoading: isLoadingUsers, isError: isErrorUsers, refetch: refetchUsers } = useGetRoleUsersQuery(
        selectedRole ? { id: selectedRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !selectedRole }
    );

    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData?.items) ? rolesData.items : (Array.isArray(rolesData) ? rolesData : [])));
    const users = Array.isArray(roleUsersData?.value) ? roleUsersData.value : (Array.isArray(roleUsersData?.data) ? roleUsersData.data : (Array.isArray(roleUsersData?.items) ? roleUsersData.items : (Array.isArray(roleUsersData) ? roleUsersData : [])));

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
                        {isLoadingRoles && <div className="p-3 text-[var(--sub-text-color)]">Loading roles...</div>}
                        {isErrorRoles && (
                            <div className="p-3 text-[var(--sub-text-color)] flex items-center justify-between">
                                <span>Failed to load roles</span>
                                <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); refetchRoles(); }}>Retry</button>
                            </div>
                        )}
                        {roles.map((role) => (
                            <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { setSelectedRole(role); setIsRoleOpen(false); setSelectedUser(null); }}>
                                <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                            </div>
                        ))}
                        {roles.length === 0 && !isLoadingRoles && !isErrorRoles && (
                            <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>
                        )}
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
                            {selectedRole && isLoadingUsers && <div className="p-3 text-[var(--sub-text-color)]">Loading users...</div>}
                            {selectedRole && isErrorUsers && (
                                <div className="p-3 text-[var(--sub-text-color)] flex items-center justify-between">
                                    <span>Failed to load users</span>
                                    <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); refetchUsers(); }}>Retry</button>
                                </div>
                            )}
                            {selectedRole && !isLoadingUsers && !isErrorUsers && filteredSupervisorUsers.length > 0 ? (
                                filteredSupervisorUsers.map((u, index) => {
                                    const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id || `user-${index}`;
                                    return (
                                        <div key={userId} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={() => { 
                                            setSelectedUser(u); 
                                            setIsUserOpen(false);
                                            setSupervisorSearchTerm("");
                                        }}>
                                            <div className="text-sm text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                            <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                        </div>
                                    );
                                })
                            ) : (
                                selectedRole && !isLoadingUsers && !isErrorUsers && (
                                    <div className="p-3 text-[var(--sub-text-color)]">
                                        {supervisorSearchTerm ? "No users found matching your search" : "No users found for this role"}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>{t("departments.newDepartmentForm.buttons.back")}</button>
                <button type="button" className="btn-primary" onClick={onNext} disabled={!selectedUser}>{t("departments.newDepartmentForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 3: Setup Teams
function SetupTeamsStep({ onNext, onBack, teams, setTeams }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', description: '', teamLeader: null, role: null, selectedEmployees: [] });
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [membersRole, setMembersRole] = useState(null);
    const [isMembersRoleOpen, setIsMembersRoleOpen] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [leaderSearchTerm, setLeaderSearchTerm] = useState("");
    const [membersSearchTerm, setMembersSearchTerm] = useState("");

    // Role and user hooks for team leader selection
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50 });
    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []));
    const { data: roleUsersData } = useGetRoleUsersQuery(
        newTeam.role ? { id: newTeam.role.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !newTeam.role }
    );
    const users = Array.isArray(roleUsersData?.value) ? roleUsersData.value : (Array.isArray(roleUsersData?.data) ? roleUsersData.data : (Array.isArray(roleUsersData) ? roleUsersData : []));

    // Role and users for team members selection
    const { data: membersUsersData } = useGetRoleUsersQuery(
        membersRole ? { id: membersRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !membersRole }
    );
    const memberUsers = Array.isArray(membersUsersData?.value) ? membersUsersData.value : (Array.isArray(membersUsersData?.data) ? membersUsersData.data : (Array.isArray(membersUsersData) ? membersUsersData : []));

    // Filter leader users based on search term
    const filteredLeaderUsers = useMemo(() => {
        if (!leaderSearchTerm.trim()) return users || [];
        const search = leaderSearchTerm.toLowerCase();
        return (users || []).filter(u => {
            const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()).toLowerCase();
            const email = (u.email || '').toLowerCase();
            const username = (u.username || '').toLowerCase();
            return name.includes(search) || email.includes(search) || username.includes(search);
        });
    }, [users, leaderSearchTerm]);

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

    const selectTeamLeader = (leader) => {
        setNewTeam(prev => ({
            ...prev,
            teamLeader: leader
        }));
        setIsUserDropdownOpen(false);
    };

    const toggleEmployee = (employee, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Get employee ID (try multiple property names)
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
                const filtered = prev.selectedEmployees.filter(emp => {
                    const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
                    const shouldKeep = String(empId) !== String(employeeId) || empId == null || employeeId == null;
                    return shouldKeep;
                });
                return {
                    ...prev,
                    selectedEmployees: filtered
                };
            } else {
                // Add this employee to selection
                const updated = [...prev.selectedEmployees, employee];
                return {
                    ...prev,
                    selectedEmployees: updated
                };
            }
        });
    };

    const addTeam = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Check for team leader - if object exists, we'll extract ID later when creating team
        const hasTeamLeader = !!newTeam.teamLeader;
        
        // Check for team leader ID in multiple possible property names
        const teamLeadId = newTeam.teamLeader?.id || 
                          newTeam.teamLeader?.userId || 
                          newTeam.teamLeader?.userID || 
                          newTeam.teamLeader?.UserId ||
                          newTeam.teamLeader?._id;
        
        // Validate: name is required, teamLeader object must exist
        if (newTeam.name.trim() && hasTeamLeader) {
            const teamToAdd = {
                id: Date.now(),
                name: newTeam.name,
                description: newTeam.description || '',
                teamLeader: newTeam.teamLeader,
                selectedEmployees: newTeam.selectedEmployees || [],
                // Count members: team leader (1) + employees (selectedEmployees.length)
                members: (newTeam.teamLeader ? 1 : 0) + (newTeam.selectedEmployees || []).length
            };
            setTeams(prev => [...prev, teamToAdd]);
            setNewTeam({ name: '', description: '', teamLeader: null, role: null, selectedEmployees: [] });
            setMembersRole(null);
            setShowAddTeam(false);
            setLeaderSearchTerm("");
            setMembersSearchTerm("");
        } else {
            let errorMsg = 'Cannot add team. Please ensure:\n';
            if (!newTeam.name.trim()) errorMsg += '- Team name is entered\n';
            if (!hasTeamLeader) errorMsg += '- Team leader is selected\n';
            alert(errorMsg);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add New Team Form */}
            {showAddTeam && (
                <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                {t("departments.newDepartmentForm.setupTeams.teamName")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="form-input w-full"
                                placeholder={t("departments.newDepartmentForm.setupTeams.teamName")}
                                type="text"
                                value={newTeam.name}
                                onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                    {/* Team Leader Selection: Role then User */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            {t("departments.newDepartmentForm.setupTeams.teamLeader")} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                        <div className="relative">
                            <div
                                className="form-input cursor-pointer flex items-center justify-between"
                                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                            >
                                <span className="text-[var(--sub-text-color)]">{newTeam.role ? newTeam.role.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>
                            {isRoleDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {(Array.isArray(roles) ? roles : []).map(role => (
                                        <div key={role.id} className="p-3 hover:bg-[var(--hover-color)] cursor-pointer" onClick={(e) => { 
                                            e.stopPropagation();
                                            setNewTeam(prev => ({ ...prev, role, teamLeader: null })); 
                                            setIsRoleDropdownOpen(false); 
                                        }}>
                                            <div className="text-sm text-[var(--text-color)]">{role.name}</div>
                                        </div>
                                    ))}
                                    {(!roles || roles.length === 0) && <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>}
                                </div>
                            )}
                        </div>

                        {/* Users for selected role */}
                        <div className="relative">
                            <div
                                className="form-input cursor-pointer flex items-center justify-between"
                                onClick={() => newTeam.role && setIsUserDropdownOpen(!isUserDropdownOpen)}
                            >
                                <span className="text-[var(--sub-text-color)]">{newTeam.teamLeader ? (newTeam.teamLeader.name || `${newTeam.teamLeader.firstName || ''} ${newTeam.teamLeader.lastName || ''}`.trim()) : t("departments.newDepartmentForm.setupTeams.chooseTeamLeader") || "Choose team leader"}</span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>
                            {isUserDropdownOpen && newTeam.role && (
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
                                                {leaderSearchTerm ? "No users found matching your search" : "No users found"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>
                    </div>

                    {/* Team Members multi-select (choose role then users) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            Team Members <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                            <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsMembersRoleOpen(!isMembersRoleOpen)}>
                                <span className="text-[var(--sub-text-color)]">{membersRole ? membersRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}</span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isMembersRoleOpen ? 'rotate-180' : ''}`} size={16} />
                            </div>
                            {isMembersRoleOpen && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                                                    const empId = emp?.id || emp?.userId || emp?.userID || emp?.UserId || emp?.Id || emp?._id;
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
                                                    <div>
                                                        <div className="text-sm text-[var(--text-color)] font-medium">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
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
                                                {membersSearchTerm ? "No users found matching your search" : "No users found"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Display selected members */}
                        {newTeam.selectedEmployees && newTeam.selectedEmployees.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-[var(--text-color)]">
                                    Selected Members ({newTeam.selectedEmployees.length}):
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                                    {newTeam.selectedEmployees.map((emp, idx) => {
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
                                                        toggleEmployee(emp, e);
                                                    }}
                                                    title="Remove member"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Team Description - Full Width */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                            {t("departments.newDepartmentForm.setupTeams.description")} <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                        </label>
                        <textarea
                            className="form-input w-full"
                            placeholder={t("departments.newDepartmentForm.setupTeams.description")}
                            rows="3"
                            value={newTeam.description}
                            onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowAddTeam(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={addTeam}
                            style={{
                                opacity: (!newTeam.name.trim() || !newTeam.teamLeader) ? 0.6 : 1,
                            }}
                            title={(!newTeam.name.trim() || !newTeam.teamLeader) ? 'Please fill in team name and select a team leader' : ''}
                        >
                            {t("departments.newDepartmentForm.buttons.add")}
                        </button>
                    </div>
                </div>
            )}

            {/* Add New Team Button */}
            {!showAddTeam && (
                <button
                    type="button"
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setShowAddTeam(true)}
                >
                    <Plus size={16} />
                    {t("departments.newDepartmentForm.setupTeams.addNewTeam")}
                </button>
            )}

            {/* Teams List */}
            {teams.length > 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teams.map((team, index) => {
                            const teamId = team.id || `team-${index}`;
                            return (
                            <div key={teamId} className="p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                                            <Users className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[var(--text-color)] font-medium">{team.name}</div>
                                            <div className="text-[var(--sub-text-color)] text-sm">{team.description}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--sub-text-color)]">
                                        <span className="text-sm">
                                            {(() => {
                                                // Count members: team leader (1) + employees (selectedEmployees.length)
                                                const teamLeaderCount = team.teamLeader ? 1 : 0;
                                                const employeesCount = team.selectedEmployees?.length || 0;
                                                const totalCount = teamLeaderCount + employeesCount;
                                                const pluralText = totalCount !== 1 ? t("departments.newDepartmentForm.setupTeams.membersCountPlural", "s") : t("departments.newDepartmentForm.setupTeams.membersCountSingular", "");
                                                return t("departments.newDepartmentForm.setupTeams.membersCount", { count: totalCount, plural: pluralText });
                                            })()}
                                        </span>
                                        <ChevronDown size={16} />
                                    </div>
                                </div>

                                {/* Team Leader Info */}
                                {team.teamLeader && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                                        <img
                                            src={team.teamLeader.avatar || "/assets/navbar/Avatar.png"}
                                            alt={team.teamLeader.name}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs text-[var(--sub-text-color)]">{t("departments.newDepartmentForm.setupTeams.teamLeader")}</div>
                                            <div className="text-sm font-medium text-[var(--text-color)]">{(team.teamLeader?.name || `${team.teamLeader?.firstName || ''} ${team.teamLeader?.lastName || ''}`.trim())}</div>
                                        </div>
                                        <UserCheck className="text-[var(--accent-color)]" size={16} />
                                    </div>
                                )}
                                {/* Display selected members */}
                                {team.selectedEmployees && team.selectedEmployees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
                                        <span className="text-xs text-[var(--sub-text-color)] w-full">{t("departments.newDepartmentForm.setupTeams.membersLabel")}</span>
                                        {team.selectedEmployees.map((emp, idx) => {
                                            const empId = emp.id || emp.userId || emp.userID || emp.Id || `emp-${idx}`;
                                            return (
                                                <div key={empId} className="flex items-center gap-1 px-2 py-1 bg-[var(--container-color)] rounded-lg text-xs">
                                                    <span className="text-[var(--text-color)]">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>{t("departments.newDepartmentForm.buttons.back")}</button>
                <button type="button" className="btn-primary" onClick={onNext}>{t("departments.newDepartmentForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 4: Review & Done
function ReviewStep({ onBack, departmentInfo, supervisor, teams }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [createDepartment] = useCreateDepartmentMutation();
    const [assignSupervisor] = useAssignSupervisorMutation();
    const [createTeam] = useCreateTeamMutation();
    const [addUsersToTeam] = useAddUsersToTeamMutation();

    const departmentData = departmentInfo || { departmentName: '', description: '' };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            // Create department
            const supervisorId = supervisor?.id || supervisor?.userId || supervisor?.userID || supervisor?.UserId;
            const payload = {
                name: departmentData.departmentName,
                description: departmentData.description,
                supervisorId: supervisorId,
            };
            const depRes = await createDepartment(payload).unwrap();
            const createdDepartment = depRes?.value || depRes;
            const departmentId = createdDepartment?.id;

            // Create teams (optional)
            if (departmentId && Array.isArray(teams) && teams.length > 0) {
                for (const team of teams) {
                    // Extract team leader ID (try multiple property names)
                    const teamLeadId = team.teamLeader?.id || 
                                      team.teamLeader?.userId || 
                                      team.teamLeader?.userID || 
                                      team.teamLeader?.UserId ||
                                      team.teamLeader?._id;
                    
                    if (!teamLeadId) {
                        continue; // Skip teams without a leader
                    }
                    const teamPayload = {
                        name: team.name,
                        description: team.description || '',
                        teamLeadId,
                        departmentId,
                    };
                    
                    try { 
                        // STEP 1: Create the team first using /api/v1/Team/Create
                        const teamResult = await createTeam(teamPayload).unwrap();
                        const createdTeam = teamResult?.value || teamResult;
                        const createdTeamId = createdTeam?.id;
                        
                        if (!createdTeamId) {
                            throw new Error('Team was created but no team ID was returned');
                        }

                        // STEP 2: Add team members using /api/v1/Team/AddUsersToTeam/{teamId}/users (plural - accepts array)
                        if (createdTeamId && Array.isArray(team.selectedEmployees) && team.selectedEmployees.length > 0) {
                            // Extract all userIds from selected employees
                            const userIds = team.selectedEmployees.map(member => {
                                const memberId = member?.id || 
                                                member?.userId || 
                                                member?.userID || 
                                                member?.UserId ||
                                                member?.Id ||
                                                member?._id;
                                return memberId;
                            }).filter(Boolean); // Remove any null/undefined values
                            
                            if (userIds.length === 0) {
                                alert(`Warning: Team "${team.name}" was created but no valid user IDs found in selected members.`);
                            } else {
                                try {
                                    await addUsersToTeam({ 
                                        teamId: createdTeamId, 
                                        userIds,
                                        departmentId: departmentId
                                    }).unwrap();
                                } catch (addUsersError) {
                                    const errorMsg = addUsersError?.data?.errorMessage || 
                                                   addUsersError?.data?.message || 
                                                   addUsersError?.message || 
                                                   'Unknown error';
                                    alert(`Warning: Team "${team.name}" was created but failed to add members: ${errorMsg}`);
                                }
                            }
                        }
                    } catch (err) {
                        // Continue with other teams even if one fails
                        throw err; // Re-throw to stop the process if team creation fails
                    }
                }
            }

            // Fallback: if backend didn't set supervisor, assign explicitly
            if (departmentId && supervisorId) {
                try { await assignSupervisor({ id: departmentId, userId: supervisorId }).unwrap(); } catch {}
            }

            setIsSubmitting(false);
            setIsCompleted(true);
        } catch (e) {
            setIsSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center">
                    <Check className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-color)] mb-2">
                    {t("departments.newDepartmentForm.success.title")}
                </h2>
                <p className="text-[var(--sub-text-color)] mb-8">
                    {t("departments.newDepartmentForm.success.message")}
                </p>
                <button type="button" className="btn-secondary" onClick={() => window.location.href = '/pages/admin/all-departments'}>
                    {t("departments.newDepartmentForm.buttons.allDepartments")}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold text-[var(--text-color)]">
                {t("departments.newDepartmentForm.review.reviewDepartmentDetails")}
            </h2>

            {/* Department Information */}
            <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">
                            {t("departments.newDepartmentForm.review.departmentName")}:
                        </span>
                        <div className="text-[var(--text-color)] font-medium">{departmentData.departmentName}</div>
                    </div>
                    
                    
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">
                            {t("departments.newDepartmentForm.review.description")}:
                        </span>
                        <div className="text-[var(--text-color)] font-medium">{departmentData.description}</div>
                    </div>
                </div>
            </div>

            {/* Supervisor */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                    {t("departments.newDepartmentForm.review.supervisor")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supervisor ? (
                        <div className="flex items-center gap-3 p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                            <img src="/assets/navbar/Avatar.png" alt={supervisor.name || supervisor.email} className="w-10 h-10 rounded-full" />
                            <div>
                                <div className="text-[var(--text-color)] font-medium">{supervisor.name || `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim()}</div>
                                <div className="text-[var(--sub-text-color)] text-sm">{supervisor.email || supervisor.username}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-[var(--sub-text-color)]">No supervisor selected</div>
                    )}
                </div>
            </div>

            {/* Teams */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">Teams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team, index) => {
                        const teamId = team.id || `team-${index}`;
                        return (
                        <div key={teamId} className="p-4 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                                        <Users className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[var(--text-color)] font-medium">{team.name}</div>
                                        <div className="text-[var(--sub-text-color)] text-sm">{team.description}</div>
                                    </div>
                                </div>
                                <span className="text-[var(--sub-text-color)] text-sm">
                                    {(() => {
                                        // Count members: team leader (1) + employees (selectedEmployees.length)
                                        const teamLeaderCount = team.teamLeader ? 1 : 0;
                                        const employeesCount = team.selectedEmployees?.length || 0;
                                        const totalCount = teamLeaderCount + employeesCount;
                                        const pluralText = totalCount !== 1 ? t("departments.newDepartmentForm.setupTeams.membersCountPlural", "s") : t("departments.newDepartmentForm.setupTeams.membersCountSingular", "");
                                        return t("departments.newDepartmentForm.setupTeams.membersCount", { count: totalCount, plural: pluralText });
                                    })()}
                                </span>
                            </div>

                            {/* Team Leader Info */}
                            {team.teamLeader && (
                                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                                    <img
                                        src="/assets/navbar/Avatar.png"
                                        alt={(team.teamLeader?.name || `${team.teamLeader?.firstName || ''} ${team.teamLeader?.lastName || ''}`.trim())}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <div className="flex-1">
                                        <div className="text-xs text-[var(--sub-text-color)]">{t("departments.newDepartmentForm.setupTeams.teamLeader")}</div>
                                        <div className="text-sm font-medium text-[var(--text-color)]">{(team.teamLeader?.name || `${team.teamLeader?.firstName || ''} ${team.teamLeader?.lastName || ''}`.trim())}</div>
                                    </div>
                                    <UserCheck className="text-[var(--accent-color)]" size={16} />
                                </div>
                            )}
                            {/* Display selected members */}
                            {team.selectedEmployees && team.selectedEmployees.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[var(--border-color)]">
                                    <span className="text-xs text-[var(--sub-text-color)] w-full">{t("departments.newDepartmentForm.setupTeams.membersLabel")}</span>
                                    {team.selectedEmployees.map((emp, idx) => {
                                        const empId = emp.id || emp.userId || emp.userID || emp.Id || `emp-${idx}`;
                                        return (
                                            <div key={empId} className="flex items-center gap-1 px-2 py-1 bg-[var(--container-color)] rounded-lg text-xs">
                                                <span className="text-[var(--text-color)]">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    {t("departments.newDepartmentForm.buttons.back")}
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
                            <span>Creating...</span>
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
    );
}
