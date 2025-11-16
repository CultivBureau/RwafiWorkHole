import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Popup from "../common/Popup";
import CustomToast from "../common/CustomToast";
import ClockInPopup from "../Time_Tracking_Components/ClockInPopup/ClockInPopup";
import LeaveRequest from "../leave-requests/leave-request";

const QuickActions = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    // State for popups and toast
    const [activePopup, setActivePopup] = useState(null);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Custom toast function
    const showToast = (message) => {
        setToastMessage(message);
        setToastVisible(true);
    };

    const hideToast = () => {
        setToastVisible(false);
    };

    const closePopup = () => {
        setActivePopup(null);
    };

    const actions = [
        {
            id: 'clockIn',
            icon: "/assets/quick_actions/clock_in.svg",
            title: t("dashboard.quickActions.clockIn.title"),
            subtitle: t("dashboard.quickActions.clockIn.subtitle"),
            implemented: true,
        },
        {
            id: 'requestLeave',
            icon: "/assets/quick_actions/leave.svg",
            title: t("dashboard.quickActions.requestLeave.title"),
            subtitle: t("dashboard.quickActions.requestLeave.subtitle"),
            implemented: true,
        },
        {
            id: 'newTask',
            icon: "/assets/quick_actions/task.svg",
            title: t("dashboard.quickActions.newTask.title"),
            subtitle: t("dashboard.quickActions.newTask.subtitle"),
            implemented: false,
        },
        {
            id: 'myKpis',
            icon: "/assets/quick_actions/kpis.svg",
            title: t("dashboard.quickActions.myKpis.title"),
            subtitle: t("dashboard.quickActions.myKpis.subtitle"),
            implemented: false,
        },
        {
            id: 'askAi',
            icon: "/assets/quick_actions/ai.svg",
            title: t("dashboard.quickActions.askAi.title"),
            subtitle: t("dashboard.quickActions.askAi.subtitle"),
            implemented: false,
        },
        {
            id: 'myTasks',
            icon: "/assets/quick_actions/my_tasks.svg",
            title: t("dashboard.quickActions.myTasks.title"),
            subtitle: t("dashboard.quickActions.myTasks.subtitle"),
            implemented: false,
        },
    ];

    const handleActionClick = (action) => {
        if (!action.implemented) {
            showToast(t('comingSoon') || 'Coming Soon!');
            return;
        }

        // Handle implemented actions
        switch (action.id) {
            case 'clockIn':
                setActivePopup('clockIn');
                break;
            case 'requestLeave':
                setActivePopup('requestLeave');
                break;
            default:
                showToast(t('comingSoon') || 'Coming Soon!');
        }
    };

    const renderPopupContent = () => {
        switch (activePopup) {
            case 'clockIn':
                return (
                    <Popup
                        isOpen={activePopup === 'clockIn'}
                        onClose={closePopup}
                        title={t("dashboard.quickActions.clockIn.title")}
                        maxWidth="90vw"
                        className="sm:max-w-[800px]"
                    >
                        <ClockInPopup />
                    </Popup>
                );
            case 'requestLeave':
                return (
                    <Popup
                        isOpen={activePopup === 'requestLeave'}
                        onClose={closePopup}
                        title={t("dashboard.quickActions.requestLeave.title")}
                        maxWidth="90vw"
                        className="sm:max-w-[500px]"
                    >
                        <div className="h-[60vh] sm:h-[400px]">
                            <LeaveRequest />
                        </div>
                    </Popup>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Custom Toast */}
            <CustomToast
                message={toastMessage}
                isVisible={toastVisible}
                onClose={hideToast}
                isArabic={isArabic}
            />

            {/* Popup */}
            {renderPopupContent()}

            {/* Quick Actions Component */}
            <div
                className={` rounded-2xl shadow-lg border p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 2xl:p-7 h-full flex flex-col quick-actions-container ${isArabic ? "text-right" : "text-left"
                    }`}
                style={{
                    background: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                }}
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Header */}
                <h3 className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl gradient-text font-semibold mb-1 sm:mb-2 md:mb-3 lg:mb-3 xl:mb-4">
                    {t("dashboard.quickActions.title")}
                </h3>
                <p
                    className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base 2xl:text-lg mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5 2xl:mb-6"
                    style={{ color: "var(--sub-text-color)" }}
                >
                    {t("dashboard.quickActions.subtitle")}
                </p>

                {/* Responsive Grid - 2 columns until 1180px, then 3 cols */}
                <div className="flex justify-center items-center flex-grow">
                    <div className="quick-actions-grid grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-3 xl:gap-4 2xl:gap-5 auto-rows-fr w-full max-w-full">
                        {actions.map((action, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`flex flex-col items-center justify-center rounded-lg p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 2xl:p-5 shadow transition-all duration-200 hover:shadow-md focus:outline-none w-full h-full ${!action.implemented ? 'opacity-60' : 'hover:scale-105'
                                    }`}
                                style={{
                                    background: "var(--bg-color)",
                                    minWidth: 0,
                                    cursor: "pointer",
                                    aspectRatio: "1 / 1",
                                }}
                                onClick={() => handleActionClick(action)}
                            >
                                {/* Icon - Responsive sizing */}
                                <img
                                    src={action.icon}
                                    alt={action.title}
                                    className="w-8 h-8 sm:w-12 sm:h-12 md:w-10 md:h-10 lg:w-10 lg:h-10 xl:w-11 xl:h-11 2xl:w-14 2xl:h-14 mb-1 sm:mb-2 md:mb-2 lg:mb-2 xl:mb-2 2xl:mb-3 flex-shrink-0"
                                />
                                {/* Title - Fixed height with responsive sizing */}
                                <div
                                    className="text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs lg:text-xs xl:text-xs 2xl:text-sm font-semibold mb-0.5 text-center leading-tight min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[30px] xl:min-h-[32px] flex items-center justify-center px-1"
                                    style={{ color: "var(--text-color)" }}
                                >
                                    {action.title}
                                </div>
                                {/* Subtitle - Fixed height with responsive sizing */}
                                <div
                                    className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-[11px] 2xl:text-xs text-center leading-tight hidden sm:flex items-center justify-center min-h-[20px] md:min-h-[24px] lg:min-h-[22px] xl:min-h-[22px] 2xl:min-h-[24px] px-1"
                                    style={{ color: "var(--sub-text-color)" }}
                                >
                                    {action.subtitle}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Custom CSS for 1190px-1279px range to switch to 3 columns */}
                <style>{`
                    @media (min-width: 1190px) and (max-width: 1279px) {
                        .quick-actions-grid {
                            grid-template-columns: repeat(3, minmax(0, 1fr));
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

export default QuickActions;