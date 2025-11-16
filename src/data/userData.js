


export const userData = {
    // Basic User Information
    firstName: "Abdallah",
    lastName: "wael", 
    email: "abdallah.wael@example.com",
    phone: "01110238273",
    role: "employee",
    avatar: "/assets/AdminDashboard/avatar.svg",
    teamLeader: "Mark Williams",
    teamLeaderAvatar: "/assets/AdminDashboard/avatar.svg",
    status: "active",
    locale: "en",
    
    // Personal Information Section
    personalInfo: {
      firstName: "Abdallah",
      lastName: "wael",
      mobileNumber: "01110238273",
      emailAddress: "abdallah.wael@example.com",
      dateOfBirth: "July 14, 1995",
      maritalStatus: "Married",
      gender: "Male",
      nationality: "Egyptian",
      address: "2464 Royal Ln. Mesa, New Jersey",
      city: "California",
      state: "United State",
      zipCode: "35624"
    },
  
    // Professional Information Section
    professionalInfo: {
      employeeId: "1234567890",
      employeeType: "Office",
      department: "Project Manager",
      workingDays: "5 Days",
      userName: "abdallah_wael",
      emailAddress: "abdallah.wael@example.com",
      designation: "Project Manager",
      joiningDate: "July 10, 2022",
      officeLocation: "2464 Royal Ln. Mesa, New Jersey"
    },
  
    // Documents Section
    documents: [
      {
        id: 1,
        name: "Appointment Letter.pdf",
        type: "pdf",
        uploadDate: "2022-07-10"
      },
      {
        id: 2,
        name: "Salary Slip_June.pdf",
        type: "pdf",
        uploadDate: "2023-06-30"
      },
      {
        id: 3,
        name: "Salary Slip_May.pdf",
        type: "pdf",
        uploadDate: "2023-05-31"
      },
      {
        id: 4,
        name: "Salary Slip_April.pdf",
        type: "pdf",
        uploadDate: "2023-04-30"
      },
      {
        id: 5,
        name: "Reliving Letter.pdf",
        type: "pdf",
        uploadDate: "2023-01-15"
      },
      {
        id: 6,
        name: "Experience Letter.pdf",
        type: "pdf",
        uploadDate: "2023-01-15"
      }
    ],
  
    // Account Access Section
    accountAccess: {
      emailAddress: "abdallah.wael@example.com",
      userName: "abdallah_wael",
      role: "Employee",
      permissions: {
        timeAttendance: [
          "Clock In / Clock Out",
          "Start / End Break", 
          "View Own Attendance & Break Logs"
        ],
        leaveManagement: [
          "View Own Leave Balance & Requests",
          "Create Leave Request"
        ],
        tasksProjects: [
          "Create Task",
          "View Own Tasks & Projects",
          "Update Task Status"
        ]
      }
    },
  
    // Attendance Section
    attendance: [
      {
        id: 1,
        date: "July 01, 2023",
        checkIn: "09:28 AM",
        checkOut: "07:00 PM",
        break: "00:30 Min",
        workingHours: "09:02 Hrs",
        status: "On Time"
      },
      {
        id: 2,
        date: "July 02, 2023",
        checkIn: "09:20 AM",
        checkOut: "07:00 PM",
        break: "00:20 Min",
        workingHours: "09:20 Hrs",
        status: "On Time"
      },
      {
        id: 3,
        date: "July 03, 2023",
        checkIn: "09:25 AM",
        checkOut: "07:00 PM",
        break: "00:30 Min",
        workingHours: "09:05 Hrs",
        status: "On Time"
      },
      {
        id: 4,
        date: "July 04, 2023",
        checkIn: "09:45 AM",
        checkOut: "07:00 PM",
        break: "00:40 Min",
        workingHours: "08:35 Hrs",
        status: "Late"
      },
      {
        id: 5,
        date: "July 05, 2023",
        checkIn: "10:00 AM",
        checkOut: "07:00 PM",
        break: "00:30 Min",
        workingHours: "08:30 Hrs",
        status: "Late"
      }
    ],
  
    // Projects Section
    projects: [
      {
        id: 1,
        projectName: "Amongus - Discovery Phase",
        startDate: "Feb 01, 2023",
        finishDate: "Mar 05, 2023",
        status: "Completed"
      },
      {
        id: 2,
        projectName: "Wildcare - Development Project",
        startDate: "Feb 12, 2023",
        finishDate: "April 20, 2023",
        status: "Completed"
      },
      {
        id: 3,
        projectName: "Hingutsan Web Development",
        startDate: "April 05, 2023",
        finishDate: "October 05, 2023",
        status: "In Process"
      },
      {
        id: 4,
        projectName: "Montilisy Ecommerce Platform",
        startDate: "May 12, 2023",
        finishDate: "August 12, 2023",
        status: "In Process"
      }
    ],
  
    // Leave Section
    leaveRequests: [
      {
        id: 1,
        date: "July 01, 2023",
        duration: "July 05 - July 08",
        days: "3 Days",
        reportingManager: "Mark Williams",
        status: "Pending"
      },
      {
        id: 2,
        date: "Apr 05, 2023",
        duration: "Apr 06 - Apr 10",
        days: "4 Days",
        reportingManager: "Mark Williams",
        status: "Approved"
      },
      {
        id: 3,
        date: "Mar 12, 2023",
        duration: "Mar 14 - Mar 16",
        days: "2 Days",
        reportingManager: "Mark Williams",
        status: "Approved"
      },
      {
        id: 4,
        date: "Feb 01, 2023",
        duration: "Feb 02 - Feb 10",
        days: "8 Days",
        reportingManager: "Mark Williams",
        status: "Approved"
      },
      {
        id: 5,
        date: "Jan 01, 2023",
        duration: "Jan 16 - Jan 19",
        days: "3 Days",
        reportingManager: "Mark Williams",
        status: "Reject"
      }
    ]
  }