import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";

const EmployeeCard = ({
    name,
    position,
    role,
    department,
    departments = [],
    teams = [],
    joinDate,
    status,
    avatar,
    onCardClick,
    className = "",
    onView,
    onEdit,
    onDelete,
    canViewAllProfiles = true,
    canUpdate = true,
    canDelete = true
}) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const textAlign = isArabic ? "text-right" : "text-left";
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Status color mapping
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "active":
                return {
                    bg: "#dcfce7",
                    text: "#059669",
                    border: "#bbf7d0"
                };
            case "inactive":
                return {
                    bg: "#fef2f2",
                    text: "#dc2626",
                    border: "#fecaca"
                };
            case "pending":
                return {
                    bg: "#fef3c7",
                    text: "#d97706",
                    border: "#fde68a"
                };
            default:
                return {
                    bg: "#f3f4f6",
                    text: "#6b7280",
                    border: "#d1d5db"
                };
        }
    };

    const statusColors = getStatusColor(status);

    // Handle action clicks
    const handleView = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(false);
        if (onView) {
            onView();
            return;
        }
        console.log("View employee:", name);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(false);
        if (onEdit) {
            onEdit();
            return;
        }
        console.log("Edit employee:", name);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(false);
        if (onDelete) {
            onDelete();
            return;
        }
        console.log("Delete employee:", name);
    };

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div
            className={`relative rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col ${className} ${
                canViewAllProfiles ? 'cursor-pointer hover:shadow-2xl hover:scale-[1.05]' : 'cursor-default'
            }`}
            style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
                height: '100%',
                minHeight: '280px',
                overflow: 'visible',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                zIndex: 1
            }}
            onClick={canViewAllProfiles ? onCardClick : undefined}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.zIndex = '9999'; // Bring card to front on hover for tooltips
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.zIndex = '1'; // Reset z-index when not hovering
            }}
            dir={isArabic ? "rtl" : "ltr"}
        >
            {/* Three dots menu - Only show if user has any action permissions */}
            {(canViewAllProfiles || canUpdate || canDelete) && (
                <div className={`absolute top-3 z-10 ${isArabic ? 'left-3' : 'right-3'}`} ref={dropdownRef}>
                    <button
                        onClick={toggleDropdown}
                        className="p-1.5 rounded-lg hover:bg-[var(--hover-color)] transition-all"
                        style={{
                            color: 'var(--accent-color)',
                            backgroundColor: isDropdownOpen ? 'var(--hover-color)' : 'transparent'
                        }}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Enhanced Dropdown Menu */}
                    {isDropdownOpen && (
                        <div
                            className={`absolute top-10 ${isArabic ? 'left-0' : 'right-0'} mt-1 w-40 rounded-xl border-2 shadow-xl z-20`}
                            style={{
                                backgroundColor: 'var(--bg-color)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <div className="py-2">
                                {canViewAllProfiles && (
                                    <button
                                        onClick={handleView}
                                        className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[var(--hover-color)] transition-colors ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
                                        style={{ color: 'var(--text-color)' }}
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                                        <span className="font-medium">{t("employees.actions.view", "View")}</span>
                                    </button>
                                )}
                                {canUpdate && (
                                    <button
                                        onClick={handleEdit}
                                        className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[var(--hover-color)] transition-colors ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
                                        style={{ color: 'var(--text-color)' }}
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                                        <span className="font-medium">{t("employees.actions.edit", "Edit")}</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <>
                                        {(canViewAllProfiles || canUpdate) && (
                                            <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />
                                        )}
                                        <button
                                            onClick={handleDelete}
                                            className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-red-50 transition-colors ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
                                            style={{ color: 'var(--error-color)' }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="font-medium">{t("employees.actions.delete", "Delete")}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top Section: Avatar + Name + Position + Role */}
            <div className="flex flex-col items-center mb-4">
                {/* Avatar with gradient ring and checkmark */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden p-0.5 gradient-bg shadow-lg">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                <img
                                    src={avatar}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=15919B&color=fff&size=80`;
                                    }}
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full gradient-bg border-3 border-white shadow-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Name */}
                <div className="text-center mb-2">
                    <h3
                        className={`text-lg font-bold ${textAlign} truncate max-w-full px-2`}
                        style={{ color: 'var(--text-color)' }}
                        title={name}
                    >
                        {name}
                    </h3>
                </div>

                {/* Job Title - Separate from Role */}
                <div className="text-center mb-2">
                    <p
                        className={`text-sm ${textAlign} truncate max-w-full font-semibold px-2`}
                        style={{ color: 'var(--sub-text-color)' }}
                        title={position}
                    >
                        {position}
                    </p>
                </div>

                {/* Role - Separate pill badge */}
                {role && role !== "N/A" && (
                    <div className="text-center">
                        <span
                            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold"
                            style={{
                                backgroundColor: 'var(--accent-color)',
                                color: 'white',
                                boxShadow: '0 2px 4px rgba(21, 145, 155, 0.3)'
                            }}
                            title={role}
                        >
                            {role}
                        </span>
                    </div>
                )}
            </div>

            {/* Middle Section: Details with hover tooltips */}
            <div className="flex-1 space-y-2.5 mb-4">
                {/* Department - Clean layout without border on value */}
                <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span
                        className={`text-[11px] font-bold uppercase ${textAlign} flex-shrink-0 pt-0.5`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("employees.department", "DEPT")}:
                    </span>
                    <div className="relative group flex-1 flex justify-end">
                        {departments && departments.length > 0 ? (
                            <>
                                <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span
                                        className={`text-xs font-bold ${textAlign} truncate max-w-[85px]`}
                                        style={{ color: 'var(--accent-color)' }}
                                    >
                                        {departments[0]}
                                    </span>
                                    {departments.length > 1 && (
                                        <span
                                            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold"
                                            style={{
                                                backgroundColor: 'var(--accent-color)',
                                                color: 'white'
                                            }}
                                        >
                                            +{departments.length - 1}
                                        </span>
                                    )}
                                </div>
                                {/* Hover tooltip for multiple departments - Higher z-index */}
                                {departments.length > 1 && (
                                    <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} top-full mt-2 hidden group-hover:block z-[9999] w-max max-w-[220px]`}>
                                        <div className="rounded-xl border-2 shadow-2xl p-3 backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--accent-color)' }}>
                                            <p className="text-xs font-bold mb-2 gradient-text">
                                                {t("employees.allDepartments", "All Departments")}
                                            </p>
                                            <div className="space-y-1.5">
                                                {departments.map((dept, idx) => (
                                                    <div key={idx} className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                        <span className="w-2 h-2 rounded-full gradient-bg flex-shrink-0" />
                                                        <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>{dept}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <span
                                className={`text-xs font-bold ${textAlign}`}
                                style={{ color: 'var(--accent-color)' }}
                            >
                                {department}
                            </span>
                        )}
                    </div>
                </div>

                {/* Teams - Clean layout without border on value */}
                <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span
                        className={`text-[11px] font-bold uppercase ${textAlign} flex-shrink-0 pt-0.5`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("employees.team", "TEAM")}:
                    </span>
                    <div className="relative group flex-1 flex justify-end">
                        {teams && teams.length > 0 ? (
                            <>
                                <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span
                                        className={`text-xs font-bold ${textAlign} truncate max-w-[85px]`}
                                        style={{ color: 'var(--accent-color)' }}
                                    >
                                        {teams[0]}
                                    </span>
                                    {teams.length > 1 && (
                                        <span
                                            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold"
                                            style={{
                                                backgroundColor: 'var(--accent-color)',
                                                color: 'white'
                                            }}
                                        >
                                            +{teams.length - 1}
                                        </span>
                                    )}
                                </div>
                                {/* Hover tooltip for multiple teams - Higher z-index */}
                                {teams.length > 1 && (
                                    <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} top-full mt-2 hidden group-hover:block z-[9999] w-max max-w-[220px]`}>
                                        <div className="rounded-xl border-2 shadow-2xl p-3 backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--accent-color)' }}>
                                            <p className="text-xs font-bold mb-2 gradient-text">
                                                {t("employees.allTeams", "All Teams")}
                                            </p>
                                            <div className="space-y-1.5">
                                                {teams.map((team, idx) => (
                                                    <div key={idx} className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                        <span className="w-2 h-2 rounded-full gradient-bg flex-shrink-0" />
                                                        <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>{team}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className="text-xs font-bold" style={{ color: 'var(--sub-text-color)' }}>-</span>
                        )}
                    </div>
                </div>

                {/* Join Date - Clean layout */}
                <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span
                        className={`text-[11px] font-bold uppercase ${textAlign} flex-shrink-0 pt-0.5`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("employees.joinDate", "JOINED")}:
                    </span>
                    <div className="flex-1 flex justify-end">
                        <span
                            className={`text-xs font-bold ${textAlign}`}
                            style={{ color: 'var(--accent-color)' }}
                        >
                            {joinDate}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Enhanced Status Badge with full width */}
            <div className="flex justify-center mt-auto pt-3 border-t-2" style={{ borderColor: 'var(--border-color)' }}>
                <span
                    className="w-full text-center px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border-2 shadow-md"
                    style={{
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        borderColor: statusColors.border
                    }}
                >
                    {t(`employees.status.${status.toLowerCase()}`, status)}
                </span>
            </div>
        </div>
    );
};

export default EmployeeCard;