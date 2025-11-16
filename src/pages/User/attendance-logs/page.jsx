import React from "react";
import SideMenu from "../../../components/side-menu/side-menu";
import NavBar from "../../../components/NavBar/navbar";
import AttendanceStates from "../../../components/attendance-logs/AttendanceStats";
import AttendanceTable from "../../../components/attendance-logs/AttendanceTable";
import { useLang } from "../../../contexts/LangContext";

const AttendanceLogs = () => {
    const { isRtl } = useLang();
    
    // Static data - components will handle their own static data if needed

    return (
        <div
            className="w-full h-screen flex flex-col"
            style={{ background: "var(--bg-all)" }}
        >
            {/* Navigation Bar - Full Width at Top */}
            <NavBar />

            {/* Content Area with SideMenu and Main Content */}
            <div className="flex flex-1 min-h-0" style={{ background: "var(--bg-all)" }}>
                {/* Side Menu - Left side under navbar */}
                <SideMenu />

                {/* Main Content - Rest of the space */}
                <main className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-all)" }}>
                    <div
                        className="h-max rounded-2xl border border-gray-200"
                        style={{ background: "var(--bg-color)" }}
                    >
                        {/* Attendance Logs content */}
                        <div className="w-full h-max p-6"> 
                            {/* Attendance Stats */}
                            <AttendanceStates />
                            
                            {/* Attendance Table */}
                            <AttendanceTable />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AttendanceLogs;