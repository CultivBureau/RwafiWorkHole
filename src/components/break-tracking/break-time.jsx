import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CustomPopup from "../ui/custom-popup";
import DigitalNumber from "../ui/DigitalNumber";
import { calculateDurationFromUtc } from "../../utils/timeUtils";

const BreakTime = ({
    breakOptions = [],
    activeBreakLog,
    onStartBreak,
    onEndBreak,
    isStarting = false,
    isEnding = false,
    isLoadingBreakOptions = false,
}) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    // مزامنة اللغة من localStorage
    useEffect(() => {
        const lang = localStorage.getItem("lang") || "en";
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }, [i18n]);

    const [selectedBreakId, setSelectedBreakId] = useState("");
    const [time, setTime] = useState(new Date());
    const [breakStartTime, setBreakStartTime] = useState(null);
    const [breakDuration, setBreakDuration] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState(
        t("breakTime.selectBreakReasonFirst", "Please select a break reason first!")
    );

    const isBreakActive = useMemo(() => Boolean(activeBreakLog && !activeBreakLog.endBreak), [activeBreakLog]);

    // when break options change, default select first available
    useEffect(() => {
        if (breakOptions.length > 0) {
            setSelectedBreakId((prev) => prev || breakOptions[0]?.id || "");
        } else {
            setSelectedBreakId("");
        }
    }, [breakOptions]);

    // update break start time when active break changes
    useEffect(() => {
        if (isBreakActive && activeBreakLog?.startBreak) {
            // Store UTC ISO string directly
            setBreakStartTime(activeBreakLog.startBreak);
            // Reset duration when break becomes active
            setBreakDuration(0);
        } else {
            setBreakStartTime(null);
            setBreakDuration(0);
        }
    }, [activeBreakLog, isBreakActive]);

    // Timer effect - calculate elapsed time from break start using UTC
    useEffect(() => {
        if (!isBreakActive || !breakStartTime) {
            setBreakDuration(0);
            return;
        }

        // Calculate initial duration immediately using timeUtils
        const calculateDuration = () => {
            const duration = calculateDurationFromUtc(breakStartTime);
            setBreakDuration(duration);
        };

        // Calculate immediately
        calculateDuration();

        // Then update every second
        const timer = setInterval(() => {
            setTime(new Date());
            calculateDuration();
        }, 1000);

        return () => clearInterval(timer);
    }, [isBreakActive, breakStartTime]);

    const handleToggleBreak = async () => {
        try {
            if (isBreakActive) {
                await onEndBreak?.();
            } else {
                if (!selectedBreakId) {
                    setPopupMessage(
                        t("breakTime.selectBreakReasonFirst", "Please select a break reason first!")
                    );
                    setShowPopup(true);
                    return;
                }
                await onStartBreak?.(selectedBreakId);
            }
        } catch (error) {
            setPopupMessage(
                error?.data?.errorMessage ||
                t("common.somethingWentWrong", "Something went wrong. Please try again.")
            );
            setShowPopup(true);
        }
    };

    const selectedBreakOption = useMemo(() => {
        if (isBreakActive && activeBreakLog?.break?.id) {
            return {
                id: activeBreakLog.break.id,
                name: activeBreakLog.break.name,
                duration: activeBreakLog.break.duration,
            };
        }
        return breakOptions.find((option) => option.id === selectedBreakId) || null;
    }, [activeBreakLog, breakOptions, isBreakActive, selectedBreakId]);

    // Timer display
    const timerMinutes = Math.floor(breakDuration / 60).toString().padStart(2, "0");
    const timerSeconds = (breakDuration % 60).toString().padStart(2, "0");

    // Calculate angles for clock hands
    const secondAngle = time.getSeconds() * 6 - 90;
    const minuteAngle = time.getMinutes() * 6 + time.getSeconds() * 0.1 - 90;
    const hourAngle = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5 - 90;

    const breakTypeDuration = selectedBreakOption?.duration || 0;

    // Calculate remaining time - ensure it's never negative
    const remainingSeconds = isBreakActive && breakStartTime && breakTypeDuration
        ? Math.max(0, (breakTypeDuration * 60) - breakDuration)
        : breakTypeDuration * 60;

    const remainingMinutes = Math.max(Math.floor(remainingSeconds / 60), 0);
    const remainingSecs = Math.max(Math.floor(remainingSeconds % 60), 0);

    return (
        <div className="rounded-2xl shadow-xl border p-6 h-full flex flex-col backdrop-blur-sm transition-all duration-300 hover:shadow-2xl group"
            style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 15px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
             {/* Header - flex-col only for 1024px-1250px range */}
            <div className="flex flex-col lg:flex-col xl:flex-row 2xl:flex-row gap-3 mb-4 sm:mb-6 lg:mb-4 xl:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-lg xl:text-xl font-bold gradient-text tracking-tight transition-all duration-200 group-hover:scale-105">
                    {t('breakTime.title', 'Break Time')}
                </h3>

                {/* Controls - Always in same row, each taking 50% width */}
                <div className="flex flex-row items-center gap-2 xl:ml-auto">
                    {/* Select Reason - Always 50% width */}
                    <div className="relative group/select flex-1">
                        <select
                            value={isBreakActive ? selectedBreakOption?.id || "" : selectedBreakId}
                            onChange={(e) => setSelectedBreakId(e.target.value)}
                            disabled={isBreakActive || isLoadingBreakOptions}
                            className="w-full border-2 rounded-xl font-semibold px-2 sm:px-2 lg:px-2 xl:px-2 py-2 sm:py-2.5 lg:py-2 xl:py-2.5 pr-8 sm:pr-10 lg:pr-8 xl:pr-10 text-xs sm:text-sm lg:text-xs xl:text-sm gradient-text appearance-none backdrop-blur-sm transition-all duration-300 hover:border-opacity-80 focus:ring-2 focus:ring-opacity-20 focus:scale-[1.02] h-[36px] sm:h-[42px] lg:h-[36px] xl:h-[42px]"
                            style={{
                                borderColor: 'var(--accent-color)',
                                backgroundColor: 'var(--bg-color)',
                                opacity: isBreakActive || isLoadingBreakOptions ? 0.6 : 1,
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                                focusRingColor: 'var(--accent-color)'
                            }}
                        >
                            {!isBreakActive && (
                                <option value="">
                                    {t("breakTime.selectReason", "Select Break Reason")}
                                </option>
                            )}
                            {(isBreakActive && selectedBreakOption ? [selectedBreakOption] : breakOptions).map((option) => (
                                <option
                                    key={option.id}
                                    value={option.id}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t(`breakTime.reasons.${option.name}`, option.name)}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-2 sm:right-3 lg:right-2 xl:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-transform duration-300 group-hover/select:scale-110 group-hover/select:rotate-180">
                            <svg width="10" height="10" className="sm:w-3 sm:h-3 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 gradient-text" viewBox="0 0 24 24" fill="none" >
                                <path d="M6 9l6 6 6-6" stroke="url(#gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="var(--gradient-start)" />
                                        <stop offset="100%" stopColor="var(--gradient-end)" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>

                    {/* Start Break Button - Always 50% width */}
                    <button
                        onClick={handleToggleBreak}
                        className="flex-1 text-white px-3 sm:px-4 lg:px-3 xl:px-4 py-2 sm:py-2.5 lg:py-2 xl:py-2.5 rounded-xl text-xs sm:text-sm lg:text-xs xl:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group/btn h-[36px] sm:h-[42px] lg:h-[36px] xl:h-[42px]"
                        style={{
                            background: isBreakActive
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                            boxShadow: isBreakActive
                                ? '0 8px 25px rgba(239, 68, 68, 0.4)'
                                : '0 8px 25px rgba(21, 145, 155, 0.4)'
                        }}
                        disabled={isStarting || isEnding || isLoadingBreakOptions}
                    >
                        <img
                            src="/assets/clock.svg"
                            alt={isBreakActive ? t('breakTime.endBreak', 'End Break') : t('breakTime.startBreak', 'Start Break')}
                            className="w-3 h-3 sm:w-4 sm:h-4 lg:w-3 lg:h-3 xl:w-4 xl:h-4 transition-transform duration-300 group-hover/btn:rotate-12"
                        />
                        <span>
                            {(isStarting || isEnding) ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                isBreakActive ? t('breakTime.endBreak', 'End Break') : t('breakTime.startBreak', 'Start Break')
                            )}
                        </span>
                    </button>
                </div>
            </div>
            {/* Enhanced Divider */}
            <div className="w-full h-px mb-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30"
                style={{ backgroundColor: 'var(--divider-color)' }}></div>

            {/* Enhanced Clock Section */}
            <div className="flex flex-col items-center justify-center mt-3 mb-8" style={{ height: '110px', minHeight: '110px', maxHeight: '110px' }}>
                {/* Enhanced Analog Clock */}
                <div className="relative mb-3 transition-transform duration-300 hover:scale-110 group/clock">
                    <svg width="44" height="44" className="drop-shadow-lg">
                        {/* Enhanced Clock face */}
                        <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            fillOpacity="0.1"
                            stroke={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            strokeWidth="2"
                            className="transition-all duration-300 group-hover/clock:fill-opacity-20"
                        />

                        {/* Outer ring */}
                        <circle
                            cx="22"
                            cy="22"
                            r="19"
                            fill="none"
                            stroke={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            strokeWidth="0.5"
                            strokeOpacity="0.4"
                            className="transition-all duration-300"
                        />

                        {/* Enhanced Hour markers */}
                        {[...Array(12)].map((_, i) => {
                            const angle = i * 30 - 90;
                            const x1 = 22 + 14 * Math.cos((angle * Math.PI) / 180);
                            const y1 = 22 + 14 * Math.sin((angle * Math.PI) / 180);
                            const x2 = 22 + 17 * Math.cos((angle * Math.PI) / 180);
                            const y2 = 22 + 17 * Math.sin((angle * Math.PI) / 180);

                            return <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                                strokeWidth={i % 3 === 0 ? "2.5" : "1.5"}
                                strokeOpacity={i % 3 === 0 ? "0.9" : "0.7"}
                                strokeLinecap="round"
                                className="transition-all duration-300"
                            />;
                        })}

                        {/* Enhanced Hour hand */}
                        <line
                            x1="22"
                            y1="22"
                            x2={22 + 7 * Math.cos((hourAngle * Math.PI) / 180)}
                            y2={22 + 7 * Math.sin((hourAngle * Math.PI) / 180)}
                            stroke={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="transition-all duration-300"
                        />

                        {/* Enhanced Minute hand */}
                        <line
                            x1="22"
                            y1="22"
                            x2={22 + 10 * Math.cos((minuteAngle * Math.PI) / 180)}
                            y2={22 + 10 * Math.sin((minuteAngle * Math.PI) / 180)}
                            stroke={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="transition-all duration-300"
                        />

                        {/* Enhanced Second hand */}
                        <line
                            x1="22"
                            y1="22"
                            x2={22 + 12 * Math.cos((secondAngle * Math.PI) / 180)}
                            y2={22 + 12 * Math.sin((secondAngle * Math.PI) / 180)}
                            stroke="var(--accent-hover)"
                            strokeWidth="1"
                            strokeLinecap="round"
                            className="transition-all duration-100"
                        />

                        {/* Enhanced Center dot */}
                        <circle
                            cx="22"
                            cy="22"
                            r="2"
                            fill={isBreakActive ? "var(--error-color)" : "var(--accent-color)"}
                            className="transition-all duration-300"
                        />
                        <circle
                            cx="22"
                            cy="22"
                            r="1"
                            fill="white"
                            fillOpacity="0.9"
                        />
                    </svg>
                </div>

                {/* Enhanced Timer Display */}
                <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 group/timer"
                    style={{
                        background: isBreakActive
                            ? 'linear-gradient(135deg, var(--error-color), #dc2626)'
                            : 'linear-gradient(135deg, var(--hover-color), rgba(21, 145, 155, 0.15))',
                        boxShadow: isBreakActive
                            ? '0 8px 25px rgba(239, 68, 68, 0.3), 0 2px 10px rgba(239, 68, 68, 0.15)'
                            : '0 8px 25px rgba(21, 145, 155, 0.2), 0 2px 10px rgba(21, 145, 155, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                    <div className="flex flex-col items-center">
                        <DigitalNumber
                            value={timerMinutes}
                            size="lg"
                            className="transition-all duration-200 group-hover/timer:scale-110"
                            style={{ color: 'var(--text-color)', lineHeight: '1' }}
                        />
                        <div className="text-[9px] font-semibold tracking-widest opacity-75 uppercase transition-all duration-200"
                            style={{ color: 'var(--sub-text-color)', lineHeight: '1' }}>
                            MIN
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white bg-opacity-30"></div>
                    <div className="flex flex-col items-center">
                        <DigitalNumber
                            value={timerSeconds}
                            size="lg"
                            className="transition-all duration-200 group-hover/timer:scale-110"
                            style={{ color: 'var(--text-color)', lineHeight: '1' }}
                        />
                        <div className="text-[9px] font-semibold tracking-widest opacity-75 uppercase transition-all duration-200"
                            style={{ color: 'var(--sub-text-color)', lineHeight: '1' }}>
                            SEC
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Divider */}
            <div className="w-full h-px mb-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-30"
                style={{ backgroundColor: 'var(--divider-color)' }}></div>

            {/* Enhanced Summary Boxes */}
            <div className="flex gap-4 mt-4">
                <div className="flex-1 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group/box1"
                    style={{ backgroundColor: 'var(--container-color)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' }}>
                    <div className="text-xl font-bold mb-2 transition-all duration-200 group-hover/box1:scale-110"
                        style={{ color: 'var(--text-color)' }}>
                        {breakTypeDuration ? `${breakTypeDuration}m` : "--"}
                    </div>
                    <div className="text-xs font-medium transition-all duration-200"
                        style={{ color: 'var(--sub-text-color)' }}>
                        {t("breakTime.breakTime", "Break Time")}
                    </div>
                </div>
                <div className="flex-1 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg group/box2"
                    style={{ backgroundColor: 'var(--container-color)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)' }}>
                    <div className="text-xl font-bold mb-2 transition-all duration-200 group-hover/box2:scale-110"
                        style={{
                            color: remainingSeconds <= 0 && isBreakActive ? '#ef4444' : 'var(--text-color)',
                            filter: remainingSeconds <= 0 && isBreakActive ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : 'none'
                        }}>
                        {isBreakActive
                            ? `${remainingMinutes}m ${remainingSecs.toString().padStart(2, "0")}s`
                            : `${breakTypeDuration}m`}
                    </div>
                    <div className="text-xs font-medium transition-all duration-200"
                        style={{ color: 'var(--sub-text-color)' }}>
                        {t("breakTime.remaining", "Remaining")}
                    </div>
                </div>
            </div>

            {/* Enhanced Custom Popup */}
            <CustomPopup
                isOpen={showPopup}
                onClose={() => setShowPopup(false)}
                title={t("breakTime.reasonRequired", "Break Reason Required")}
                message={popupMessage}
                type="warning"
            />
        </div>
    );
};

export default BreakTime;
