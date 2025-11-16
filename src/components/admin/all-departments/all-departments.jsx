import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import DepartmentCard from "./department-card";
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi";
import { useGetTeamsByDepartmentQuery } from "../../../services/apis/TeamApi";
import { useHasPermission } from "../../../hooks/useHasPermission";

export default function AllDepartments() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("active"); // "active" or "inactive" - default to "active"
    const navigate = useNavigate();
    
    // Permission checks
    const canCreate = useHasPermission('Department.Create');
    const canUpdate = useHasPermission('Department.Update');
    const canDelete = useHasPermission('Department.Delete');
    const canRestore = useHasPermission('Department.Restore');

    const handleAddNewDepartment = () => {
        navigate('/pages/admin/new-department');
    };
    
    // API: load departments and teams with status filter
    // Always send status parameter (either "active" or "inactive")
    const queryArgs = useMemo(() => {
        return { 
            pageNumber: 1, 
            pageSize: 20,
            status: statusFilter // "active" or "inactive"
        };
    }, [statusFilter]);
    
    const { data, isLoading, isError, refetch } = useGetAllDepartmentsQuery(queryArgs);
    
    const departmentsFromApi = useMemo(() => {
        const items = data?.value || data?.data || data?.items || data || [];
        return Array.isArray(items) ? items : [];
    }, [data]);

    // Map to card-safe structure (fallbacks for legacy UI fields)
    const mapped = useMemo(() => (
        departmentsFromApi.map((d) => {
            // Teams may come from API response, or DepartmentCard will fetch them per department
            // If teams are included in department response, use them; otherwise empty array
            const departmentTeams = (d.teams || []).map(team => {
                // Extract team leader information from new API structure
                const teamLeader = team.teamLeader || team.teamLead || null;
                const teamLeaderName = teamLeader 
                    ? `${teamLeader.firstName || ''} ${teamLeader.lastName || ''}`.trim() || teamLeader.userName || teamLeader.email || 'Unknown'
                    : null;
                
                // Count members: team leader (1) + employees (team.members?.length or totalMembers)
                const teamLeaderCount = teamLeader ? 1 : 0;
                // Try to get actual members array length, fallback to totalMembers (which should include leader)
                const employeesCount = team.members?.length || (team.totalMembers ? Math.max(0, team.totalMembers - 1) : 0);
                const totalMembersCount = teamLeaderCount + employeesCount;
                
                // Use the calculated count or API's totalMembers (which might already include leader)
                const finalCount = totalMembersCount > 0 ? totalMembersCount : (team.totalMembers || team.memberCount || 0);
                
                return {
                    id: team.id,
                    name: team.name,
                    description: team.description || null,
                    memberCount: finalCount,
                    teamLeader: teamLeaderName,
                    teamLeaderJobTitle: teamLeader?.jobTitle || null,
                };
            });
            
            return {
                id: d.id,
                name: d.name,
                description: d.description,
                supervisorId: d.supervisorId,
                status: d.status, // Include status field from API
                isDeleted: d.isDeleted,
                deleted: d.deleted,
                totalMembers: d.totalMembers || 0,
                memberAvatars: [],
                teams: departmentTeams, // May be empty - DepartmentCard will fetch teams per department
            };
        })
    ), [departmentsFromApi]);

    // Filter departments by search term only (status filtering is done by API)
    const filteredDepartments = useMemo(() => {
        return mapped.filter(department => {
            // Apply search filter (status filtering is handled by API)
            return !searchTerm || 
                department.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                department.description?.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [mapped, searchTerm]);

    return (
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            {/* Search, Filter and Action Buttons */}
            <div className={`flex flex-col gap-4 ${isArabic ? '' : ''}`}>
                <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search
                            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 ${isArabic ? 'right-3' : 'left-3'}`}
                            style={{ color: 'var(--sub-text-color)' }}
                        />
                        <input
                            type="text"
                            placeholder={t("allDepartments.search.placeholder")}
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
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Status Filter */}
                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <Filter className="text-[var(--sub-text-color)]" size={16} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--text-color)',
                                    focusRingColor: 'var(--accent-color)',
                                }}
                            >
                                <option value="active">{t("allDepartments.filter.active", "Active")}</option>
                                <option value="inactive">{t("allDepartments.filter.inactive", "Inactive")}</option>
                            </select>
                        </div>
                        
                        {canCreate && (
                            <button 
                                onClick={handleAddNewDepartment}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">{t("allDepartments.search.addNewDepartment")}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">Failed to load departments</h3>
                        <button onClick={() => refetch()} className="btn-secondary">Retry</button>
                    </div>
                ) : filteredDepartments.length > 0 ? (
                    filteredDepartments.map((department) => (
                        <DepartmentCard 
                            key={department.id} 
                            department={department} 
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            canRestore={canRestore}
                            onDelete={(departmentId) => {
                                // Refetch departments after deletion
                                refetch();
                            }}
                        />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-[var(--container-color)] rounded-full flex items-center justify-center mb-4">
                            <Search className="text-[var(--sub-text-color)]" size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">
                            No departments found
                        </h3>
                        <p className="text-[var(--sub-text-color)] max-w-sm">
                            {searchTerm 
                                ? `No departments match "${searchTerm}". Try adjusting your search.`
                                : "No departments available at the moment."
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {filteredDepartments.length > 0 && (
                <div className={`text-sm text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                    Showing {filteredDepartments.length} {statusFilter === "active" ? "active" : "inactive"} department{filteredDepartments.length !== 1 ? "s" : ""}
                    {searchTerm && ` matching "${searchTerm}"`}
                </div>
            )}
        </div>
    );
}
