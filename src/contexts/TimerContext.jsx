import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Mock timer API functions for static mode - return RTK Query-like structure
const createMockMutation = (mockData) => {
  return [
    (params) => {
      const promise = Promise.resolve(mockData);
      promise.unwrap = () => Promise.resolve(mockData);
      return promise;
    }
  ];
};

const useGetCurrentTimerQuery = () => ({ data: null, refetch: () => ({ data: null }) });
const useStartTimerMutation = () => createMockMutation({ 
  timer: { 
    id: 'static-1', 
    startTime: new Date().toISOString(), 
    tag: '', 
    duration: 25 
  } 
});
const usePauseTimerMutation = () => createMockMutation({});
const useResumeTimerMutation = () => createMockMutation({});
const useCompleteTimerMutation = () => createMockMutation({});
const useCancelTimerMutation = () => createMockMutation({});

const TimerContext = createContext();

export function useTimer() {
  return useContext(TimerContext);
}

const TIMER_KEY = "workhole_timer_state";

export function TimerProvider({ children }) {
  // Local timer state
  const [localTimer, setLocalTimer] = useState(() => {
    try {
      const saved = localStorage.getItem(TIMER_KEY);
      return saved ? JSON.parse(saved) : { 
        status: "idle", 
        startTime: null, 
        seconds: 0,
        taskName: "",
        duration: 25,
        id: null
      };
    } catch {
      return { 
        status: "idle", 
        startTime: null, 
        seconds: 0,
        taskName: "",
        duration: 25,
        id: null
      };
    }
  });

  // Only fetch backend timer when we have an active timer locally
  const shouldFetchBackend = localTimer.status !== 'idle' || localTimer.id;
  
  // Static mode - no backend API calls
  const { data: backendTimer = null, refetch: refetchBackend = () => ({ data: null }) } = { data: null, refetch: () => ({ data: null }) };

  const [startTimerMutation] = useStartTimerMutation();
  const [pauseTimerMutation] = usePauseTimerMutation();
  const [resumeTimerMutation] = useResumeTimerMutation();
  const [completeTimerMutation] = useCompleteTimerMutation();
  const [cancelTimerMutation] = useCancelTimerMutation();
  
  // Static loading states
  const isStarting = false;
  const isPausing = false;
  const isResuming = false;
  const isCompleting = false;
  const isCancelling = false;

  // Save local timer state to localStorage
  useEffect(() => {
    localStorage.setItem(TIMER_KEY, JSON.stringify(localTimer));
  }, [localTimer]);

  // Sync with backend timer - only when we have backend data
  useEffect(() => {
    if (backendTimer?.isRunning && backendTimer?.timer) {
      const backendData = backendTimer.timer;
      
      // If backend has a running timer, sync local state
      if (backendData.status === 'running' && localTimer.status !== 'running') {
        setLocalTimer({
          status: 'running',
          startTime: new Date(backendData.startTime).getTime(),
          seconds: backendData.elapsedSeconds || 0,
          taskName: backendData.tag || '',
          duration: backendData.duration || 25,
          id: backendData.id
        });
      } else if (backendData.status === 'paused' && localTimer.status !== 'paused') {
        setLocalTimer(prev => ({
          ...prev,
          status: 'paused',
          seconds: backendData.elapsedSeconds || 0,
          id: backendData.id
        }));
      }
    } else if (!backendTimer?.isRunning && localTimer.status !== 'idle') {
      // Backend timer is not running, reset local state
      setLocalTimer(prev => ({
        ...prev,
        status: 'idle',
        startTime: null,
        seconds: 0,
        id: null
      }));
    }
  }, [backendTimer]);

  // Update seconds every second if running locally
  useEffect(() => {
    let interval;
    if (localTimer.status === "running" && localTimer.startTime) {
      interval = setInterval(() => {
        setLocalTimer((prev) => {
          const elapsed = Math.floor((Date.now() - new Date(prev.startTime)) / 1000);
          const maxSeconds = (prev.duration || 0) * 60;
          return {
            ...prev,
            seconds: maxSeconds > 0 ? Math.min(elapsed, maxSeconds) : elapsed,
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [localTimer.status, localTimer.startTime]);

  const playCompletionSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      
      // Play a more noticeable alarm sound - 3 beeps
      const playBeep = (startTime, frequency) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime + startTime);
        oscillator.stop(ctx.currentTime + startTime + 0.3);
      };

      // Play 3 beeps at different frequencies for a more noticeable alarm
      playBeep(0, 880);    // First beep
      playBeep(0.4, 1100); // Second beep (higher pitch)
      playBeep(0.8, 1320); // Third beep (even higher pitch)

      // Close context after all beeps finish
      setTimeout(() => {
        if (typeof ctx.close === "function") {
          ctx.close();
        }
      }, 1500);
    } catch {
      // Silent fail to avoid interrupting the UX if audio cannot play
    }
  }, []);

  // Enhanced timer functions that sync with backend
  const startTimer = useCallback(async (taskName, duration = 25) => {
    try {
      // For local-only mode, start timer directly without API call
      const timerId = `timer-${Date.now()}`;
      const startTime = Date.now();
      
      setLocalTimer({
        status: 'running',
        startTime: startTime,
        seconds: 0,
        taskName: taskName || `Focus Session (${duration} min)`,
        duration: duration,
        id: timerId
      });
      
      // Try to call backend mutation if available (for future API integration)
      try {
        const response = await startTimerMutation({ 
          tag: taskName, 
          duration 
        });
        const result = await response.unwrap();
        if (result?.timer) {
          setLocalTimer(prev => ({
            ...prev,
            id: result.timer.id,
            startTime: new Date(result.timer.startTime).getTime(),
          }));
        }
      } catch (apiError) {
        // Silently fail - we're using local mode anyway
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  }, [startTimerMutation]);

  const pauseTimer = useCallback(async () => {
    if (localTimer.id) {
      try {
        setLocalTimer(prev => ({ ...prev, status: 'paused' }));
        // Try to call backend mutation if available
        try {
          await pauseTimerMutation(localTimer.id);
        } catch (apiError) {
          // Silently fail - we're using local mode anyway
        }
      } catch (error) {
        console.error('Failed to pause timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, pauseTimerMutation]);

  const resumeTimer = useCallback(async () => {
    if (localTimer.id) {
      try {
        setLocalTimer(prev => ({
          ...prev,
          status: 'running',
          startTime: Date.now() - prev.seconds * 1000,
        }));
        // Try to call backend mutation if available
        try {
          await resumeTimerMutation(localTimer.id);
        } catch (apiError) {
          // Silently fail - we're using local mode anyway
        }
      } catch (error) {
        console.error('Failed to resume timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, resumeTimerMutation]);

  const completeTimer = useCallback(async (note = '') => {
    if (localTimer.id) {
      try {
        setLocalTimer({
          status: 'idle',
          startTime: null,
          seconds: 0,
          taskName: '',
          duration: 25,
          id: null
        });
        // Try to call backend mutation if available
        try {
          await completeTimerMutation({ 
            id: localTimer.id, 
            note 
          });
        } catch (apiError) {
          // Silently fail - we're using local mode anyway
        }
      } catch (error) {
        console.error('Failed to complete timer:', error);
        throw error;
      }
    } else {
      // If no ID, just reset the timer (for auto-completion)
      setLocalTimer({
        status: 'idle',
        startTime: null,
        seconds: 0,
        taskName: '',
        duration: 25,
        id: null
      });
    }
  }, [localTimer.id, completeTimerMutation]);

  useEffect(() => {
    if (localTimer.status !== 'running') return;
    if (!localTimer.duration || localTimer.duration <= 0) return;

    const totalSeconds = localTimer.duration * 60;
    if (localTimer.seconds >= totalSeconds) {
      setLocalTimer(prev => ({
        ...prev,
        status: 'completed',
        seconds: totalSeconds,
      }));
      playCompletionSound();
      completeTimer();
    }
  }, [localTimer.status, localTimer.duration, localTimer.seconds, completeTimer, playCompletionSound]);

  const cancelTimer = useCallback(async (note = '') => {
    if (localTimer.id) {
      try {
        setLocalTimer({
          status: 'idle',
          startTime: null,
          seconds: 0,
          taskName: '',
          duration: 25,
          id: null
        });
        // Try to call backend mutation if available
        try {
          await cancelTimerMutation({ 
            id: localTimer.id, 
            note 
          });
        } catch (apiError) {
          // Silently fail - we're using local mode anyway
        }
      } catch (error) {
        console.error('Failed to cancel timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, cancelTimerMutation]);

  const stopTimer = useCallback(() => {
    setLocalTimer({
      status: 'idle',
      startTime: null,
      seconds: 0,
      taskName: '',
      duration: 25,
      id: null
    });
  }, []);

  const updateTaskName = useCallback((taskName) => {
    setLocalTimer(prev => ({ ...prev, taskName }));
  }, []);

  const updateDuration = useCallback((duration) => {
    setLocalTimer(prev => ({ ...prev, duration }));
  }, []);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <TimerContext.Provider
      value={{
        // Timer state
        timer: localTimer,
        backendTimer,
        
        // Timer actions
        startTimer,
        pauseTimer,
        resumeTimer,
        completeTimer,
        cancelTimer,
        stopTimer,
        
        // Utility functions
        updateTaskName,
        updateDuration,
        formatTime,
        refetchBackend,
        
        // Loading states
        isLoading: {
          start: isStarting,
          pause: isPausing,
          resume: isResuming,
          complete: isCompleting,
          cancel: isCancelling,
        },
        
        // Computed values
        isRunning: localTimer.status === 'running',
        isPaused: localTimer.status === 'paused',
        isIdle: localTimer.status === 'idle',
        hasActiveTimer: localTimer.status !== 'idle',
        displayTime: formatTime(Math.max((localTimer.duration || 0) * 60 - localTimer.seconds, 0)),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}