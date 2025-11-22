import React, { useState, useEffect, useCallback } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import ClockinAdmin from "../../../components/admin/clockinAdmin";
import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import {
  Users,
  UserCheck,
  Clock,
  MapPin,
  Calendar,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Card from "../../../components/Time_Tracking_Components/Stats/Card";
import toast from 'react-hot-toast';
import { useLang } from "../../../contexts/LangContext";
import Table from "../../../components/admin/attendance/AttendanceTable/Table";
import Loading from "../../../components/Loading/Loading";

const AttendanceAdmin = () => {
  const { lang, isRtl } = useLang();
  const { t, i18n } = useTranslation();

  // Sync language from localStorage
  useEffect(() => {
    const storedLang = localStorage.getItem("lang") || "en";
    if (i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }
  }, [i18n]);

  const cardData = [
    {
      title: t("adminAttendance.cards.totalEmployees", "Total Employees"),
      value: 120,
      icon: <img src="/assets/AdminAttendance/total.svg" alt="employees" />
    },
    {
      title: t("adminAttendance.cards.presentToday", "Present Today"),
      value: 80,
      icon: <img src="/assets/AdminDashboard/today.svg" alt="attendance" />
    },
    {
      title: t("adminAttendance.cards.absentToday", "Absent Today"),
      value: 22,
      icon: <img src="/assets/AdminDashboard/leavee.svg" alt="absent" />
    },
    {
      title: t("adminAttendance.cards.lateArrivals", "Late Arrivals"),
      value: 18,
      icon: <img src="/assets/AdminDashboard/task.svg" alt="late" />
    },
  ]

  const getLocationIcon = (location) => {
    return location === 'office' ? 
      <MapPin size={16} className="text-blue-500" /> : 
      <MapPin size={16} className="text-purple-500" />;
  };

  // Custom hook for dynamic time calculation
  const useDynamicTime = (attendanceData) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const formatTime = (timeString) => {
      if (!timeString || timeString === 'N/A') return 'N/A';
      
      // If it's already a time string like "09:30", convert to 12-hour format
      if (typeof timeString === 'string' && timeString.includes(':')) {
        try {
          const [hours, minutes] = timeString.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch (error) {
          return timeString; // fallback to original if conversion fails
        }
      }
      
      // If it's a full datetime, extract time in 12-hour format
      try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        return 'N/A';
      }
    };

    const calculateWorkHours = useCallback((clockIn, clockOut, isCurrentlyWorking = false) => {
      if (!clockIn || clockIn === 'N/A') return '0h 0m';
      
      try {
        let startTime, endTime;
        
        // Parse clock in time
        if (typeof clockIn === 'string' && clockIn.includes(':')) {
          // It's a time string like "09:30"
          const [hours, minutes] = clockIn.split(':').map(Number);
          startTime = new Date();
          startTime.setHours(hours, minutes, 0, 0);
        } else {
          // It's a full datetime
          startTime = new Date(clockIn);
          if (isNaN(startTime.getTime())) return '0h 0m';
        }
        
        // Parse clock out time
        if (clockOut && clockOut !== 'N/A') {
          if (typeof clockOut === 'string' && clockOut.includes(':')) {
            // It's a time string like "17:30"
            const [hours, minutes] = clockOut.split(':').map(Number);
            endTime = new Date();
            endTime.setHours(hours, minutes, 0, 0);
          } else {
            // It's a full datetime
            endTime = new Date(clockOut);
            if (isNaN(endTime.getTime())) return '0h 0m';
          }
        } else if (isCurrentlyWorking) {
          // User is currently working, use current time
          endTime = currentTime;
        } else {
          return '0h 0m';
        }
        
        const diffMs = endTime - startTime;
        if (diffMs < 0) return '0h 0m';
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHours}h ${diffMinutes}m`;
      } catch (error) {
        // Error calculating work hours
        return '0h 0m';
      }
    }, [currentTime]);

    const getDynamicClockIn = (attendance) => {
      return formatTime(attendance.clockIn);
    };

    const getDynamicClockOut = (attendance) => {
      if (attendance.clockOut && attendance.clockOut !== 'N/A') {
        return formatTime(attendance.clockOut);
      }
      // If user is currently working (status is present and no clock out), show live time
      if (attendance.status === 'present' && (!attendance.clockOut || attendance.clockOut === 'N/A')) {
        return currentTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }) + ' (Live)';
      }
      return 'N/A';
    };

    const getDynamicWorkHours = (attendance) => {
      // Allow live calculation for both present and late
      const isCurrentlyWorking = 
        (attendance.status === 'present' || attendance.status === 'late') &&
        (!attendance.clockOut || attendance.clockOut === 'N/A');

      if (isCurrentlyWorking) {
        // Calculate live work hours
        return calculateWorkHours(attendance.clockIn, attendance.clockOut, true);
      } else {
        // Use the work hours from backend for completed shifts
        return attendance.workHours || '0h 0m';
      }
    };

    return {
      currentTime,
      getDynamicClockIn,
      getDynamicClockOut,
      getDynamicWorkHours
    };
  };

  // Show loading screen while data is being fetched
  const [isLoading, setIsLoading] = useState(false);
  if (isLoading) {
    return <Loading />;
  }

  return (
    <PermissionGuard 
      backendPermissions={["ClockinLog.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col bg-[var(--bg-color)]">
        <NavBarAdmin
        />
      <div className="flex flex-1 min-h-0">
        <SideBarAdmin />
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 bg-[var(--bg-color)]">
          {/* Stats Cards - Responsive Grid */}
          <div className="w-full h-max grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
            {cardData.map((card, index) => (
              <Card
                    key={index}
                header={card.title}
                rightIcon={card.icon}
                title={card.value}
              />
            ))}
          </div>

          <div className="w-full h-max">
            <Table />
      </div>

        </main>
      </div>

    </div>
    </PermissionGuard>
  );
};

export default AttendanceAdmin;