import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Users, UserCheck, Eye, ChevronDown, X, Plus, Check, Save, Edit, Trash2, Search, Sparkles } from "lucide-react";
import { useGetDepartmentByIdQuery, useGetDepartmentSupervisorQuery, useUpdateDepartmentMutation } from "../../../../services/apis/DepartmentApi";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../../services/apis/RoleApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation, useGetTeamsByDepartmentQuery, useUpdateTeamMutation, useDeleteTeamMutation, useUpdateUsersInTeamMutation, useGetTeamUsersQuery } from "../../../../services/apis/TeamApi";
import { useHasPermission } from "../../../../hooks/useHasPermission";
import TeamFormEmbedded from "../../new-department/team-form-embedded";
import toast from "react-hot-toast";

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

    const [departmentData, setDepartmentData] = useState({
        id,
        name: "",
        description: "",
        supervisorId: null,
        supervisor: null,
        supervisorName: "",
        supervisorEmail: "",
        supervisorFirstName: "",
        supervisorLastName: "",
        supervisorRoleId: null,
        supervisorRoleName: "",
        supervisorRole: null,
        teams: [],
    });
    
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
                supervisor: foundDepartment.supervisor || prev.supervisor || null,
                supervisorName: foundDepartment.supervisor?.name || foundDepartment.supervisorName || prev.supervisorName || "",
                supervisorEmail: foundDepartment.supervisor?.email || foundDepartment.supervisorEmail || prev.supervisorEmail || "",
                supervisorFirstName: foundDepartment.supervisor?.firstName || foundDepartment.supervisorFirstName || prev.supervisorFirstName || "",
                supervisorLastName: foundDepartment.supervisor?.lastName || foundDepartment.supervisorLastName || prev.supervisorLastName || "",
                supervisorRoleId: foundDepartment.supervisorRoleId || prev.supervisorRoleId || null,
                supervisorRoleName: foundDepartment.supervisorRoleName || prev.supervisorRoleName || "",
                supervisorRole: foundDepartment.supervisorRole || prev.supervisorRole || null,
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
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50, status: 0 });
    const roles = Array.isArray(rolesData?.value) ? rolesData.value : (Array.isArray(rolesData?.data) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []));
    
    // Pre-select supervisor when data is loaded
    useEffect(() => {
        if (selectedUser) return;
        const fallbackSupervisor =
            supervisorData ||
            departmentData.supervisor ||
            (departmentData.supervisorId
                ? {
                      id: departmentData.supervisorId,
                      name: departmentData.supervisorName || `${departmentData.supervisorFirstName || ""} ${departmentData.supervisorLastName || ""}`.trim() || "Current Supervisor",
                      email: departmentData.supervisorEmail || "",
                      firstName: departmentData.supervisorFirstName,
                      lastName: departmentData.supervisorLastName,
                  }
                : null);
        if (fallbackSupervisor) {
            setSelectedUser(fallbackSupervisor);
        }
    }, [supervisorData, departmentData.supervisor, departmentData.supervisorId, departmentData.supervisorName, departmentData.supervisorEmail, departmentData.supervisorFirstName, departmentData.supervisorLastName, selectedUser]);

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
        <div className="w-full mx-auto bg-[var(--bg-color)] rounded-2xl border-2 border-[var(--border-color)] shadow-xl overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>
            {/* Hero Header */}
            <div className="relative bg-gradient-to-r from-[#15919B] via-[#09D1C7] to-[#15919B] p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className={`absolute ${isArabic ? '-left-10' : '-right-10'} -top-14 w-48 h-48 bg-white rounded-full blur-3xl`}></div>
                    <div className={`absolute ${isArabic ? '-right-10' : '-left-10'} -bottom-14 w-48 h-48 bg-white rounded-full blur-3xl`}></div>
                </div>
                <div className={`relative flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <div className={`flex items-center gap-2 mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <Sparkles className="text-white/80 w-4 h-4" />
                            <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                                {t("departments.editDepartmentForm.subtitle", "Department Management")}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            {t("departments.editDepartmentForm.title")} • {departmentData.name || foundDepartment.name || ""}
                </h1>
                        <p className="text-white/70 text-sm mt-1">
                            {t("departments.editDepartmentForm.description", "Update the structure, supervisor, and teams for this department.")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="relative mb-6">
                        <div className="w-full h-2 bg-[var(--border-color)]/80 rounded-full" />
                        <div
                            className={`absolute top-0 h-2 bg-gradient-to-r from-[#15919B] to-[#09D1C7] rounded-full transition-all duration-500 ${isArabic ? 'right-0' : 'left-0'}`}
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    <div className="flex justify-between">
                        {steps.map((stepItem, idx) => {
                            const IconComponent = stepItem.icon;
                            const isActive = idx === step;
                            const isCompleted = idx < step;

                            return (
                                <div key={stepItem.label} className="flex items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isArabic ? 'ml-2' : 'mr-2'} ${
                                            isActive || isCompleted
                                                ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white shadow-lg scale-110'
                                                : 'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                        }`}
                                    >
                                        <IconComponent size={18} />
                                    </div>
                                    <span
                                        className={`text-sm font-semibold hidden sm:block transition-colors duration-300 ${
                                            isActive || isCompleted
                                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#15919B] to-[#09D1C7]'
                                        : 'text-[var(--sub-text-color)]'
                                        }`}
                                    >
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
                        <EditDepartmentInfoStep
                            departmentData={departmentData}
                            setDepartmentData={setDepartmentData}
                            onNext={() => setStep(1)}
                        />
                    )}
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
                    {step === 3 && (
                        <EditReviewStep
                            departmentData={departmentData}
                            selectedUser={selectedUser}
                            onBack={() => setStep(2)}
                            onSubmit={async () => {
                                const supervisorId =
                                    selectedUser?.id ||
                                    selectedUser?.userId ||
                                    selectedUser?.userID ||
                                    selectedUser?.UserId ||
                                    departmentData.supervisorId;
                        const body = {
                            name: departmentData.name,
                            description: departmentData.description || "",
                                    supervisorId: supervisorId || null,
                        };
                        try {
                            await updateDepartment({ id, ...body }).unwrap();
                        } catch (error) {
                            throw error;
                        }
                            }}
                            isSubmitting={isUpdating}
                        />
                    )}
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
            <div className="p-6 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.editDepartmentForm.departmentInfo.departmentName")} <span className="text-[var(--error-color)]">*</span>
                    </label>
                    <input
                            className={`w-full px-4 py-3 border-2 rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 transition-all ${
                                departmentData.name?.trim()
                                    ? 'border-[#15919B]/40 focus:border-[#15919B] focus:ring-[#15919B]/20'
                                    : 'border-[var(--border-color)] focus:border-[#15919B]/60 focus:ring-[#15919B]/10'
                            }`}
                        placeholder={t("departments.editDepartmentForm.departmentInfo.departmentName")}
                        type="text"
                        value={departmentData.name || ""}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                            dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>
                <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t("departments.editDepartmentForm.departmentInfo.description")}
                    </label>
                    <textarea
                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] resize-none transition-all"
                        placeholder={t("departments.editDepartmentForm.departmentInfo.description")}
                        rows="4"
                        value={departmentData.description || ""}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                            dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>
                </div>
            </div>

            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-4 border-t border-[var(--border-color)]`}>
                <button
                    type="button"
                    className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] transition-all duration-200"
                    onClick={() => navigate('/pages/admin/all-departments')}
                >
                    {t("departments.editDepartmentForm.buttons.cancel")}
                </button>
                <button
                    type="button"
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        departmentData.name?.trim()
                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white hover:shadow-lg hover:scale-105'
                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)] border-2 border-[var(--border-color)] cursor-not-allowed opacity-60'
                    }`}
                    onClick={onNext}
                    disabled={!departmentData.name?.trim()}
                >
                    {t("departments.editDepartmentForm.buttons.next")}
                </button>
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
    departmentData,
}) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const safeRoles = Array.isArray(roles) ? roles : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeFilteredUsers = Array.isArray(filteredSupervisorUsers) ? filteredSupervisorUsers : safeUsers;

    useEffect(() => {
        if (!selectedUser || selectedRole || safeRoles.length === 0) return;

        const roleIds = new Set();
        const roleNames = new Set();

        const addId = (val) => {
            if (val !== undefined && val !== null && val !== "") {
                roleIds.add(String(val).toLowerCase());
            }
        };
        const addName = (val) => {
            if (typeof val === "string" && val.trim()) {
                roleNames.add(val.trim().toLowerCase());
            }
        };

        const addFromRoleObject = (roleObj) => {
            if (!roleObj) return;
            addId(roleObj.id || roleObj.roleId || roleObj.roleID || roleObj.Id);
            addName(roleObj.name || roleObj.roleName);
        };

        const addFromCollection = (collection) => {
            if (!Array.isArray(collection)) return;
            collection.forEach((item) => {
                if (!item) return;
                if (typeof item === "string") {
                    addName(item);
                } else if (typeof item === "object") {
                    addFromRoleObject(item);
                }
            });
        };

        // from selected user
        addId(selectedUser?.roleId || selectedUser?.RoleId || selectedUser?.roleID || selectedUser?.RoleID);
        addName(selectedUser?.roleName || selectedUser?.RoleName);
        addFromRoleObject(selectedUser?.role);
        addFromCollection(selectedUser?.roles);
        addFromCollection(selectedUser?.userRoles);
        addFromCollection(selectedUser?.roleAssignments);

        // from departmentData fallback
        addId(departmentData?.supervisorRoleId || departmentData?.supervisorRoleID);
        addFromRoleObject(departmentData?.supervisorRole);
        addName(departmentData?.supervisorRoleName);

        if (roleIds.size === 0 && roleNames.size === 0) return;

        const matchedRole = safeRoles.find((role) => {
            const roleId = role.id || role.roleId || role.roleID || role.Id;
            const roleName = role.name || role.roleName;
    return (
                (roleId && roleIds.has(String(roleId).toLowerCase())) ||
                (roleName && roleNames.has(roleName.toLowerCase()))
            );
        });

        if (matchedRole) {
            setSelectedRole(matchedRole);
        }
    }, [selectedUser, selectedRole, safeRoles, setSelectedRole, departmentData]);

    return (
        <div className="space-y-6 h-screen">
            <div className="p-6 bg-gradient-to-br from-[#09D1C7]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]">
                <div className={`flex items-center gap-3 mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#09D1C7]/20 to-[#09D1C7]/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-[#09D1C7]" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <h3 className="text-lg font-bold text-[var(--text-color)]">
                            {t("departments.editDepartmentForm.assignSupervisor.title", "Assign Supervisor")}
                        </h3>
                        <p className="text-xs text-[var(--sub-text-color)]">
                            {t("departments.editDepartmentForm.assignSupervisor.description", "Choose who leads this department.")}
                        </p>
                        <p className="text-xs font-semibold mt-2 text-[var(--text-color)]">
                            {t("departments.editDepartmentForm.assignSupervisor.currentSupervisor", "Current Supervisor")}:{" "}
                            <span className="text-[var(--sub-text-color)]">
                                {departmentData.supervisorName?.trim() ||
                                `${departmentData.supervisorFirstName || ""} ${departmentData.supervisorLastName || ""}`.trim() ||
                                departmentData.supervisorEmail ||
                                t("departments.editDepartmentForm.assignSupervisor.none", "None")}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.assignSupervisor.step1", "Step 1: Select Role")}
                        </label>
                        <div className="relative" onClick={() => setIsRoleOpen(!isRoleOpen)}>
                            <div className="form-input flex items-center justify-between border-2 hover:border-[#09D1C7]/50 transition-all cursor-pointer">
                                <span className={selectedRole ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                    {selectedRole ? selectedRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}
                                </span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} size={18} />
                </div>
                {isRoleOpen && (
                                <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-20 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto`}>
                                    {safeRoles.length > 0 ? (
                                        safeRoles.map((role, idx) => (
                                            <div
                                                key={role.id || role.roleId || idx}
                                                className={`p-3 hover:bg-[#09D1C7]/10 cursor-pointer transition-colors ${
                                                    selectedRole?.id === role.id ? 'bg-[#09D1C7]/10' : ''
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRole(role);
                                                    setIsRoleOpen(false);
                                                    setSelectedUser(null);
                                                }}
                                            >
                                                <div className="text-sm font-medium text-[var(--text-color)]">{role.name}</div>
                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-[var(--sub-text-color)]">
                                            {t("departments.newDepartmentForm.assignSupervisor.noActiveRoles", "No roles found")}
                    </div>
                )}
                                </div>
                            )}
                        </div>
            </div>

                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.assignSupervisor.step2", "Step 2: Select Supervisor")}
                        </label>
            <div className="relative">
                            <div
                                className={`form-input flex items-center justify-between border-2 transition-all cursor-pointer ${
                                    selectedUser ? 'border-[#09D1C7]/40' : 'hover:border-[#09D1C7]/50'
                                }`}
                                onClick={() => selectedRole && setIsUserOpen(!isUserOpen)}
                            >
                                <span className={selectedUser ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                    {selectedUser
                                        ? selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                                        : selectedRole
                                            ? t("departments.newDepartmentForm.assignSupervisor.chooseSupervisor")
                                            : t("departments.newDepartmentForm.assignSupervisor.selectRoleFirst", "Select role first")}
                                </span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isUserOpen ? 'rotate-180' : ''}`} size={18} />
                </div>
                            {isUserOpen && selectedRole && (
                                <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-20 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl max-h-[min(60vh,500px)] overflow-hidden flex flex-col`}>
                                    <div className="p-3 border-b-2 border-[var(--border-color)] bg-gradient-to-r from-[#09D1C7]/5 to-transparent sticky top-0 z-10">
                            <div className="relative">
                                            <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#09D1C7]`} />
                                <input
                                    type="text"
                                    value={supervisorSearchTerm}
                                    onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                                    placeholder={t("departments.newDepartmentForm.assignSupervisor.searchUsers") || "Search users..."}
                                                className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#09D1C7]/50 focus:border-[#09D1C7]`}
                                    onClick={(e) => e.stopPropagation()}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>
                                    <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(60vh - 80px)' }}>
                            {selectedRole && safeFilteredUsers.length > 0 ? (
                                            safeFilteredUsers.map((u, idx) => {
                                                const userKey = u?.id || u?.userId || u?.userID || u?.UserId || u?.email || `user-${idx}`;
                                                const matchedId = u?.id || u?.userId || u?.userID || u?.UserId;
                                                return (
                                                <div
                                                    key={userKey}
                                                    className={`p-3 hover:bg-[#09D1C7]/10 cursor-pointer transition-colors border-b border-[var(--border-color)]/40 ${
                                                        matchedId && (selectedUser?.id === matchedId || selectedUser?.userId === matchedId) ? 'bg-[#09D1C7]/10' : ''
                                                    }`}
                                                    onClick={() => {
                                        setSelectedUser(u); 
                                        setIsUserOpen(false);
                                        setSupervisorSearchTerm("");
                                                    }}
                                                >
                                                    <div className="text-sm font-medium text-[var(--text-color)]">{u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()}</div>
                                        <div className="text-xs text-[var(--sub-text-color)]">{u.email || u.username}</div>
                                    </div>
                                                );
                                            })
                            ) : (
                                            <div className="p-4 text-center text-[var(--sub-text-color)]">
                                                {supervisorSearchTerm ? t("departments.newDepartmentForm.assignSupervisor.noUsersSearch", "No users found matching your search") : t("departments.newDepartmentForm.assignSupervisor.noUsersRole", "No users found for this role")}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                            {isUserOpen && !selectedRole && (
                                <div className="absolute top-full left-0 right-0 z-20 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl p-4 text-center text-[var(--sub-text-color)]">
                                    {t("departments.newDepartmentForm.assignSupervisor.selectRoleFirst", "Please select a role first")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedUser && (
                <div className="p-5 bg-gradient-to-r from-[#09D1C7]/10 to-[#09D1C7]/5 rounded-xl border border-[#09D1C7]/20">
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-[#09D1C7]" />
                        </div>
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-bold text-[var(--text-color)]">
                                {selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}
                            </p>
                            <p className="text-xs text-[var(--sub-text-color)]">{selectedUser.email || selectedUser.username}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#09D1C7]/20 border border-[#09D1C7]/30 text-xs font-semibold text-[#09D1C7]">
                            {t("departments.editDepartmentForm.assignSupervisor.selected", "Selected")}
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-4 border-t border-[var(--border-color)]`}>
                <button type="button" className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] transition-all duration-200" onClick={onBack}>
                    {t("departments.editDepartmentForm.buttons.back")}
                </button>
                <button
                    type="button"
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        selectedUser
                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white hover:shadow-lg hover:scale-105'
                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)] border-2 border-[var(--border-color)] cursor-not-allowed opacity-60'
                    }`}
                    onClick={onNext}
                    disabled={!selectedUser}
                >
                    {t("departments.editDepartmentForm.buttons.next")}
                </button>
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
    
    const canViewTeams = useHasPermission('Team.View');
    const canViewMembers = useHasPermission('Team.ViewMembers');
    
    const { data: teamsData, isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByDepartmentQuery(departmentData.id, {
        skip: !departmentData?.id || !canViewTeams
    });
    
    const teams = useMemo(() => {
        const items = teamsData?.value || teamsData?.data || teamsData?.items || teamsData || [];
        return Array.isArray(items) ? items : [];
    }, [teamsData]);
    
    const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
    const [teamFormMode, setTeamFormMode] = useState("create");
    const [activeTeam, setActiveTeam] = useState(null);
    const [teamFormInitial, setTeamFormInitial] = useState(null);
    
    const { data: teamUsersData, isLoading: isLoadingTeamUsers } = useGetTeamUsersQuery(activeTeam?.id, {
        skip: teamFormMode !== "edit" || !activeTeam?.id
    });
    
    const [createTeam] = useCreateTeamMutation();
    const [addUsersToTeam] = useAddUsersToTeamMutation();
    const [updateTeam] = useUpdateTeamMutation();
    const [updateUsersInTeam] = useUpdateUsersInTeamMutation();
    const [deleteTeam, { isLoading: isDeletingTeam }] = useDeleteTeamMutation();
    
    useEffect(() => {
        if (teamFormMode !== "edit" || !activeTeam) {
            setTeamFormInitial(null);
            return;
        }
        if (isLoadingTeamUsers) return;
        const membersSource = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
        const members = Array.isArray(membersSource) ? membersSource.map(item => item.user || item) : [];
        const leader = activeTeam.teamLeader || activeTeam.teamLeadUser || activeTeam.teamLead || null;
        setTeamFormInitial({
            id: activeTeam.id,
            name: activeTeam.name || '',
            description: activeTeam.description || '',
            teamLeader: leader,
            selectedEmployees: members,
        });
    }, [teamFormMode, activeTeam, teamUsersData, isLoadingTeamUsers]);
    
    const openCreateTeamForm = () => {
        setTeamFormMode("create");
        setActiveTeam(null);
        setTeamFormInitial(null);
        setIsTeamFormOpen(true);
    };
    
    const openEditTeamForm = (team) => {
        setTeamFormMode("edit");
        setActiveTeam(team);
        setIsTeamFormOpen(true);
    };

    const closeTeamForm = () => {
        setIsTeamFormOpen(false);
        setActiveTeam(null);
        setTeamFormInitial(null);
        setTeamFormMode("create");
    };
    
    const extractUserId = (member) => member?.id || member?.userId || member?.userID || member?.UserId || member?.Id || member?._id;
    
    const handleTeamFormSubmit = async (formData) => {
        const teamLeadId = formData.teamLeadId;
        if (!teamLeadId || !departmentData.id) {
            toast.error(t("departments.editDepartmentForm.setupTeams.errors.missingData", "Missing required team data"));
            return;
        }
        try {
            if (teamFormMode === "edit" && activeTeam?.id) {
                await updateTeam({
                    id: activeTeam.id,
                    name: formData.name,
                    description: formData.description || '',
                    teamLeadId,
                    departmentId: departmentData.id,
                }).unwrap();
                
                const userIds = (formData.selectedEmployees || []).map(extractUserId).filter(Boolean);
                await updateUsersInTeam({
                    teamId: activeTeam.id,
                    userIds,
                    departmentId: departmentData.id
                }).unwrap();
                
                toast.success(t("departments.editDepartmentForm.setupTeams.updateSuccess", { name: formData.name, defaultValue: `Team "${formData.name}" updated successfully!` }));
            } else {
            const res = await createTeam({
                    name: formData.name,
                    description: formData.description || '',
                    teamLeadId,
                departmentId: departmentData.id,
            }).unwrap();
            
            const value = res?.value || res;
            const createdTeamId = value?.id;
            
            if (!createdTeamId) {
                throw new Error('Team was created but no team ID was returned');
            }
            
                const userIds = (formData.selectedEmployees || []).map(extractUserId).filter(Boolean);
                if (userIds.length > 0) {
                    await addUsersToTeam({ 
                        teamId: createdTeamId, 
                        userIds,
                        departmentId: departmentData.id
                    }).unwrap();
                }
                
                toast.success(t("departments.editDepartmentForm.setupTeams.createSuccess", { name: formData.name, defaultValue: `Team "${formData.name}" created successfully!` }));
            }
            
            closeTeamForm();
            refetchTeams();
        } catch (err) {
            const errorMessage = err?.data?.errorMessage || err?.message || 'Failed to save team';
            toast.error(errorMessage);
        }
    };
    
    const handleDeleteTeam = async (teamId) => {
        if (!confirm(t("departments.editDepartmentForm.setupTeams.confirmDelete", "Are you sure you want to delete this team?"))) return;
        
        try {
            await deleteTeam({ id: teamId, departmentId: departmentData.id }).unwrap();
            refetchTeams();
            toast.success(t("departments.editDepartmentForm.setupTeams.deleteSuccess", "Team deleted successfully!"));
        } catch (err) {
            const errorMessage = err?.data?.errorMessage || err?.message || 'Failed to delete team';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="space-y-6">
            {isTeamFormOpen && (
                <TeamFormEmbedded
                    departmentId={departmentData.id}
                    mode={teamFormMode}
                    initialTeam={teamFormInitial}
                    onCancel={closeTeamForm}
                    onSubmit={handleTeamFormSubmit}
                    loadingInitial={teamFormMode === "edit" && (isLoadingTeamUsers || !teamFormInitial)}
                    submitLabel={
                        teamFormMode === "edit"
                            ? t("departments.editDepartmentForm.buttons.save", "Save")
                            : t("departments.editDepartmentForm.buttons.add", "Add")
                    }
                />
            )}

            {!isTeamFormOpen && canCreateTeam && (
                <button
                    type="button"
                    className="btn-primary flex items-center gap-2"
                    onClick={openCreateTeamForm}
                >
                    <Plus size={16} />
                    {t("departments.editDepartmentForm.setupTeams.addNewTeam")}
                </button>
            )}

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
                                : t("departments.editDepartmentForm.setupTeams.noLeader", "No leader");
                            
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
                                                    {t("departments.newDepartmentForm.setupTeams.teamLeader")}: <span className="font-medium">{teamLeaderName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {canUpdateTeam && (
                                                <button 
                                                    className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                                                    onClick={() => openEditTeamForm(team)}
                                                    title={t("departments.editDepartmentForm.setupTeams.editTeam", "Edit team")}
                                                >
                                                    <Edit className="text-[var(--sub-text-color)]" size={16} />
                                                </button>
                                            )}
                                            {canDeleteTeam && (
                                                <button 
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    disabled={isDeletingTeam}
                                                    title={t("departments.editDepartmentForm.setupTeams.deleteTeam", "Delete team")}
                                                >
                                                    <Trash2 className="text-red-500" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {canViewMembers && (
                                        <div className="text-sm text-[var(--sub-text-color)] mt-2">
                                            {(team.teamMembers || team.memberCount || 0)} {t("departments.editDepartmentForm.setupTeams.members", "Members")}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-[var(--sub-text-color)]">{t("departments.editDepartmentForm.setupTeams.noTeams", "No teams found. Click \\\"Add New Team\\\" to create one.")}</div>
                </div>
            )}

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
