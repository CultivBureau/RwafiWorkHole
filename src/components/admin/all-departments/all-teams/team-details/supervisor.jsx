import React from 'react';
import { useTranslation } from 'react-i18next';

const SupervisorOverview = ({ team }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';

    // Get supervisor from team data if available
    const supervisor = team?.supervisor || team?.teamLead || null;

    if (!supervisor) {
        return null; // Don't render if no supervisor data
    }

    const supervisorName = supervisor?.name || 
                           `${supervisor?.firstName || ''} ${supervisor?.lastName || ''}`.trim() || 
                           supervisor?.email || 
                           null;

    if (!supervisorName) {
        return null;
    }

    return (
        <div className="bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)] shadow-sm flex flex-col" style={{ minHeight: '200px' }}>
            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">
                {t('teamDetails.supervisorOverview.title')}
            </h3>
            
            <div className="space-y-2 overflow-auto" style={{ maxHeight: '250px' }}>
                {/* Supervisor */}
                <div className="bg-[var(--bg-color)] rounded-lg px-4 py-2 border border-[var(--border-color)] shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {supervisor?.avatar && (
                                <img
                                    src={supervisor.avatar}
                                    alt={supervisorName}
                                    className="w-12 h-12 rounded-full"
                                />
                            )}
                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                <h4 className="font-semibold text-[var(--text-color)]">{supervisorName}</h4>
                                {(supervisor?.jobTitle || supervisor?.role) && (
                                    <p className="text-sm text-[var(--sub-text-color)]">
                                        {supervisor?.jobTitle || supervisor?.role}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* Supervisor Stats - Only show if available from API */}
                        {(supervisor?.kpiScore || supervisor?.approvals || supervisor?.lastActivity) && (
                            <div className={`flex items-center justify-between flex-1 ${isRtl ? 'mr-8' : 'ml-8'}`}>
                                {supervisor?.kpiScore !== undefined && (
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-2 border border-cyan-200 shadow-sm">
                                            <div className="text-lg font-bold text-[var(--accent-color)]">{supervisor.kpiScore}%</div>
                                        </div>
                                        <div className={`text-xs text-[var(--sub-text-color)] ${isRtl ? 'text-right' : 'text-left'}`}>
                                            {t('teamDetails.supervisorOverview.teamKpi')}<br/>{t('teamDetails.supervisorOverview.achievement')}
                                        </div>
                                    </div>
                                )}
                                
                                {supervisor?.approvals !== undefined && (
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-2 border border-cyan-200 shadow-sm">
                                            <div className="text-lg font-bold text-[var(--accent-color)]">{supervisor.approvals}</div>
                                        </div>
                                        <div className={`text-xs text-[var(--sub-text-color)] ${isRtl ? 'text-right' : 'text-left'}`}>
                                            {t('teamDetails.supervisorOverview.approvals')}<br/>{t('teamDetails.supervisorOverview.reviews')}
                                        </div>
                                    </div>
                                )}
                                
                                {supervisor?.lastActivity && (
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-2 border border-cyan-200 shadow-sm text-center">
                                            <div className="text-sm font-semibold text-[var(--accent-color)]">
                                                {supervisor.lastActivity.time || 'N/A'}
                                            </div>
                                            <div className="text-xs text-[var(--accent-color)]">
                                                {supervisor.lastActivity.date || 'N/A'}
                                            </div>
                                        </div>
                                        <div className={`text-xs text-[var(--sub-text-color)] ${isRtl ? 'text-right' : 'text-left'}`}>
                                            {t('teamDetails.supervisorOverview.lastSystem')}<br/>{t('teamDetails.supervisorOverview.activity')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupervisorOverview;
