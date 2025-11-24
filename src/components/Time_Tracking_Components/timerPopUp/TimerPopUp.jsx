import React, { useState } from 'react'
import { useTranslation } from "react-i18next"

const TimerPopUp = ({
  timer,
  taskName,
  setTaskName,
  duration,
  setDuration,
  onSetTaskNameAndStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
  onClose,
  isLoading = {} 
}) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === "rtl"

  const handleComplete = async () => {
    try {
      await onComplete('')
      onClose()
    } catch (error) {
      console.error('Failed to complete timer:', error)
    }
  }

  const handleCancel = async () => {
    try {
      await onCancel('')
      onClose()
    } catch (error) {
      console.error('Failed to cancel timer:', error)
    }
  }

  const handlePause = async () => {
    await onPause()
    onClose()
  }

  const handleResume = async () => {
    await onResume()
    onClose()
  }

  // If timer not started, show task name input
  if (!timer?.id) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
          {/* Decorative top bar */}
          <div className="h-2 bg-gradient-to-r from-[#09D1C7] to-[#15919B] rounded-t-3xl"></div>
          
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#09D1C7] to-[#15919B] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {t("timer.startNewTimer") || "Start New Timer"}
              </h3>
              <p className="text-gray-500 text-sm">
                Create and track your productive work session
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t("mainContent.taskName") || "Task Name"}
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-[#15919B] focus:outline-none transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800 placeholder-gray-400"
                  placeholder={t("mainContent.taskPlaceholder") || "Enter your task description"}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t("timer.duration") || "Duration (Minutes)"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={duration}
                  onChange={e => setDuration(Math.max(1, Math.min(240, Number(e.target.value))))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-[#15919B] focus:outline-none transition-all duration-300 bg-gray-50 hover:bg-white text-gray-800"
                  placeholder="60"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-200"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-[#09D1C7] to-[#15919B] text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  onClick={() => onSetTaskNameAndStart(taskName)}
                  disabled={isLoading.start || !taskName.trim()}
                >
                  {isLoading.start ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting...
                    </div>
                  ) : (
                    "Start Timer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Decorative top bar */}
        <div className="h-2 bg-gradient-to-r from-[#09D1C7] to-[#15919B] rounded-t-3xl"></div>
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#09D1C7] to-[#15919B] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {t("timer.timerControl")}
            </h3>
            <p className="text-gray-500 text-sm">
              Manage your active timer session
            </p>
          </div>

          {/* Task Info Card */}
          <div className="bg-gradient-to-r from-[#09D1C7]/10 to-[#15919B]/10 p-6 rounded-2xl border border-[#09D1C7]/20 mb-8">
            <p className="text-sm font-medium text-gray-600 mb-2">{t("timer.currentTask")}:</p>
            <p className="font-bold text-[#15919B] text-xl mb-4">{timer.tag}</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">{t("timer.status")}:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${
                timer.status === 'running' 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  timer.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}></div>
                {timer.status === 'running' ? t("timer.running") : t("timer.paused")}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {timer.status === 'running' ? (
                <button
                  className="py-4 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  onClick={handlePause}
                  disabled={isLoading.pause}
                >
                  {isLoading.pause ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Pausing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                      <span className="text-sm">{t("timer.pause")}</span>
                    </div>
                  )}
                </button>
              ) : (
                <button
                  className="py-4 px-4 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                  onClick={handleResume}
                  disabled={isLoading.resume}
                >
                  {isLoading.resume ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Resuming...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="text-sm">{t("timer.resume")}</span>
                    </div>
                  )}
                </button>
              )}

              <button
                className="py-4 px-4 rounded-xl bg-gradient-to-r from-[#09D1C7] to-[#15919B] text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                onClick={handleComplete}
                disabled={isLoading.complete}
              >
                {isLoading.complete ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Completing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{t("timer.complete")}</span>
                  </div>
                )}
              </button>
            </div>

            <button
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
              onClick={handleCancel}
              disabled={isLoading.cancel}
            >
              {isLoading.cancel ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cancelling...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{t("timer.cancel")}</span>
                </div>
              )}
            </button>

            <button
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-200"
              onClick={onClose}
            >
              {t("timer.close") || "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimerPopUp