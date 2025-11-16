import React, { useState } from 'react'
import TimerPopUp from "../timerPopUp/TimerPopUp"
import { useTranslation } from "react-i18next"
import { useTimer } from "../../../contexts/TimerContext"

const TimerCard = () => {
  const { t, i18n } = useTranslation()
  const [showControlPopup, setShowControlPopup] = useState(false)
  
  // Use TimerContext instead of local state and RTK Query
  const {
    timer,
    backendTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    completeTimer,
    cancelTimer,
    updateTaskName,
    updateDuration,
    formatTime,
    isLoading,
    isRunning,
    isPaused,
    isIdle,
    hasActiveTimer,
    displayTime,
  } = useTimer()

  const [taskName, setTaskName] = useState(timer.taskName || "")
  const [duration, setDuration] = useState(timer.duration || 25)

  // Handle starting timer
  const handleSetTaskNameAndStart = async (name) => {
    if (!name.trim()) return alert(t('timerCard.taskNameRequired'))
    
    try {
      await startTimer(name, duration)
      setTaskName(name)
      setShowControlPopup(false)
    } catch (error) {
      console.error('Failed to start timer:', error)
      alert(t('timerCard.startFailed'))
    }
  }

  // Handle pause
  const handlePause = async () => {
    try {
      await pauseTimer()
      setShowControlPopup(false)
    } catch (error) {
      console.error('Failed to pause timer:', error)
      alert(t('timerCard.pauseFailed'))
    }
  }

  // Handle resume
  const handleResume = async () => {
    try {
      await resumeTimer()
      setShowControlPopup(false)
    } catch (error) {
      console.error('Failed to resume timer:', error)
      alert(t('timerCard.resumeFailed'))
    }
  }

  // Handle complete
  const handleComplete = async (note) => {
    try {
      await completeTimer(note || '')
      setShowControlPopup(false)
    } catch (error) {
      console.error('Failed to complete timer:', error)
      alert(t('timerCard.completeFailed'))
    }
  }

  // Handle cancel
  const handleCancel = async (note) => {
    try {
      await cancelTimer(note || '')
      setShowControlPopup(false)
    } catch (error) {
      console.error('Failed to cancel timer:', error)
      alert(t('timerCard.cancelFailed'))
    }
  }

  // Get display time
  const getDisplayTime = () => {
    if (hasActiveTimer) {
      return displayTime
    } else {
      return duration > 0 ? `${duration.toString().padStart(2, '0')}:00` : '00:00'
    }
  }

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (hasActiveTimer && duration > 0) {
      return Math.min(100, Math.max(0, (timer.seconds / (duration * 60)) * 100))
    }
    return 0
  }

  return (
    <>
      <div
        className={`w-full min-h-[140px]  flex flex-col justify-between p-2 rounded-2xl transition-all duration-300 relative overflow-hidden ${
          hasActiveTimer ? 'cursor-pointer' : 'cursor-default'
        } ${isRunning ? 'bg-gradient-to-br from-[#CDFFFC]/30 to-[#E0FFFE]/30' : ''}`}
        onClick={() => hasActiveTimer ? setShowControlPopup(true) : null}
        title={hasActiveTimer ? t('timerCard.clickToControl') : t('timerCard.startToEnable')}
        style={{ 
          direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
          boxShadow: hasActiveTimer 
            ? '0 8px 25px rgba(9, 209, 199, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)' 
            : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Status indicators */}
        <div className="flex justify-between items-center">
          <h1 className='text-[16px] font-semibold text-[#777D86] tracking-wide'>
            {hasActiveTimer ? t('timerCard.activeTimer') : t('timerCard.focusTimer')}
          </h1>
          {hasActiveTimer && (
            <div className="flex flex-col items-end">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isRunning
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {isRunning ? t('timerCard.running') : t('timerCard.paused')}
              </span>
            </div>
          )}
        </div>

        <div className='w-full h-max flex justify-center gap-4 items-center'>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!hasActiveTimer) {
                const newDuration = Math.max(5, duration - 5)
                setDuration(newDuration)
                updateDuration(newDuration)
              }
            }}
            disabled={hasActiveTimer}
            className='w-[28px] h-[28px] text-white rounded-full bg-gradient-to-br from-[#09D1C7] to-[#15919B] font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform'
            aria-label={t('timerCard.decreaseDuration')}
          >
            −
          </button>
          
          <div className="flex flex-col items-center">
            <span className={`text-center text-[28px] font-bold bg-gradient-to-r from-[#09D1C7] to-[#15919B] bg-clip-text text-transparent tracking-wider font-mono ${
              isRunning ? 'animate-pulse' : ''
            }`}>
              {getDisplayTime()}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!hasActiveTimer) {
                const newDuration = Math.min(240, duration + 5)
                setDuration(newDuration)
                updateDuration(newDuration)
              }
            }}
            disabled={hasActiveTimer}
            className='w-[28px] h-[28px] text-white rounded-full bg-gradient-to-br from-[#09D1C7] to-[#15919B] font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform'
            aria-label={t('timerCard.increaseDuration')}
          >
            +
          </button>
        </div>

        <div className='w-full h-[50px] flex justify-center items-center'>
          <button
            className={`w-[85%] h-[40px] cursor-pointer rounded-full flex justify-center items-center text-[17px] font-semibold transition-all duration-300 hover:scale-105 ${
              hasActiveTimer
                ? 'bg-gradient-to-r from-[#09D1C7] to-[#15919B] text-white hover:shadow-lg'
                : 'bg-gradient-to-r from-[#CDFFFC] to-[#E0FFFE] text-[#15919B] hover:from-[#09D1C7] hover:to-[#15919B] hover:text-white'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setShowControlPopup(true)
            }}
            disabled={isLoading.start}
          >
            {isLoading.start ? t('timerCard.starting') : hasActiveTimer ? t('timerCard.controlTimer') : t('timerCard.startTimer')}
          </button>
        </div>

        {/* Progress bar for active timer with duration */}
        {hasActiveTimer && duration > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-[#09D1C7] to-[#15919B] transition-all duration-1000"
              style={{ 
                width: `${getProgressPercentage()}%` 
              }}
            ></div>
          </div>
        )}
      </div>

      {/* Timer Popup */}
      {showControlPopup && (
        <TimerPopUp
          timer={backendTimer?.timer || { tag: taskName, status: null }}
          taskName={taskName}
          setTaskName={setTaskName}
          duration={duration}
          setDuration={setDuration}
          onSetTaskNameAndStart={handleSetTaskNameAndStart}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onClose={() => setShowControlPopup(false)}
          isLoading={isLoading}
        />
      )}
    </>
  )
}

export default TimerCard