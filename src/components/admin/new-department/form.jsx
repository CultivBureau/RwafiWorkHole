import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Building2, Users, UserCheck, Eye, ChevronDown, X, Plus, Check, Search, Sparkles, User } from "lucide-react";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../services/apis/RoleApi";
import { useCreateDepartmentMutation, useAssignSupervisorMutation } from "../../../services/apis/DepartmentApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation } from "../../../services/apis/TeamApi";
import TeamFormEmbedded from "./team-form-embedded";
import toast from "react-hot-toast";

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
        <div className="w-full   mx-auto bg-[var(--bg-color)] rounded-2xl border-2 border-[var(--border-color)] shadow-xl overflow-hidden" dir={isArabic ? "rtl" : "ltr"}>
            {/* Enhanced Header with Gradient */}
            <div className="relative bg-gradient-to-r from-[#15919B] via-[#09D1C7] to-[#15919B] p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className={`absolute ${isArabic ? '-left-10' : '-right-10'} -top-10 w-40 h-40 bg-white rounded-full blur-3xl`}></div>
                    <div className={`absolute ${isArabic ? '-right-10' : '-left-10'} -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl`}></div>
                </div>
                <div className={`relative flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <div className={`flex items-center gap-2 mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <Sparkles className="text-white/80 w-4 h-4" />
                            <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                                {t("departments.newDepartmentForm.subtitle", "Department Management")}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            {t("departments.newDepartmentForm.title")}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Enhanced Progress Bar */}
                <div className="mb-8">
                    {/* Progress Line */}
                    <div className="relative mb-6">
                        <div className="w-full h-2 bg-[var(--border-color)] rounded-full" />
                        <div
                            className={`absolute top-0 h-2 bg-gradient-to-r from-[#15919B] to-[#09D1C7] rounded-full transition-all duration-500 ${isArabic ? 'right-0' : 'left-0'}`}
                            style={{ width: `${((step + 1) / 4) * 100}%` }}
                        />
                    </div>

                    {/* Step Tabs */}
                    <div className="flex justify-between ">
                        {steps.map((stepItem, idx) => {
                            const IconComponent = stepItem.icon;
                            const isActive = idx === step;
                            const isCompleted = idx < step;

                            return (
                                <div
                                    key={stepItem.label}
                                    className="flex items-center"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isArabic ? 'ml-2' : 'mr-2'} ${
                                        isActive || isCompleted 
                                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white shadow-lg scale-110' 
                                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                    }`}>
                                        <IconComponent size={18} />
                                    </div>
                                    <span className={`text-sm font-semibold hidden sm:block transition-colors duration-300 ${
                                        isActive || isCompleted
                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#15919B] to-[#09D1C7]'
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
                <div className="mt-8 ">
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
            {/* Enhanced Form Section */}
            <div className="p-6 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]">
                <div className="space-y-6">
                    {/* Department Name */}
                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.departmentInfo.departmentName")} <span className="text-[var(--error-color)]">*</span>
                        </label>
                        <input
                            className={`w-full px-4 py-3 border-2 rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 transition-all ${
                                errors.departmentName 
                                    ? 'border-[var(--error-color)] focus:border-[var(--error-color)] focus:ring-[var(--error-color)]/20' 
                                    : formData.departmentName.trim()
                                        ? 'border-[#15919B]/30 focus:border-[#15919B] focus:ring-[#15919B]/20'
                                        : 'border-[var(--border-color)] focus:border-[#15919B] focus:ring-[#15919B]/20'
                            }`}
                            placeholder={t("departments.newDepartmentForm.departmentInfo.departmentName")}
                            type="text"
                            value={formData.departmentName}
                            onChange={(e) => handleInputChange('departmentName', e.target.value)}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                        {errors.departmentName && (
                            <p className={`mt-2 text-sm text-[var(--error-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                {errors.departmentName}
                            </p>
                        )}
                    </div>
                    
                    {/* Description */}
                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.departmentInfo.description")} <span className="text-xs text-[var(--sub-text-color)]">({t("common.optional", "Optional")})</span>
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] resize-none transition-all"
                            placeholder={t("departments.newDepartmentForm.departmentInfo.description")}
                            rows="4"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6 border-t border-[var(--border-color)]`}>
                <button 
                    type="button" 
                    className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] hover:border-[#15919B]/30 transition-all duration-200" 
                    onClick={() => navigate('/pages/admin/all-departments')}
                >
                    {t("departments.newDepartmentForm.buttons.cancel")}
                </button>
                <button 
                    type="button" 
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        isFormValid
                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white hover:shadow-lg hover:scale-105'
                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)] border-2 border-[var(--border-color)] cursor-not-allowed opacity-60'
                    }`}
                    onClick={handleNext}
                    disabled={!isFormValid}
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
    const userDropdownRef = useRef(null);
    const roleDropdownRef = useRef(null);
    // selectedUser managed by parent

    // Only fetch active roles (status: 0 = active)
    const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles, refetch: refetchRoles } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 50, status: 0 });
    const { data: roleUsersData, isLoading: isLoadingUsers, isError: isErrorUsers, refetch: refetchUsers } = useGetRoleUsersQuery(
        selectedRole ? { id: selectedRole.id, pageNumber: 1, pageSize: 50 } : { id: "", pageNumber: 1, pageSize: 50 },
        { skip: !selectedRole }
    );

    // Roles are already filtered by status: 0 (active) in the API query
    // status: 0 = active, status: 1 = inactive, status: 2 = all
    const roles = useMemo(() => {
        const items = rolesData?.value || rolesData?.data || rolesData?.items || rolesData || [];
        return Array.isArray(items) ? items : [];
    }, [rolesData]);
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

    // Auto-open dropdown when search text is entered
    useEffect(() => {
        if (supervisorSearchTerm.trim() && selectedRole && !selectedUser) {
            setIsUserOpen(true);
        }
    }, [supervisorSearchTerm, selectedRole, selectedUser]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setIsUserOpen(false);
            }
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
                setIsRoleOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6 h-screen ">
            {/* Enhanced Supervisor Selection Section */}
            <div className="p-6 bg-gradient-to-br from-[#09D1C7]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]">
                <div className={`flex items-center gap-3 mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#09D1C7]/20 to-[#09D1C7]/10 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-[#09D1C7]" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <h3 className="text-lg font-bold text-[var(--text-color)]">
                            {t("departments.newDepartmentForm.assignSupervisor.title", "Assign Supervisor")}
                        </h3>
                        <p className="text-xs text-[var(--sub-text-color)]">
                            {t("departments.newDepartmentForm.assignSupervisor.description", "Select a supervisor for this department")}
                        </p>
                    </div>
                </div>

                {/* Role selection */}
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.assignSupervisor.step1", "Step 1: Select Role")}
                        </label>
                        <div className="relative" ref={roleDropdownRef}>
                            <div className="form-input cursor-pointer flex items-center justify-between border-2 hover:border-[#09D1C7]/50 transition-all" onClick={() => setIsRoleOpen(!isRoleOpen)}>
                                <span className={selectedRole ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                    {selectedRole ? selectedRole.name : t("departments.newDepartmentForm.assignSupervisor.chooseRole")}
                                </span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} size={18} />
                            </div>
                            {isRoleOpen && (
                                <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-50 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl max-h-[min(60vh,400px)] overflow-y-auto`}>
                                    {isLoadingRoles && <div className="p-4 text-center text-[var(--sub-text-color)]">Loading roles...</div>}
                                    {isErrorRoles && (
                                        <div className="p-4 text-[var(--sub-text-color)] flex items-center justify-between">
                                            <span>Failed to load roles</span>
                                            <button className="px-3 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)]" onClick={(e) => { e.stopPropagation(); refetchRoles(); }}>Retry</button>
                                        </div>
                                    )}
                                    {roles && roles.length > 0 ? (
                                        roles.map((role) => (
                                            <div 
                                                key={role.id} 
                                                className={`p-3 hover:bg-[#09D1C7]/10 cursor-pointer transition-colors ${
                                                    selectedRole?.id === role.id ? 'bg-[#09D1C7]/10' : ''
                                                }`} 
                                                onClick={() => { 
                                                    setSelectedRole(role); 
                                                    setIsRoleOpen(false); 
                                                    setSelectedUser(null);
                                                    setSupervisorSearchTerm(""); // Clear search when role changes
                                                }}
                                            >
                                                <div className="text-sm font-medium text-[var(--text-color)]">{role.name}</div>
                                            </div>
                                        ))
                                    ) : (
                                        !isLoadingRoles && !isErrorRoles && (
                                            <div className="p-4 text-center text-[var(--sub-text-color)]">
                                                {t("departments.newDepartmentForm.assignSupervisor.noActiveRoles", "No active roles found")}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User selection */}
                    <div>
                        <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {t("departments.newDepartmentForm.assignSupervisor.step2", "Step 2: Select Supervisor")}
                        </label>
                        <div className="relative" ref={userDropdownRef}>
                            <div className={`form-input cursor-pointer flex items-center justify-between border-2 transition-all ${
                                selectedUser ? 'border-[#09D1C7]/30' : 'hover:border-[#09D1C7]/50'
                            }`} onClick={() => selectedRole && setIsUserOpen(!isUserOpen)}>
                                <span className={selectedUser ? "text-[var(--text-color)] font-medium" : "text-[var(--sub-text-color)]"}>
                                    {selectedUser 
                                        ? (selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()) 
                                        : selectedRole 
                                            ? t("departments.newDepartmentForm.assignSupervisor.chooseSupervisor")
                                            : t("departments.newDepartmentForm.assignSupervisor.selectRoleFirst", "Select role first")}
                                </span>
                                <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isUserOpen ? 'rotate-180' : ''}`} size={18} />
                            </div>
                            {isUserOpen && selectedRole && (
                                <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-50 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl max-h-[min(60vh,500px)] overflow-hidden flex flex-col`}>
                                    {/* Search Input */}
                                    <div className="p-3 border-b-2 border-[var(--border-color)] bg-gradient-to-r from-[#09D1C7]/5 to-transparent sticky top-0 z-10 bg-[var(--bg-color)]">
                                        <div className="relative">
                                            <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#09D1C7]`} />
                                            <input
                                                type="text"
                                                value={supervisorSearchTerm}
                                                onChange={(e) => {
                                                    setSupervisorSearchTerm(e.target.value);
                                                    // Auto-open dropdown when typing
                                                    if (e.target.value.trim() && selectedRole && !selectedUser) {
                                                        setIsUserOpen(true);
                                                    }
                                                }}
                                                onFocus={() => {
                                                    // Open dropdown when input is focused
                                                    if (selectedRole && !selectedUser) {
                                                        setIsUserOpen(true);
                                                    }
                                                }}
                                                placeholder={t("departments.newDepartmentForm.assignSupervisor.searchUsers") || "Search users..."}
                                                className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#09D1C7]/50 focus:border-[#09D1C7]`}
                                                onClick={(e) => e.stopPropagation()}
                                                dir={isArabic ? 'rtl' : 'ltr'}
                                            />
                                        </div>
                                    </div>
                                    {/* Users List */}
                                    <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(60vh - 80px)' }}>
                                        {isLoadingUsers && <div className="p-4 text-center text-[var(--sub-text-color)]">Loading users...</div>}
                                        {isErrorUsers && (
                                            <div className="p-4 text-[var(--sub-text-color)] flex items-center justify-between">
                                                <span>Failed to load users</span>
                                                <button className="px-3 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)]" onClick={(e) => { e.stopPropagation(); refetchUsers(); }}>Retry</button>
                                            </div>
                                        )}
                                        {!isLoadingUsers && !isErrorUsers && filteredSupervisorUsers.length > 0 ? (
                                            filteredSupervisorUsers.map((u, index) => {
                                                const userId = u?.id || u?.userId || u?.userID || u?.UserId || u?._id || `user-${index}`;
                                                return (
                                                    <div 
                                                        key={userId} 
                                                        className={`p-3 hover:bg-[#09D1C7]/10 cursor-pointer transition-colors border-b border-[var(--border-color)]/30 last:border-b-0 ${
                                                            selectedUser?.id === userId || selectedUser?.userId === userId ? 'bg-[#09D1C7]/10' : ''
                                                        }`} 
                                                        onClick={() => { 
                                                            setSelectedUser(u); 
                                                            setIsUserOpen(false);
                                                            setSupervisorSearchTerm("");
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center flex-shrink-0">
                                                                <UserCheck className="w-5 h-5 text-[#09D1C7]" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-[var(--text-color)] truncate">
                                                                    {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown User'}
                                                                </div>
                                                                <div className="text-xs text-[var(--sub-text-color)] truncate">
                                                                    {u.email || u.username || 'No email'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            !isLoadingUsers && !isErrorUsers && (
                                                <div className="p-4 text-center text-[var(--sub-text-color)]">
                                                    {supervisorSearchTerm ? "No users found matching your search" : "No users found for this role"}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            {isUserOpen && !selectedRole && (
                                <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-50 mt-2 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-xl shadow-2xl p-4`}>
                                    <div className="text-center text-[var(--sub-text-color)]">
                                        {t("departments.newDepartmentForm.assignSupervisor.selectRoleFirst", "Please select a role first")}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected Supervisor Display */}
                {selectedUser && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-[#09D1C7]/10 to-[#09D1C7]/5 rounded-lg border border-[#09D1C7]/20">
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-[#09D1C7]" />
                            </div>
                            <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                <p className="text-sm font-bold text-[var(--text-color)]">
                                    {selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}
                                </p>
                                <p className="text-xs text-[var(--sub-text-color)]">{selectedUser.email || selectedUser.username}</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-[#09D1C7]/20 border border-[#09D1C7]/30">
                                <Check className="w-4 h-4 text-[#09D1C7]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6 border-t border-[var(--border-color)]`}>
                <button 
                    type="button" 
                    className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] hover:border-[#15919B]/30 transition-all duration-200" 
                    onClick={onBack}
                >
                    {t("departments.newDepartmentForm.buttons.back")}
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
                    {t("departments.newDepartmentForm.buttons.next")}
                </button>
            </div>
        </div>
    );
}

// Step 3: Setup Teams
function SetupTeamsStep({ onNext, onBack, teams, setTeams }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [showAddTeam, setShowAddTeam] = useState(false);

    const handleTeamAdd = (team) => {
        console.log('📝 Adding team to state:', team);
        setTeams(prev => {
            const updated = [...prev, team];
            console.log('📝 Updated teams array:', updated);
            console.log('📝 Teams count:', updated.length);
            return updated;
        });
        setShowAddTeam(false);
    };
    
    // Debug: Log teams whenever they change
    useEffect(() => {
        console.log('📝 SetupTeamsStep - Teams state changed:', teams);
        console.log('📝 SetupTeamsStep - Teams count:', teams.length);
    }, [teams]);

    return (
        <div className="space-y-6">
            {/* Add New Team Form */}
            {showAddTeam ? (
                <TeamFormEmbedded
                    departmentId={null}
                    onTeamAdd={handleTeamAdd}
                    onCancel={() => setShowAddTeam(false)}
                />
            ) : (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#15919B]/20 to-[#09D1C7]/10 mb-4">
                        <Users className="w-8 h-8 text-[#15919B]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-color)] mb-2">
                        {t("departments.newDepartmentForm.setupTeams.title", "Setup Teams")}
                    </h3>
                    <p className="text-sm text-[var(--sub-text-color)] mb-6">
                        {t("departments.newDepartmentForm.setupTeams.description", "Add teams to organize your department. Teams are optional.")}
                    </p>
                    <button
                        type="button"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                        onClick={() => setShowAddTeam(true)}
                    >
                        <Plus size={20} />
                        {t("departments.newDepartmentForm.setupTeams.addNewTeam")}
                    </button>
                </div>
            )}

            {/* Teams List */}
            {teams.length > 0 && (
                <div className="space-y-4">
                    <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <h3 className="text-lg font-bold text-[var(--text-color)]">
                            {t("departments.newDepartmentForm.setupTeams.teamsList", "Added Teams")} ({teams.length})
                        </h3>
                        {!showAddTeam && (
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white font-medium hover:shadow-md transition-all flex items-center gap-2"
                                onClick={() => setShowAddTeam(true)}
                            >
                                <Plus size={16} />
                                {t("departments.newDepartmentForm.setupTeams.addNewTeam")}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teams.map((team, index) => {
                            const teamId = team.id || `team-${index}`;
                            return (
                                <div key={teamId} className="p-5 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)] hover:border-[#15919B]/30 transition-all duration-300">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#15919B] to-[#09D1C7] rounded-xl flex items-center justify-center shadow-lg">
                                                <Users className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[var(--text-color)] font-bold text-lg">{team.name}</div>
                                                {team.description && (
                                                    <div className="text-[var(--sub-text-color)] text-sm mt-1">{team.description}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#15919B]/10 border border-[#15919B]/30">
                                            <Users className="w-4 h-4 text-[#15919B]" />
                                            <span className="text-xs font-bold text-[#15919B]">
                                                {(() => {
                                                    const teamLeaderCount = team.teamLeader ? 1 : 0;
                                                    const employeesCount = team.selectedEmployees?.length || 0;
                                                    return teamLeaderCount + employeesCount;
                                                })()} {t("departments.newDepartmentForm.setupTeams.members", "Members")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Team Leader Info */}
                                    {team.teamLeader && (
                                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#09D1C7]/10 to-[#09D1C7]/5 rounded-lg border border-[#09D1C7]/20 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center">
                                                <UserCheck className="w-5 h-5 text-[#09D1C7]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-[var(--sub-text-color)] mb-1">{t("departments.newDepartmentForm.setupTeams.teamLeader")}</div>
                                                <div className="text-sm font-bold text-[var(--text-color)]">
                                                    {team.teamLeader?.name || `${team.teamLeader?.firstName || ''} ${team.teamLeader?.lastName || ''}`.trim()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Display selected members */}
                                    {team.selectedEmployees && team.selectedEmployees.length > 0 && (
                                        <div className="space-y-2 pt-3 border-t border-[var(--border-color)]">
                                            <span className="text-xs font-semibold text-[var(--text-color)]">
                                                {t("departments.newDepartmentForm.setupTeams.membersLabel")} ({team.selectedEmployees.length})
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {team.selectedEmployees.map((emp, idx) => {
                                                    const empId = emp.id || emp.userId || emp.userID || emp.Id || `emp-${idx}`;
                                                    return (
                                                        <div key={empId} className="flex items-center gap-1 px-2 py-1 bg-[#15919B]/10 rounded-lg border border-[#15919B]/20 text-xs">
                                                            <User className="w-3 h-3 text-[#15919B]" />
                                                            <span className="text-[var(--text-color)] font-medium">
                                                                {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6 border-t border-[var(--border-color)]`}>
                <button 
                    type="button" 
                    className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] hover:border-[#15919B]/30 transition-all duration-200" 
                    onClick={onBack}
                >
                    {t("departments.newDepartmentForm.buttons.back")}
                </button>
                <button 
                    type="button" 
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200" 
                    onClick={onNext}
                >
                    {t("departments.newDepartmentForm.buttons.next")}
                </button>
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
    const [currentStep, setCurrentStep] = useState('department'); // 'department' or 'teams'
    const [departmentId, setDepartmentId] = useState(null);
    const [createdTeamsCount, setCreatedTeamsCount] = useState(0);
    const [createDepartment] = useCreateDepartmentMutation();
    const [assignSupervisor] = useAssignSupervisorMutation();
    const [createTeam] = useCreateTeamMutation();
    const [addUsersToTeam] = useAddUsersToTeamMutation();

    const departmentData = departmentInfo || { departmentName: '', description: '' };
    
    // Debug: Log teams when ReviewStep mounts or teams change
    useEffect(() => {
        console.log('🔍 ReviewStep - Teams received:', teams);
        console.log('🔍 ReviewStep - Teams is array?', Array.isArray(teams));
        console.log('🔍 ReviewStep - Teams count:', teams?.length);
        if (teams && teams.length > 0) {
            console.log('🔍 ReviewStep - Teams content:', JSON.stringify(teams, null, 2));
        }
    }, [teams]);

    // STEP 1: Create department first
    const handleCreateDepartment = async () => {
        try {
            setIsSubmitting(true);
            setCurrentStep('department');
            
            const supervisorId = supervisor?.id || supervisor?.userId || supervisor?.userID || supervisor?.UserId;
            const payload = {
                name: departmentData.departmentName,
                description: departmentData.description || '',
                supervisorId: supervisorId,
            };
            
            const depRes = await createDepartment(payload).unwrap();
            const createdDepartment = depRes?.value || depRes;
            const createdDepartmentId = createdDepartment?.id;

            if (!createdDepartmentId) {
                throw new Error('Department was created but no department ID was returned');
            }

            setDepartmentId(createdDepartmentId);
            
            // Fallback: if backend didn't set supervisor, assign explicitly
            if (supervisorId) {
                try { 
                    await assignSupervisor({ id: createdDepartmentId, userId: supervisorId }).unwrap(); 
                } catch (assignError) {
                    console.warn('Supervisor was already assigned or assignment failed:', assignError);
                    // Don't throw - supervisor might already be set
                }
            }

            // After department is created, proceed to create teams
            console.log('Department created successfully with ID:', createdDepartmentId);
            console.log('Checking teams array:', teams);
            console.log('Teams is array?', Array.isArray(teams));
            console.log('Teams length:', teams?.length);
            
            if (Array.isArray(teams) && teams.length > 0) {
                console.log('Proceeding to create teams...');
                await handleCreateTeams(createdDepartmentId);
            } else {
                console.log('No teams to create, finishing...');
                setIsSubmitting(false);
                setIsCompleted(true);
            }
        } catch (e) {
            console.error('Error creating department:', e);
            const errorMsg = e?.data?.errorMessage || 
                           e?.data?.message || 
                           e?.message || 
                           'Failed to create department';
            toast.error(`Error: ${errorMsg}`);
            setIsSubmitting(false);
            setCurrentStep('department');
        }
    };

    // STEP 2: Create teams after department is created
    const handleCreateTeams = async (deptId) => {
        try {
            setCurrentStep('teams');
            setCreatedTeamsCount(0);
            
            console.log('=== Starting Team Creation ===');
            console.log('Department ID:', deptId);
            console.log('Teams array:', teams);
            console.log('Teams length:', teams?.length);
            console.log('Is array:', Array.isArray(teams));
            
            if (!Array.isArray(teams) || teams.length === 0) {
                console.log('No teams to create, finishing...');
                setIsSubmitting(false);
                setIsCompleted(true);
                return;
            }

            console.log(`Creating ${teams.length} teams...`);

            for (let i = 0; i < teams.length; i++) {
                const team = teams[i];
                console.log(`\n--- Processing Team ${i + 1}/${teams.length} ---`);
                console.log('Team data:', team);
                
                // Extract team leader ID (try multiple property names)
                const teamLeadId = team.teamLeader?.id || 
                                  team.teamLeader?.userId || 
                                  team.teamLeader?.userID || 
                                  team.teamLeader?.UserId ||
                                  team.teamLeader?.Id ||
                                  team.teamLeader?._id;
                
                console.log('Team Leader ID:', teamLeadId);
                console.log('Team Leader object:', team.teamLeader);
                console.log('Team Leader object keys:', team.teamLeader ? Object.keys(team.teamLeader) : 'No team leader');
                
                // Try to find ID in nested structure
                if (!teamLeadId && team.teamLeader) {
                    console.warn('⚠️ Could not find team leader ID in standard properties, checking all properties...');
                    // Log all properties to help debug
                    for (const key in team.teamLeader) {
                        console.log(`  ${key}:`, team.teamLeader[key]);
                    }
                }
                
                if (!teamLeadId) {
                    console.warn(`⚠️ Skipping team "${team.name || 'Unnamed'}" - no team leader ID found`);
                    setCreatedTeamsCount(prev => prev + 1);
                    continue; // Skip teams without a leader
                }
                
                if (!team.name || !team.name.trim()) {
                    console.warn(`⚠️ Skipping team - no team name provided`);
                    setCreatedTeamsCount(prev => prev + 1);
                    continue; // Skip teams without a name
                }
                
                const teamPayload = {
                    name: team.name.trim(),
                    description: team.description || '',
                    teamLeadId,
                    departmentId: deptId, // Use the created department ID
                };
                
                console.log('Team payload:', teamPayload);
                
                try { 
                    console.log(`📤 Creating team "${team.name}"...`);
                    // Create the team using /api/v1/Team/Create
                    const teamResult = await createTeam(teamPayload).unwrap();
                    console.log('✅ Team creation response:', teamResult);
                    
                    const createdTeam = teamResult?.value || teamResult;
                    const createdTeamId = createdTeam?.id;
                    
                    console.log('Created Team ID:', createdTeamId);
                    console.log('Full created team object:', createdTeam);
                    
                    if (!createdTeamId) {
                        console.error('❌ Team was created but no team ID was returned');
                        console.error('Response structure:', teamResult);
                        throw new Error(`Team "${team.name}" was created but no team ID was returned`);
                    }

                    // Add team members using /api/v1/Team/AddUsersToTeam/{teamId}/users
                    if (Array.isArray(team.selectedEmployees) && team.selectedEmployees.length > 0) {
                        console.log(`📤 Adding ${team.selectedEmployees.length} members to team...`);
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
                        
                        console.log('Member User IDs:', userIds);
                        
                        if (userIds.length > 0) {
                            try {
                                console.log(`📤 Calling AddUsersToTeam with teamId: ${createdTeamId}, userIds:`, userIds);
                                const addUsersResult = await addUsersToTeam({ 
                                    teamId: createdTeamId, 
                                    userIds,
                                    departmentId: deptId
                                }).unwrap();
                                console.log('✅ Members added successfully:', addUsersResult);
                            } catch (addUsersError) {
                                const errorMsg = addUsersError?.data?.errorMessage || 
                                               addUsersError?.data?.message || 
                                               addUsersError?.message || 
                                               'Unknown error';
                                console.error(`❌ Failed to add members to team "${team.name}":`, errorMsg);
                                console.error('Full error:', addUsersError);
                                // Don't throw - continue with other teams
                            }
                        } else {
                            console.warn('⚠️ No valid user IDs found in selected employees');
                        }
                    } else {
                        console.log('ℹ️ No members to add to team');
                    }
                    
                    console.log(`✅ Team "${team.name}" created successfully!`);
                    setCreatedTeamsCount(prev => prev + 1);
                } catch (err) {
                    const errorMsg = err?.data?.errorMessage || 
                                   err?.data?.message || 
                                   err?.message || 
                                   'Unknown error';
                    console.error(`❌ Failed to create team "${team.name}":`, errorMsg);
                    console.error('Full error object:', err);
                    console.error('Error data:', err?.data);
                    // Continue with other teams even if one fails
                    setCreatedTeamsCount(prev => prev + 1);
                }
            }

            console.log('=== Team Creation Complete ===');
            setIsSubmitting(false);
            setIsCompleted(true);
        } catch (e) {
            console.error('❌ Error creating teams:', e);
            console.error('Full error object:', e);
            const errorMsg = e?.data?.errorMessage || 
                           e?.data?.message || 
                           e?.message || 
                           'Failed to create teams';
            toast.error(`Error creating teams: ${errorMsg}`);
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        await handleCreateDepartment();
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

    // Show progress during submission
    if (isSubmitting) {
        return (
            <div className="space-y-8">
                <h2 className="text-xl font-bold text-[var(--text-color)]">
                    {t("departments.newDepartmentForm.review.reviewDepartmentDetails")}
                </h2>

                {/* Progress Indicator */}
                <div className="p-6 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]">
                    <div className="space-y-4">
                        {/* Step 1: Creating Department */}
                        <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                currentStep === 'department' 
                                    ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] animate-pulse' 
                                    : 'bg-gradient-to-r from-[#15919B] to-[#09D1C7]'
                            }`}>
                                {currentStep === 'department' ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check className="text-white" size={20} />
                                )}
                            </div>
                            <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                <div className="text-sm font-semibold text-[var(--text-color)]">
                                    {currentStep === 'department' 
                                        ? t("departments.newDepartmentForm.progress.creatingDepartment", "Creating Department...")
                                        : t("departments.newDepartmentForm.progress.departmentCreated", "Department Created")}
                                </div>
                                <div className="text-xs text-[var(--sub-text-color)]">
                                    {t("departments.newDepartmentForm.progress.departmentStep", "Setting up department and assigning supervisor")}
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Creating Teams */}
                        {teams && teams.length > 0 && (
                            <>
                                <div className={`h-8 w-0.5 ${isArabic ? 'mr-6' : 'ml-6'} bg-gradient-to-b from-[#15919B] to-[#09D1C7]`}></div>
                                <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        currentStep === 'teams' 
                                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] animate-pulse' 
                                            : currentStep === 'department'
                                                ? 'bg-[var(--container-color)] border-2 border-[var(--border-color)]'
                                                : 'bg-gradient-to-r from-[#15919B] to-[#09D1C7]'
                                    }`}>
                                        {currentStep === 'teams' ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : currentStep === 'department' ? (
                                            <div className="w-4 h-4 border-2 border-[var(--sub-text-color)] border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Check className="text-white" size={20} />
                                        )}
                                    </div>
                                    <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                        <div className="text-sm font-semibold text-[var(--text-color)]">
                                            {currentStep === 'teams' 
                                                ? t("departments.newDepartmentForm.progress.creatingTeams", `Creating Teams... (${createdTeamsCount}/${teams.length})`)
                                                : currentStep === 'department'
                                                    ? t("departments.newDepartmentForm.progress.waitingTeams", "Waiting to create teams...")
                                                    : t("departments.newDepartmentForm.progress.teamsCreated", `Teams Created (${teams.length})`)}
                                        </div>
                                        <div className="text-xs text-[var(--sub-text-color)]">
                                            {t("departments.newDepartmentForm.progress.teamsStep", "Adding teams to the department")}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
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
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                    {t("departments.newDepartmentForm.review.teams", "Teams")} {teams.length > 0 && `(${teams.length})`}
                </h3>
                {teams.length === 0 ? (
                    <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] text-center">
                        <p className="text-[var(--sub-text-color)]">{t("departments.newDepartmentForm.review.noTeams", "No teams added")}</p>
                    </div>
                ) : (
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
                )}
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
