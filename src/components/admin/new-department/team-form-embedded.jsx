import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Check, Users, Search, User, Crown, X, ChevronDown, Filter } from "lucide-react";
import { useGetAllUsersQuery } from "../../../services/apis/UserApi";
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi";
import { useGetTeamsByDepartmentQuery } from "../../../services/apis/TeamApi";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../services/apis/RoleApi";

export default function TeamFormEmbedded({
    departmentId,
    onTeamAdd,
    onCancel,
    initialTeam = null,
    mode = "create",
    submitLabel,
    onSubmit,
    loadingInitial = false,
}) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const isEditMode = mode === "edit";
    
    const [newTeam, setNewTeam] = useState({ 
        name: '', 
        description: '', 
        selectedEmployees: [],
        teamLeader: null
    });
    
    // Filter states - Separate for leader and members
    const [leaderDepartment, setLeaderDepartment] = useState(departmentId || "all");
    const [leaderRole, setLeaderRole] = useState("all");
    const [leaderNameSearch, setLeaderNameSearch] = useState("");
    
    const [memberDepartment, setMemberDepartment] = useState(departmentId || "all");
    const [memberRole, setMemberRole] = useState("all");
    const [memberNameSearch, setMemberNameSearch] = useState("");
    
    // Pagination for dropdowns
    const [leaderPage, setLeaderPage] = useState(1);
    const [membersPage, setMembersPage] = useState(1);
    const itemsPerPage = 15;
    
    // Dropdown states
    const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
    const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
    const [isLeaderDepartmentFilterOpen, setIsLeaderDepartmentFilterOpen] = useState(false);
    const [isLeaderRoleFilterOpen, setIsLeaderRoleFilterOpen] = useState(false);
    const [isMemberDepartmentFilterOpen, setIsMemberDepartmentFilterOpen] = useState(false);
    const [isMemberRoleFilterOpen, setIsMemberRoleFilterOpen] = useState(false);
    
    const leaderDropdownRef = useRef(null);
    const membersDropdownRef = useRef(null);
    const leaderDepartmentFilterRef = useRef(null);
    const leaderRoleFilterRef = useRef(null);
    const memberDepartmentFilterRef = useRef(null);
    const memberRoleFilterRef = useRef(null);

    // Fetch data for leader
    const { data: leaderRoleUsersData, isLoading: isLoadingLeaderRoleUsers } = useGetRoleUsersQuery(
        { id: leaderRole, pageNumber: 1, pageSize: 500 },
        { skip: leaderRole === "all" || !leaderRole }
    );
    
    const { data: leaderUsersData, isLoading: isLoadingLeaderAllUsers } = useGetAllUsersQuery(
        { 
            departmentId: leaderDepartment !== "all" ? leaderDepartment : undefined,
            name: leaderNameSearch || undefined,
            pageNumber: 1, 
            pageSize: 500 
        },
        { skip: leaderRole !== "all" }
    );
    
    // Fetch data for members
    const { data: memberRoleUsersData, isLoading: isLoadingMemberRoleUsers } = useGetRoleUsersQuery(
        { id: memberRole, pageNumber: 1, pageSize: 500 },
        { skip: memberRole === "all" || !memberRole }
    );
    
    const { data: memberUsersData, isLoading: isLoadingMemberAllUsers } = useGetAllUsersQuery(
        { 
            departmentId: memberDepartment !== "all" ? memberDepartment : undefined,
            name: memberNameSearch || undefined,
            pageNumber: 1, 
            pageSize: 500 
        },
        { skip: memberRole !== "all" }
    );
    
    const { data: departmentsData } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    // Only fetch active roles (status: 0 = active)
    const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100, status: 0 });
    
    // Combine users for leader
    const allLeaderUsers = useMemo(() => {
        let items = [];
        
        if (leaderRole !== "all" && leaderRole) {
            items = leaderRoleUsersData?.value || leaderRoleUsersData?.data || leaderRoleUsersData?.items || leaderRoleUsersData || [];
            items = items.map(item => {
                if (item?.user) {
                    return { ...item.user, userId: item.userId || item.user.id };
                }
                return item;
            });
        } else {
            items = leaderUsersData?.value || leaderUsersData?.data || leaderUsersData?.items || leaderUsersData || [];
        }
        
        // Apply name search filter regardless of role filter
        if (leaderNameSearch.trim()) {
            const search = leaderNameSearch.toLowerCase();
            items = items.filter(user => {
                const name = (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()).toLowerCase();
                const email = (user?.email || '').toLowerCase();
                const username = (user?.username || '').toLowerCase();
                return name.includes(search) || email.includes(search) || username.includes(search);
            });
        }
        
        return Array.isArray(items) ? items : [];
    }, [leaderUsersData, leaderRoleUsersData, leaderRole, leaderNameSearch]);
    
    // Combine users for members
    const allMemberUsers = useMemo(() => {
        let items = [];
        
        if (memberRole !== "all" && memberRole) {
            items = memberRoleUsersData?.value || memberRoleUsersData?.data || memberRoleUsersData?.items || memberRoleUsersData || [];
            items = items.map(item => {
                if (item?.user) {
                    return { ...item.user, userId: item.userId || item.user.id };
                }
                return item;
            });
        } else {
            items = memberUsersData?.value || memberUsersData?.data || memberUsersData?.items || memberUsersData || [];
        }
        
        // Apply name search filter regardless of role filter
        if (memberNameSearch.trim()) {
            const search = memberNameSearch.toLowerCase();
            items = items.filter(user => {
                const name = (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()).toLowerCase();
                const email = (user?.email || '').toLowerCase();
                const username = (user?.username || '').toLowerCase();
                return name.includes(search) || email.includes(search) || username.includes(search);
            });
        }
        
        return Array.isArray(items) ? items : [];
    }, [memberUsersData, memberRoleUsersData, memberRole, memberNameSearch]);
    
    const isLoadingLeaderUsers = leaderRole !== "all" ? isLoadingLeaderRoleUsers : isLoadingLeaderAllUsers;
    const isLoadingMemberUsers = memberRole !== "all" ? isLoadingMemberRoleUsers : isLoadingMemberAllUsers;
    
    const departments = useMemo(() => {
        const items = departmentsData?.value || departmentsData?.data || departmentsData?.items || departmentsData || [];
        return Array.isArray(items) ? items : [];
    }, [departmentsData]);
    
    // Roles are already filtered by status: 0 (active) in the API query
    // status: 0 = active, status: 1 = inactive, status: 2 = all
    const roles = useMemo(() => {
        const items = rolesData?.value || rolesData?.data || rolesData?.items || rolesData || [];
        return Array.isArray(items) ? items : [];
    }, [rolesData]);

    // Available users for leader selection (exclude already selected leader)
    const availableLeaderUsers = useMemo(() => {
        return allLeaderUsers.filter(user => {
            const userId = user?.id || user?.userId;
            const leaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
            return String(userId) !== String(leaderId);
        });
    }, [allLeaderUsers, newTeam.teamLeader]);

    // Available users for member selection (exclude leader and already selected members)
    const availableMemberUsers = useMemo(() => {
        return allMemberUsers.filter(user => {
            const userId = user?.id || user?.userId;
            const leaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
            const isSelected = newTeam.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) === String(userId);
            });
            return String(userId) !== String(leaderId) && !isSelected;
        });
    }, [allMemberUsers, newTeam.teamLeader, newTeam.selectedEmployees]);

    // Paginated leader users
    const paginatedLeaderUsers = useMemo(() => {
        const start = (leaderPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return availableLeaderUsers.slice(start, end);
    }, [availableLeaderUsers, leaderPage]);

    // Paginated member users
    const paginatedMemberUsers = useMemo(() => {
        const start = (membersPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return availableMemberUsers.slice(start, end);
    }, [availableMemberUsers, membersPage]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leaderDropdownRef.current && !leaderDropdownRef.current.contains(event.target)) {
                setIsLeaderDropdownOpen(false);
            }
            if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target)) {
                setIsMembersDropdownOpen(false);
            }
            if (leaderDepartmentFilterRef.current && !leaderDepartmentFilterRef.current.contains(event.target)) {
                setIsLeaderDepartmentFilterOpen(false);
            }
            if (leaderRoleFilterRef.current && !leaderRoleFilterRef.current.contains(event.target)) {
                setIsLeaderRoleFilterOpen(false);
            }
            if (memberDepartmentFilterRef.current && !memberDepartmentFilterRef.current.contains(event.target)) {
                setIsMemberDepartmentFilterOpen(false);
            }
            if (memberRoleFilterRef.current && !memberRoleFilterRef.current.contains(event.target)) {
                setIsMemberRoleFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleEmployee = (employee) => {
        const employeeId = employee?.id || employee?.userId;
        if (!employeeId) return;
        
        setNewTeam(prev => {
            const isSelected = prev.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) === String(employeeId);
            });
            
            if (isSelected) {
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
        setLeaderPage(1);
    };
    
    useEffect(() => {
        setLeaderPage(1);
    }, [leaderRole, leaderNameSearch, leaderDepartment]);
    
    useEffect(() => {
        setMembersPage(1);
    }, [memberRole, memberNameSearch, memberDepartment]);

    // Auto-open dropdown when search text is entered
    useEffect(() => {
        if (leaderNameSearch.trim() && !newTeam.teamLeader) {
            setIsLeaderDropdownOpen(true);
        }
    }, [leaderNameSearch, newTeam.teamLeader]);

    useEffect(() => {
        if (memberNameSearch.trim()) {
            setIsMembersDropdownOpen(true);
        }
    }, [memberNameSearch]);

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

    const handleAddTeam = () => {
        if (!newTeam.name.trim()) {
            return;
        }
        if (!newTeam.teamLeader) {
            return;
        }
        
        const teamToAdd = {
            id: Date.now(),
            name: newTeam.name,
            description: newTeam.description || '',
            teamLeader: newTeam.teamLeader,
            selectedEmployees: newTeam.selectedEmployees || [],
            members: (newTeam.teamLeader ? 1 : 0) + (newTeam.selectedEmployees || []).length
        };
        
        onTeamAdd(teamToAdd);
        
        // Reset form
        setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
        setLeaderDepartment(departmentId || "all");
        setLeaderRole("all");
        setLeaderNameSearch("");
        setMemberDepartment(departmentId || "all");
        setMemberRole("all");
        setMemberNameSearch("");
        setLeaderPage(1);
        setMembersPage(1);
    };

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

    useEffect(() => {
        if (initialTeam) {
            setNewTeam({
                name: initialTeam.name || '',
                description: initialTeam.description || '',
                teamLeader: initialTeam.teamLeader || null,
                selectedEmployees: initialTeam.selectedEmployees || [],
            });
        } else if (!isEditMode) {
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            setLeaderDepartment(departmentId || "all");
            setLeaderRole("all");
            setLeaderNameSearch("");
            setMemberDepartment(departmentId || "all");
            setMemberRole("all");
            setMemberNameSearch("");
            setLeaderPage(1);
            setMembersPage(1);
        }
    }, [initialTeam, departmentId, isEditMode]);

    const clearLeaderFilters = () => {
        setLeaderDepartment(departmentId || "all");
        setLeaderRole("all");
        setLeaderNameSearch("");
    };

    const clearMemberFilters = () => {
        setMemberDepartment(departmentId || "all");
        setMemberRole("all");
        setMemberNameSearch("");
    };

    const handleSubmit = async () => {
        if (!newTeam.name.trim() || !newTeam.teamLeader) {
            return;
        }

        const teamLeadId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId || newTeam.teamLeader?.userID || newTeam.teamLeader?.UserId || newTeam.teamLeader?._id;
        if (!teamLeadId) return;

        const submission = {
            id: initialTeam?.id,
            name: newTeam.name.trim(),
            description: newTeam.description || '',
            teamLeader: newTeam.teamLeader,
            teamLeadId,
            selectedEmployees: newTeam.selectedEmployees || [],
        };

        if (onSubmit) {
            await onSubmit(submission);
        } else if (onTeamAdd) {
            onTeamAdd({
                id: initialTeam?.id || Date.now(),
                name: submission.name,
                description: submission.description,
                teamLeader: submission.teamLeader,
                selectedEmployees: submission.selectedEmployees,
                members: (submission.teamLeader ? 1 : 0) + (submission.selectedEmployees || []).length,
            });
        }

        if (!isEditMode) {
            setNewTeam({ name: '', description: '', selectedEmployees: [], teamLeader: null });
            clearLeaderFilters();
            clearMemberFilters();
        }
    };

    if (loadingInitial) {
        return (
            <div className="p-6 bg-[var(--container-color)] rounded-xl border border-[var(--border-color)] flex items-center justify-center">
                <span className="text-[var(--sub-text-color)]">{t("common.loading", "Loading...")}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border-2 border-[var(--border-color)]" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header */}
            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#15919B]/20 to-[#15919B]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#15919B]" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                        <h3 className="text-lg font-bold text-[var(--text-color)]">
                            {isEditMode ? t("departments.newDepartmentForm.setupTeams.editTeam", "Edit Team") : t("departments.newDepartmentForm.setupTeams.addNewTeam", "Add New Team")}
                        </h3>
                        <p className="text-xs text-[var(--sub-text-color)]">
                            {t("departments.newDepartmentForm.setupTeams.addTeamDescription", "Create a team with leader and members")}
                        </p>
                    </div>
                </div>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-[var(--error-color)]/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--error-color)]" />
                    </button>
                )}
            </div>

            {/* Team Name */}
            <div>
                <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {t("departments.newDepartmentForm.setupTeams.teamName")} <span className="text-[var(--error-color)]">*</span>
                </label>
                <input
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 transition-all ${
                        newTeam.name.trim() 
                            ? 'border-[#15919B]/30 focus:border-[#15919B]' 
                            : 'border-[var(--border-color)] focus:border-[#15919B]'
                    }`}
                    placeholder={t("departments.newDepartmentForm.setupTeams.teamName")}
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    dir={isArabic ? 'rtl' : 'ltr'}
                />
            </div>

            {/* Team Leader Section */}
            <div className="space-y-3 p-4 bg-gradient-to-br from-[#09D1C7]/5 to-transparent rounded-xl border border-[#09D1C7]/20">
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Crown className="w-4 h-4 text-[#09D1C7]" />
                    <label className={`text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t("departments.newDepartmentForm.setupTeams.teamLeader")} <span className="text-[var(--error-color)]">*</span>
                    </label>
                </div>

                {/* Filters for Leader */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative" ref={leaderDepartmentFilterRef}>
                        <div
                            className="form-input cursor-pointer flex items-center justify-between text-sm"
                            onClick={() => setIsLeaderDepartmentFilterOpen(!isLeaderDepartmentFilterOpen)}
                        >
                            <span className="text-[var(--sub-text-color)]">
                                {leaderDepartment !== "all" 
                                    ? departments.find(d => d.id === leaderDepartment)?.name || "Department"
                                    : t("allTeams.addTeam.filters.allDepartments", "All Departments")}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isLeaderDepartmentFilterOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isLeaderDepartmentFilterOpen && (
                            <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                                <div
                                    className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                    onClick={() => {
                                        setLeaderDepartment(departmentId || "all");
                                        setIsLeaderDepartmentFilterOpen(false);
                                    }}
                                >
                                    <span className="text-sm text-[var(--text-color)]">{t("allTeams.addTeam.filters.allDepartments", "All Departments")}</span>
                                </div>
                                {departments.map(dept => (
                                    <div
                                        key={dept.id}
                                        className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                        onClick={() => {
                                            setLeaderDepartment(dept.id);
                                            setIsLeaderDepartmentFilterOpen(false);
                                        }}
                                    >
                                        <span className="text-sm text-[var(--text-color)]">{dept.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={leaderRoleFilterRef}>
                        <div
                            className="form-input cursor-pointer flex items-center justify-between text-sm"
                            onClick={() => setIsLeaderRoleFilterOpen(!isLeaderRoleFilterOpen)}
                        >
                            <span className="text-[var(--sub-text-color)]">
                                {leaderRole !== "all" 
                                    ? roles.find(r => r.id === leaderRole)?.name || "Role"
                                    : t("allTeams.addTeam.filters.allRoles", "All Roles")}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isLeaderRoleFilterOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isLeaderRoleFilterOpen && (
                            <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                                {isLoadingRoles ? (
                                    <div className="p-4 text-center text-[var(--sub-text-color)]">Loading roles...</div>
                                ) : isErrorRoles ? (
                                    <div className="p-4 text-center text-[var(--error-color)]">Failed to load roles</div>
                                ) : (
                                    <>
                                        <div
                                            className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                            onClick={() => {
                                                setLeaderRole("all");
                                                setIsLeaderRoleFilterOpen(false);
                                            }}
                                        >
                                            <span className="text-sm text-[var(--text-color)]">{t("allTeams.addTeam.filters.allRoles", "All Roles")}</span>
                                        </div>
                                        {roles && roles.length > 0 ? (
                                            roles.map(role => (
                                                <div
                                                    key={role.id}
                                                    className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                                    onClick={() => {
                                                        setLeaderRole(role.id);
                                                        setIsLeaderRoleFilterOpen(false);
                                                    }}
                                                >
                                                    <span className="text-sm text-[var(--text-color)]">{role.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-[var(--sub-text-color)]">
                                                {t("allTeams.addTeam.filters.noRoles", "No active roles found")}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search for Leader */}
                <div className="relative">
                    <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#09D1C7]`} />
                    <input
                        type="text"
                        value={leaderNameSearch}
                        onChange={(e) => {
                            setLeaderNameSearch(e.target.value);
                            // Open dropdown when user starts typing
                            if (e.target.value.trim() && !newTeam.teamLeader) {
                                setIsLeaderDropdownOpen(true);
                            }
                        }}
                        onFocus={() => {
                            // Open dropdown when input is focused and there's no leader selected
                            if (!newTeam.teamLeader) {
                                setIsLeaderDropdownOpen(true);
                            }
                        }}
                        placeholder={t("allTeams.addTeam.searchName", "Search by name or email...")}
                        className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#09D1C7]/50 focus:border-[#09D1C7]`}
                        dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>

                {/* Selected Leader */}
                {newTeam.teamLeader && (
                    <div className="p-3 bg-gradient-to-r from-[#09D1C7]/10 to-[#09D1C7]/5 rounded-lg border border-[#09D1C7]/20">
                        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#09D1C7]/30 to-[#09D1C7]/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#09D1C7]" />
                                </div>
                                <div className={isArabic ? 'text-right' : 'text-left'}>
                                    <p className="text-sm font-bold text-[var(--text-color)]">{getUserDisplayName(newTeam.teamLeader)}</p>
                                    <p className="text-xs text-[var(--sub-text-color)]">{getUserDisplayInfo(newTeam.teamLeader)}</p>
                                </div>
                            </div>
                            <button
                                onClick={removeTeamLeader}
                                className="p-1 hover:bg-[var(--error-color)]/10 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-[var(--error-color)]" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Leader Dropdown */}
                {!newTeam.teamLeader && (
                    <div className="relative" ref={leaderDropdownRef}>
                        <div
                            className="form-input cursor-pointer flex items-center justify-between"
                            onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)}
                        >
                            <span className="text-[var(--sub-text-color)]">
                                {t("allTeams.addTeam.clickToSelect", "Click to select team leader")}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isLeaderDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isLeaderDropdownOpen && (
                            <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[#09D1C7]/30 rounded-lg shadow-lg max-h-60 overflow-hidden`}>
                                <div className="overflow-y-auto max-h-60">
                                    {isLoadingLeaderUsers ? (
                                        <div className="p-4 text-center text-[var(--sub-text-color)]">Loading...</div>
                                    ) : paginatedLeaderUsers.length > 0 ? (
                                        <>
                                            {paginatedLeaderUsers.map(user => {
                                                const userId = user?.id || user?.userId;
                                                return (
                                                    <div
                                                        key={userId}
                                                        className="p-3 hover:bg-[#09D1C7]/10 cursor-pointer border-b border-[var(--border-color)] last:border-b-0"
                                                        onClick={() => selectTeamLeader(user)}
                                                    >
                                                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#09D1C7]/20 to-[#09D1C7]/10 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-[#09D1C7]" />
                                                            </div>
                                                            <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                                <p className="text-sm font-medium text-[var(--text-color)]">{getUserDisplayName(user)}</p>
                                                                <p className="text-xs text-[var(--sub-text-color)]">{getUserDisplayInfo(user)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {availableLeaderUsers.length > itemsPerPage && (
                                                <div className={`p-2 flex items-center justify-between border-t border-[var(--border-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    <button
                                                        onClick={() => setLeaderPage(prev => Math.max(1, prev - 1))}
                                                        disabled={leaderPage === 1}
                                                        className="px-3 py-1 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-50"
                                                    >
                                                        {t("common.previous", "Previous")}
                                                    </button>
                                                    <span className="text-xs text-[var(--sub-text-color)]">
                                                        {t("allTeams.addTeam.showing", "Showing")} {(leaderPage - 1) * itemsPerPage + 1}-{Math.min(leaderPage * itemsPerPage, availableLeaderUsers.length)} {t("allTeams.addTeam.of", "of")} {availableLeaderUsers.length}
                                                    </span>
                                                    <button
                                                        onClick={() => setLeaderPage(prev => prev + 1)}
                                                        disabled={leaderPage * itemsPerPage >= availableLeaderUsers.length}
                                                        className="px-3 py-1 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-50"
                                                    >
                                                        {t("common.next", "Next")}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="p-4 text-center text-[var(--sub-text-color)]">
                                            {t("allTeams.addTeam.noUsersMatch", "No users found")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Team Members Section */}
            <div className="space-y-3 p-4 bg-gradient-to-br from-[#15919B]/5 to-transparent rounded-xl border border-[#15919B]/20">
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Users className="w-4 h-4 text-[#15919B]" />
                    <label className={`text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                        {t("departments.newDepartmentForm.setupTeams.membersLabel")} <span className="text-xs text-[var(--sub-text-color)]">({t("common.optional", "Optional")})</span>
                    </label>
                </div>

                {/* Selected Members */}
                {newTeam.selectedEmployees.length > 0 && (
                    <div className="space-y-2">
                        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-medium text-[var(--text-color)]">
                                {t("allTeams.addTeam.selectedMembers", "Selected Members")} ({newTeam.selectedEmployees.length})
                            </span>
                            <button
                                onClick={() => setNewTeam(prev => ({ ...prev, selectedEmployees: [] }))}
                                className="text-xs text-[var(--error-color)] hover:underline"
                            >
                                {t("allTeams.addTeam.clearFilters", "Clear all")}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newTeam.selectedEmployees.map(emp => {
                                const empId = emp?.id || emp?.userId;
                                return (
                                    <div
                                        key={empId}
                                        className="group flex items-center gap-2 px-3 py-2 bg-[#15919B]/10 rounded-lg border border-[#15919B]/30 hover:border-[#15919B]/50 transition-all"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#15919B]/20 to-[#15919B]/10 flex items-center justify-center">
                                            <User className="w-3 h-3 text-[#15919B]" />
                                        </div>
                                        <span className="text-xs font-medium text-[var(--text-color)]">{getUserDisplayName(emp)}</span>
                                        <button
                                            onClick={() => removeEmployee(empId)}
                                            className="p-0.5 hover:bg-[var(--error-color)]/10 rounded transition-colors"
                                        >
                                            <X className="w-3 h-3 text-[var(--error-color)]" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filters for Members */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative" ref={memberDepartmentFilterRef}>
                        <div
                            className="form-input cursor-pointer flex items-center justify-between text-sm"
                            onClick={() => setIsMemberDepartmentFilterOpen(!isMemberDepartmentFilterOpen)}
                        >
                            <span className="text-[var(--sub-text-color)]">
                                {memberDepartment !== "all" 
                                    ? departments.find(d => d.id === memberDepartment)?.name || "Department"
                                    : t("allTeams.addTeam.filters.allDepartments", "All Departments")}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isMemberDepartmentFilterOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isMemberDepartmentFilterOpen && (
                            <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                                <div
                                    className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                    onClick={() => {
                                        setMemberDepartment(departmentId || "all");
                                        setIsMemberDepartmentFilterOpen(false);
                                    }}
                                >
                                    <span className="text-sm text-[var(--text-color)]">{t("allTeams.addTeam.filters.allDepartments", "All Departments")}</span>
                                </div>
                                {departments.map(dept => (
                                    <div
                                        key={dept.id}
                                        className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                        onClick={() => {
                                            setMemberDepartment(dept.id);
                                            setIsMemberDepartmentFilterOpen(false);
                                        }}
                                    >
                                        <span className="text-sm text-[var(--text-color)]">{dept.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={memberRoleFilterRef}>
                        <div
                            className="form-input cursor-pointer flex items-center justify-between text-sm"
                            onClick={() => setIsMemberRoleFilterOpen(!isMemberRoleFilterOpen)}
                        >
                            <span className="text-[var(--sub-text-color)]">
                                {memberRole !== "all" 
                                    ? roles.find(r => r.id === memberRole)?.name || "Role"
                                    : t("allTeams.addTeam.filters.allRoles", "All Roles")}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isMemberRoleFilterOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {isMemberRoleFilterOpen && (
                            <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                                {isLoadingRoles ? (
                                    <div className="p-4 text-center text-[var(--sub-text-color)]">Loading roles...</div>
                                ) : isErrorRoles ? (
                                    <div className="p-4 text-center text-[var(--error-color)]">Failed to load roles</div>
                                ) : (
                                    <>
                                        <div
                                            className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                            onClick={() => {
                                                setMemberRole("all");
                                                setIsMemberRoleFilterOpen(false);
                                            }}
                                        >
                                            <span className="text-sm text-[var(--text-color)]">{t("allTeams.addTeam.filters.allRoles", "All Roles")}</span>
                                        </div>
                                        {roles && roles.length > 0 ? (
                                            roles.map(role => (
                                                <div
                                                    key={role.id}
                                                    className="p-2 hover:bg-[var(--hover-color)] cursor-pointer"
                                                    onClick={() => {
                                                        setMemberRole(role.id);
                                                        setIsMemberRoleFilterOpen(false);
                                                    }}
                                                >
                                                    <span className="text-sm text-[var(--text-color)]">{role.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-[var(--sub-text-color)]">
                                                {t("allTeams.addTeam.filters.noRoles", "No active roles found")}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search for Members */}
                <div className="relative">
                    <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[#15919B]`} />
                    <input
                        type="text"
                        value={memberNameSearch}
                        onChange={(e) => {
                            setMemberNameSearch(e.target.value);
                            // Open dropdown when user starts typing
                            if (e.target.value.trim()) {
                                setIsMembersDropdownOpen(true);
                            }
                        }}
                        onFocus={() => {
                            // Open dropdown when input is focused
                            setIsMembersDropdownOpen(true);
                        }}
                        placeholder={t("allTeams.addTeam.searchName", "Search by name or email...")}
                        className={`w-full ${isArabic ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 text-sm border-2 border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#15919B]/50 focus:border-[#15919B]`}
                        dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>

                {/* Members Dropdown */}
                <div className="relative" ref={membersDropdownRef}>
                    <div
                        className="form-input cursor-pointer flex items-center justify-between"
                        onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                    >
                        <span className="text-[var(--sub-text-color)]">
                            {newTeam.selectedEmployees.length > 0
                                ? `${newTeam.selectedEmployees.length} ${t("allTeams.addTeam.selected", "selected")}`
                                : t("allTeams.addTeam.clickToBrowse", "Click to browse and select members")}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[var(--sub-text-color)] transition-transform ${isMembersDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isMembersDropdownOpen && (
                        <div className={`absolute top-full ${isArabic ? 'right-0' : 'left-0'} z-30 mt-1 w-full bg-[var(--bg-color)] border-2 border-[#15919B]/30 rounded-lg shadow-lg max-h-60 overflow-hidden`}>
                            <div className="overflow-y-auto max-h-60">
                                {isLoadingMemberUsers ? (
                                    <div className="p-4 text-center text-[var(--sub-text-color)]">Loading...</div>
                                ) : paginatedMemberUsers.length > 0 ? (
                                    <>
                                        {paginatedMemberUsers.map(user => {
                                            const userId = user?.id || user?.userId;
                                            const isSelected = newTeam.selectedEmployees.some(emp => {
                                                const empId = emp?.id || emp?.userId;
                                                return String(empId) === String(userId);
                                            });
                                            return (
                                                <div
                                                    key={userId}
                                                    className={`p-3 cursor-pointer border-b border-[var(--border-color)] last:border-b-0 transition-colors ${
                                                        isSelected ? 'bg-[#15919B]/10' : 'hover:bg-[#15919B]/5'
                                                    }`}
                                                    onClick={() => toggleEmployee(user)}
                                                >
                                                    <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                isSelected 
                                                                    ? 'bg-gradient-to-br from-[#15919B]/30 to-[#15919B]/20' 
                                                                    : 'bg-gradient-to-br from-[#15919B]/10 to-[#15919B]/5'
                                                            }`}>
                                                                <User className={`w-4 h-4 ${isSelected ? 'text-[#15919B]' : 'text-[var(--sub-text-color)]'}`} />
                                                            </div>
                                                            <div className={isArabic ? 'text-right' : 'text-left'}>
                                                                <p className="text-sm font-medium text-[var(--text-color)]">{getUserDisplayName(user)}</p>
                                                                <p className="text-xs text-[var(--sub-text-color)]">{getUserDisplayInfo(user)}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                            isSelected 
                                                                ? 'border-[#15919B] bg-[#15919B]' 
                                                                : 'border-[var(--border-color)]'
                                                        }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {availableMemberUsers.length > itemsPerPage && (
                                            <div className={`p-2 flex items-center justify-between border-t border-[var(--border-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                <button
                                                    onClick={() => setMembersPage(prev => Math.max(1, prev - 1))}
                                                    disabled={membersPage === 1}
                                                    className="px-3 py-1 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-50"
                                                >
                                                    {t("common.previous", "Previous")}
                                                </button>
                                                <span className="text-xs text-[var(--sub-text-color)]">
                                                    {t("allTeams.addTeam.showing", "Showing")} {(membersPage - 1) * itemsPerPage + 1}-{Math.min(membersPage * itemsPerPage, availableMemberUsers.length)} {t("allTeams.addTeam.of", "of")} {availableMemberUsers.length}
                                                </span>
                                                <button
                                                    onClick={() => setMembersPage(prev => prev + 1)}
                                                    disabled={membersPage * itemsPerPage >= availableMemberUsers.length}
                                                    className="px-3 py-1 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-50"
                                                >
                                                    {t("common.next", "Next")}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-4 text-center text-[var(--sub-text-color)]">
                                        {t("allTeams.addTeam.noUsersMatch", "No users found")}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Description */}
            <div>
                <label className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {t("departments.newDepartmentForm.setupTeams.description")} <span className="text-xs text-[var(--sub-text-color)]">({t("common.optional", "Optional")})</span>
                </label>
                <textarea
                    className="w-full px-4 py-3 border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[#15919B]/50 focus:border-[#15919B] resize-none"
                    placeholder={t("departments.newDepartmentForm.setupTeams.description")}
                    rows="3"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    dir={isArabic ? 'rtl' : 'ltr'}
                />
            </div>

            {/* Action Buttons */}
            <div className={`flex gap-3 ${isArabic ? 'justify-start' : 'justify-end'}`}>
                {onCancel && (
                    <button
                        type="button"
                        className="px-6 py-3 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-color)] font-semibold hover:bg-[var(--hover-color)] transition-all"
                        onClick={onCancel}
                    >
                        {t("common.cancel", "Cancel")}
                    </button>
                )}
                <button
                    type="button"
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        newTeam.name.trim() && newTeam.teamLeader
                            ? 'bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white hover:shadow-lg hover:scale-105'
                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)] border-2 border-[var(--border-color)] cursor-not-allowed opacity-60'
                    }`}
                    onClick={handleSubmit}
                    disabled={!newTeam.name.trim() || !newTeam.teamLeader}
                >
                    <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Plus size={18} />
                        {submitLabel || (isEditMode ? t("departments.newDepartmentForm.buttons.update", "Update Team") : t("departments.newDepartmentForm.buttons.add", "Add Team"))}
                    </div>
                </button>
            </div>
        </div>
    );
}

