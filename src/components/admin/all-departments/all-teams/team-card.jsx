import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, Edit, Trash2, MoreVertical, User, Crown } from "lucide-react";
import TeamDetailsPopup from "./team-details/team-details-popup";
import TeamMemberItem from "./team-member-item";
import GroupDepartmentIcon from '/assets/groupDepartments.svg';

export default function TeamCard({ 
    team, 
    onEdit, 
    onDelete,
    canUpdate = true,
    canDelete = true,
    canRestore = true,
    canViewMembers = true,
    canAddMember = true,
    canUpdateMember = true,
    canRemoveMember = true
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = i18n.language === "ar";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const menuRef = React.useRef(null);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isMenuOpen]);

    const handleViewDetails = () => {
        setShowDetailsPopup(true);
    };

    const handleEditTeam = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(false);
        if (onEdit) {
            onEdit(team);
        }
    };

    const handleDeleteTeam = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(false);
        if (onDelete) {
            onDelete(team.id);
        }
    };

    const handleMenuToggle = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div
            className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] transition-all duration-300 relative overflow-hidden group hover:shadow-xl hover:border-[var(--accent-color)]/30 cursor-pointer"
            dir={isArabic ? "rtl" : "ltr"}
            onClick={handleViewDetails}
        >
            {/* Gradient Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-color)]/60"></div>
            
            <div className="p-6">
                {/* Team Header */}
                <div className={`flex items-start justify-between mb-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-start gap-4 flex-1 min-w-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Team Icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-color)]/10 to-[var(--accent-color)]/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <img src={GroupDepartmentIcon} alt="Team" className="w-7 h-7 opacity-80" />
                        </div>
                        
                        <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <h3 className="text-lg font-bold text-[var(--text-color)] mb-1 truncate group-hover:text-[var(--accent-color)] transition-colors">
                                {team.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-[var(--sub-text-color)]" />
                                    <p className="text-sm font-medium text-[var(--sub-text-color)]">
                                        {team.isLoadingMembers ? (
                                            <span className="text-xs">Loading...</span>
                                        ) : (
                                            <>
                                                {team.memberCount || team.members?.length || team.memberUserIds?.length || 0} {t("allTeams.teamCard.members")}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center gap-2 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Member Count Badge */}
                        {(team.memberCount > 0 || team.memberUserIds?.length > 0) && (
                            <div className="px-3 py-1.5 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-[var(--accent-color)]">
                                    {team.memberCount || team.memberUserIds?.length || 0}
                                </span>
                            </div>
                        )}

                        {/* Three Dot Menu - Only show if user has any action permissions */}
                        {(canUpdate || canDelete || canRestore) && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={handleMenuToggle}
                                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                                        isMenuOpen 
                                            ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' 
                                            : 'hover:bg-[var(--hover-color)] text-[var(--sub-text-color)]'
                                    }`}
                                    aria-label="More options"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        {/* Subtle backdrop overlay */}
                                        <div 
                                            className="fixed inset-0 z-[9]"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        
                                        {/* Enhanced dropdown menu */}
                                        <div 
                                            className={`absolute top-full mt-2 w-48 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl z-[10] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${isArabic ? 'right-0' : 'left-0'}`}
                                            style={{
                                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)'
                                            }}
                                        >
                                            {canUpdate && (
                                                <button
                                                    onClick={handleEditTeam}
                                                    className={`w-full px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-[var(--accent-color)]/5 hover:to-[var(--accent-color)]/10 transition-all duration-200 flex items-center gap-3 text-[var(--text-color)] border-b border-[var(--border-color)] group ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-200">
                                                        <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="font-medium flex-1">{t("allTeams.teamCard.edit", "Edit Team")}</span>
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={handleDeleteTeam}
                                                    className={`w-full px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/10 dark:hover:to-red-900/20 transition-all duration-200 flex items-center gap-3 text-red-600 dark:text-red-400 group ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-200">
                                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                                    </div>
                                                    <span className="font-medium flex-1">{t("allTeams.teamCard.delete", "Delete Team")}</span>
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Lead Section */}
                {(team.lead || team.teamLeader) && team.lead !== "Unknown" && (
                    <>
                        <div className="my-5 border-t border-[var(--border-color)]"></div>
                        <div className={`flex items-center gap-3 p-3 bg-[var(--container-color)]/30 rounded-xl ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                {team.leadAvatar ? (
                                    <img
                                        src={team.leadAvatar}
                                        alt={team.lead || 'Team Leader'}
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                ) : (
                                    <Crown className="w-5 h-5 text-[var(--accent-color)]" />
                                )}
                            </div>
                            <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-[var(--accent-color)] uppercase">
                                        {t("allTeams.teamCard.lead", "Team Lead")}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                    {team.lead || (team.teamLeader 
                                        ? `${team.teamLeader.firstName || ''} ${team.teamLeader.lastName || ''}`.trim() || team.teamLeader.userName || team.teamLeader.email || 'Team Leader'
                                        : 'Team Leader')}
                                </p>
                                {(team.leadRole || team.teamLeader?.jobTitle) && (
                                    <p className="text-xs text-[var(--sub-text-color)] truncate">
                                        {team.leadRole || team.teamLeader?.jobTitle}
                                    </p>
                                )}
                                {team.teamLeader?.email && !team.leadRole && !team.teamLeader?.jobTitle && (
                                    <p className="text-xs text-[var(--sub-text-color)] truncate">
                                        {team.teamLeader.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Team Members List - Only show if user has permission to view members */}
                {canViewMembers && (
                    <>
                        {(team.memberUserIds?.length > 0 || team.memberCount > 0) && (
                            <div className="my-5 border-t border-[var(--border-color)]"></div>
                        )}
                        {team.isLoadingMembers ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-[var(--container-color)]/30 rounded-xl">
                                        <div className="w-10 h-10 bg-[var(--container-color)] rounded-lg"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-[var(--container-color)] rounded w-1/2"></div>
                                            <div className="h-2 bg-[var(--container-color)] rounded w-1/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : team.memberUserIds && team.memberUserIds.length > 0 ? (
                            <div className="space-y-2">
                                {team.memberUserIds.slice(0, 3).map((userId) => (
                                    <div
                                        key={userId}
                                        className="group/member p-3 bg-[var(--container-color)]/30 rounded-xl hover:bg-[var(--accent-color)]/5 border border-transparent hover:border-[var(--accent-color)]/20 transition-all duration-200"
                                    >
                                        <TeamMemberItem 
                                            userId={userId} 
                                            isArabic={isArabic}
                                            canUpdateMember={canUpdateMember}
                                            canRemoveMember={canRemoveMember}
                                        />
                                    </div>
                                ))}
                                {team.memberUserIds.length > 3 && (
                                    <div className="text-center pt-2">
                                        <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--container-color)]/50 border border-dashed border-[var(--border-color)]">
                                            <User className="w-3 h-3 text-[var(--sub-text-color)]" />
                                            <span className="text-xs font-medium text-[var(--sub-text-color)]">
                                                +{team.memberUserIds.length - 3} {t("allTeams.teamCard.moreMembers", "more members")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--container-color)]/30 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-[var(--sub-text-color)] opacity-30" />
                                </div>
                                <p className="text-sm text-[var(--sub-text-color)]">
                                    {t("allTeams.teamCard.noMembers", "No members yet")}
                                </p>
                            </div>
                        )}
                    </>
                )}
                
                {!canViewMembers && (
                    <div className="my-5 border-t border-[var(--border-color)]"></div>
                )}
                
                {!canViewMembers && (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--container-color)]/30 flex items-center justify-center">
                            <User className="w-6 h-6 text-[var(--sub-text-color)] opacity-30" />
                        </div>
                        <p className="text-xs text-[var(--sub-text-color)]">
                            {t("allTeams.teamCard.noPermissionViewMembers", "You don't have permission to view team members")}
                        </p>
                    </div>
                )}
            </div>

            {/* Team Details Popup */}
            <TeamDetailsPopup
                isOpen={showDetailsPopup}
                onClose={() => setShowDetailsPopup(false)}
                team={team}
            />
        </div>
    );
}
