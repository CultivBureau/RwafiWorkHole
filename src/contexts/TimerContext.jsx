import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Mock timer API functions for static mode
const useGetCurrentTimerQuery = () => ({ data: null, refetch: () => ({ data: null }) });
const useStartTimerMutation = () => [async () => ({ data: { timer: { id: 'static-1', startTime: new Date(), tag: '', duration: 25 } } })];
const usePauseTimerMutation = () => [async () => ({ data: {} })];
const useResumeTimerMutation = () => [async () => ({ data: {} })];
const useCompleteTimerMutation = () => [async () => ({ data: {} })];
const useCancelTimerMutation = () => [async () => ({ data: {} })];

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
        setLocalTimer((prev) => ({
          ...prev,
          seconds: Math.floor((Date.now() - new Date(prev.startTime)) / 1000),
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [localTimer.status, localTimer.startTime]);

  // Enhanced timer functions that sync with backend
  const startTimer = useCallback(async (taskName, duration = 25) => {
    try {
      const response = await startTimerMutation({ 
        tag: taskName, 
        duration 
      }).unwrap();
      
      if (response.timer) {
        setLocalTimer({
          status: 'running',
          startTime: new Date(response.timer.startTime).getTime(),
          seconds: 0,
          taskName: response.timer.tag,
          duration: response.timer.duration,
          id: response.timer.id
        });
        // Only refetch if we're already polling
        if (shouldFetchBackend) {
          await refetchBackend();
        }
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  }, [startTimerMutation, refetchBackend, shouldFetchBackend]);

  const pauseTimer = useCallback(async () => {
    if (localTimer.id) {
      try {
        await pauseTimerMutation(localTimer.id).unwrap();
        setLocalTimer(prev => ({ ...prev, status: 'paused' }));
        if (shouldFetchBackend) {
          await refetchBackend();
        }
      } catch (error) {
        console.error('Failed to pause timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, pauseTimerMutation, refetchBackend, shouldFetchBackend]);

  const resumeTimer = useCallback(async () => {
    if (localTimer.id) {
      try {
        await resumeTimerMutation(localTimer.id).unwrap();
        setLocalTimer(prev => ({
          ...prev,
          status: 'running',
          startTime: Date.now() - prev.seconds * 1000,
        }));
        if (shouldFetchBackend) {
          await refetchBackend();
        }
      } catch (error) {
        console.error('Failed to resume timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, resumeTimerMutation, refetchBackend, shouldFetchBackend]);

  const completeTimer = useCallback(async (note = '') => {
    if (localTimer.id) {
      try {
        await completeTimerMutation({ 
          id: localTimer.id, 
          note 
        }).unwrap();
        setLocalTimer({
          status: 'idle',
          startTime: null,
          seconds: 0,
          taskName: '',
          duration: 25,
          id: null
        });
        if (shouldFetchBackend) {
          await refetchBackend();
        }
      } catch (error) {
        console.error('Failed to complete timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, completeTimerMutation, refetchBackend, shouldFetchBackend]);

  const cancelTimer = useCallback(async (note = '') => {
    if (localTimer.id) {
      try {
        await cancelTimerMutation({ 
          id: localTimer.id, 
          note 
        }).unwrap();
        setLocalTimer({
          status: 'idle',
          startTime: null,
          seconds: 0,
          taskName: '',
          duration: 25,
          id: null
        });
        if (shouldFetchBackend) {
          await refetchBackend();
        }
      } catch (error) {
        console.error('Failed to cancel timer:', error);
        throw error;
      }
    }
  }, [localTimer.id, cancelTimerMutation, refetchBackend, shouldFetchBackend]);

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
        displayTime: formatTime(localTimer.seconds),
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}