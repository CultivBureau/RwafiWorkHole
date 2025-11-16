import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../contexts/LangContext";
import {
  LayoutDashboard,
  Clock,
  ListTodo,
  BarChart3,
  LogOut,
  Wallet,
  Settings as SettingsIcon,
  RefreshCw,
  Bot,
  Moon,
  Globe,
  ChevronLeft,
  ChevronDown,
  CalendarCheck,
  Coffee,
  ListChecks,
  FolderKanban,
  LayoutGrid,
  FileBarChart2,
  X,
  Rocket,
  Menu,
} from "lucide-react";
import logo from "../../assets/side-menu-icons/logo.svg?url";
import { useTheme } from "../../contexts/ThemeContext";
import { usePermissions } from "../../services/PermissionProvider";
import { getAdminMenuItemsByPermissions, hasMenuItemPermission } from "../../utils/menuConfig";
import { PermissionGuard } from "../common/PermissionGuard";
import SideBarAdmin from "../admin/SideBarAdmin";
import { getPermissions } from "../../utils/page";



// Custom Toast Component
const Toast = ({ message, isVisible, onClose, type = 'info', isArabic = false }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 z-[9999] ${isArabic
        ? 'left-4 animate-toast-slide-in-rtl'
        : 'right-4 animate-toast-slide-in'
        }`}
    >
      <div
        className="flex items-center bg-[#C9EEF0] gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-sm min-w-[280px]"
        style={{
          background: 'var(--bg-color)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-color)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          direction: isArabic ? 'rtl' : 'ltr',
        }}
      >
        <div className="flex-shrink-0">
          <Rocket className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <span className="font-semibold text-lg">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          style={{
            color: 'var(--sub-text-color)',
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const mainMenuItems = [
  { key: "dashboard", Icon: LayoutDashboard, implemented: true },
  {
    key: "time_tracking",
    Icon: Clock,
    implemented: true,
    children: [
      { key: "attendance", Icon: CalendarCheck, implemented: true },
      { key: "break_tracking", Icon: Coffee, implemented: true },
    ],
  },
  {
    key: "tasks",
    Icon: ListTodo,
    implemented: false,
    children: [
      { key: "tasks-list", Icon: ListChecks, implemented: false },
      { key: "projects", Icon: FolderKanban, implemented: false },
    ],
  },
  { key: "leaves", Icon: LogOut, implemented: true },
];

const settingsItems = [
  { key: "settingsItem", Icon: SettingsIcon, implemented: true }, // <-- هنا التعديل
  { key: "subscriptions", Icon: RefreshCw, implemented: false },
  { key: "help", Icon: Bot, implemented: false },
];

function SideMenuItem({
  item,
  active,
  collapsed,
  onClick,
  openDropdown,
  setOpenDropdown,
  setCollapsed,
  t,
  isArabic,
  onShowToast,
  customLabel,
}) {
  const isActive = active === item.key;
  const hasChildren = !!item.children;
  const isOpen = openDropdown === item.key;
  const isImplemented = item.implemented !== false;

  const handleClick = () => {
    if (!isImplemented) {
      onShowToast(t('comingSoon') || 'Coming Soon!');
      return;
    }

    if (hasChildren) {
      if (collapsed) {
        setCollapsed(false);
        setTimeout(() => setOpenDropdown(item.key), 200);
      } else {
        setOpenDropdown(isOpen ? null : item.key);
      }
      onClick(item.key);
    } else {
      onClick(item.key);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={[
          "group w-full flex items-center gap-2 rounded-full px-2 transition-all duration-200",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hover)]",
          isActive
            ? ""
            : "bg-transparent hover:bg-[var(--hover-color)]",
          collapsed ? "justify-center py-1" : "justify-start py-1.5", // Changed py values
          !isImplemented ? "opacity-60" : "",
        ].join(" ")}
        style={{
          backgroundColor: isActive ? "var(--menu-active-bg)" : "transparent",
          height: collapsed ? "36px" : "40px", // Reduced height for collapsed state
          fontSize: collapsed ? 0 : "14px",
          direction: isArabic ? "rtl" : "ltr",
        }}
      >
        <item.Icon
          className={[
            "shrink-0 transition-colors",
            collapsed ? "w-4 h-4" : "w-4 h-4",
            isActive
              ? ""
              : isImplemented
                ? "text-[var(--sub-text-color)] group-hover:text-[var(--accent-color)]"
                : "text-[var(--sub-text-color)]",
          ].join(" ")}
          style={{
            color: isActive ? "#15919B" : undefined,
          }}
        />
        {!collapsed && (
          <span
            className={[
              "font-medium transition-colors",
              isActive
                ? ""
                : isImplemented
                  ? "text-[var(--sub-text-color)] group-hover:text-[var(--accent-color)]"
                  : "text-[var(--sub-text-color)]",
            ].join(" ")}
            style={{
              background: isActive
                ? "linear-gradient(135deg, #09D1C7, #15919B)"
                : undefined,
              backgroundClip: isActive ? "text" : undefined,
              WebkitBackgroundClip: isActive ? "text" : undefined,
              WebkitTextFillColor: isActive ? "transparent" : undefined,
            }}
          >
            {customLabel || t(`aside.${item.key}`)}
          </span>
        )}
        {hasChildren && !collapsed && (
          <ChevronDown
            className={[
              isArabic ? "mr-auto" : "ml-auto",
              "transition-transform",
              isOpen ? "rotate-180" : "",
              isActive
                ? ""
                : isImplemented
                  ? "text-[var(--sub-text-color)] group-hover:text-[var(--accent-color)]"
                  : "text-[var(--sub-text-color)]",
            ].join(" ")}
            size={16}
            style={{
              color: isActive ? "#15919B" : undefined,
            }}
          />
        )}
      </button>
      {/* Dropdown */}
      {hasChildren && isOpen && !collapsed && (
        <div
          className={
            isArabic
              ? "pr-2 flex flex-col gap-0.5"
              : "pl-6 flex flex-col gap-0.5"
          }
        >
          {item.children.map((child) => {
            const childImplemented = child.implemented !== false;
            const isChildActive = active === child.key;
            return (
              <button
                key={child.key}
                onClick={() => {
                  if (!childImplemented) {
                    onShowToast(t('comingSoon') || 'Coming Soon!');
                    return;
                  }
                  onClick(child.key);
                }}
                className={[
                  "group w-full flex items-center gap-2 rounded-full p-1 text-[13px] font-medium transition-all duration-200", // Changed py-1 to py-0.5
                  isChildActive
                    ? ""
                    : "bg-transparent text-[var(--sub-text-color)] hover:bg-[var(--hover-color)] hover:text-[var(--accent-color)]",
                  !childImplemented ? "opacity-60" : "",
                ].join(" ")}
                style={{
                  backgroundColor: isChildActive ? "var(--menu-active-bg)" : "transparent",
                  height: "36px", // Reduced height
                  fontSize: "14px",
                  direction: isArabic ? "rtl" : "ltr",
                }}
              >
                <child.Icon
                  className={[
                    "shrink-0 transition-colors w-4 h-4",
                    isChildActive
                      ? ""
                      : childImplemented
                        ? "text-[var(--sub-text-color)] group-hover:text-[var(--accent-color)]"
                        : "text-[var(--sub-text-color)]",
                  ].join(" ")}
                  style={{
                    color: isChildActive ? "#15919B" : undefined,
                  }}
                />
                <span
                  className={[
                    isChildActive
                      ? ""
                      : childImplemented
                        ? "text-[var(--sub-text-color)] group-hover:text-[var(--accent-color)]"
                        : "text-[var(--sub-text-color)]",
                  ].join(" ")}
                  style={{
                    background: isChildActive
                      ? "linear-gradient(135deg, #09D1C7, #15919B)"
                      : undefined,
                    backgroundClip: isChildActive ? "text" : undefined,
                    WebkitBackgroundClip: isChildActive ? "text" : undefined,
                    WebkitTextFillColor: isChildActive ? "transparent" : undefined,
                  }}
                >
                  {t(`aside.${child.key}`)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function LanguageToggle({ lang, onToggle, collapsed, t, isArabic }) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center rounded-full p-2 transition-all duration-200 border"
        style={{
          backgroundColor: "var(--bg-color)",
          borderColor: "var(--border-color)",
        }}
      >
        <Globe className="w-5 h-5" style={{ color: "var(--accent-color)" }} />
      </button>
    );
  }
  return (
    <div
      className="w-full flex items-center justify-between rounded-2xl px-2 py-2 shadow-sm border"
      style={{
        backgroundColor: "var(--bg-color)",
        borderColor: "var(--border-color)",
        direction: isArabic ? "rtl" : "ltr",
      }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text-color)" }}
      >
        {lang === "ar" ? t("aside.arabic") : t("aside.english")}
      </span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={lang === "ar"}
        className="relative inline-flex items-center justify-start rounded-full shadow-sm border transition-all duration-200"
        style={{
          width: 42,
          height: 22,
          background: "var(--toggle-bg)",
          borderColor: "var(--toggle-border)",
          paddingLeft: 3,
          paddingRight: 3,
        }}
      >
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[var(--accent-color)]">
          <Globe className="w-3 h-3" />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-out rounded-full shadow-md"
          style={{
            left: lang === "ar" ? 20 : 3,
            width: 12,
            height: 12,
            background:
              "linear-gradient(135deg, var(--knob-gradient-start) 0%, var(--knob-gradient-end) 100%)",
          }}
        >
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
      </button>
    </div>
  );
}

function ThemeToggle({ theme, onToggle, collapsed, t, isArabic }) {
  const isDark = theme === "dark";
  if (collapsed) {
    return (
      <div className="w-full flex justify-center items-center py-1">
        {/* Remove the button completely when collapsed */}
      </div>
    );
  }
  return (
    <div
      className="w-full flex items-center justify-between rounded-2xl px-2 py-2 shadow-sm border"
      style={{
        backgroundColor: "var(--bg-color)",
        borderColor: "var(--border-color)",
        direction: isArabic ? "rtl" : "ltr",
      }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: "var(--text-color)" }}
      >
        {isDark ? t("aside.darkMode") : t("aside.lightMode")}
      </span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={isDark}
        className="relative inline-flex items-center justify-start rounded-full shadow-sm border transition-all duration-200"
        style={{
          width: 42,
          height: 22,
          background: "var(--toggle-bg)",
          borderColor: "var(--toggle-border)",
          paddingLeft: 3,
          paddingRight: 3,
        }}
      >
        <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[var(--accent-color)]">
          <Moon className="w-3 h-3" />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-out rounded-full shadow-md"
          style={{
            left: isDark ? 20 : 3,
            width: 12,
            height: 12,
            background:
              "linear-gradient(135deg, var(--knob-gradient-start) 0%, var(--knob-gradient-end) 100%)",
          }}
        >
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white/20 rounded-full"></div>
        </div>
      </button>
    </div>
  );
}

export default function SideMenu({ isMobileOpen, onMobileClose }) {
  const { t, i18n } = useTranslation();
  const { lang, setLang } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add this temporary state for testing
  const [tempMobileOpen, setTempMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isArabic = i18n.language === "ar";
  const { theme, setTheme } = useTheme();

  // Get permissions from context
  const { isAdmin, isLoading, permissions: userPermissions } = usePermissions();
  const backendPermissionCodes = getPermissions() || []; // Get backend codes for menu filtering
  
  // Get all admin menu items filtered by backend permissions
  // This hook must be called before any early returns
  const allAdminMenuItems = useMemo(() => {
    // Admin has their own sidebar, so don't show these here
    if (isAdmin()) {
      return [];
    }
    // Filter menu items based on backend permissions
    return getAdminMenuItemsByPermissions().filter(item => {
      // Check if user has permission for this menu item
      return hasMenuItemPermission(item);
    });
  }, [isAdmin, backendPermissionCodes]);

  // Use temporary state if props are not provided
  const actualIsMobileOpen = isMobileOpen !== undefined ? isMobileOpen : tempMobileOpen;
  const actualOnMobileClose = onMobileClose || (() => setTempMobileOpen(false));

  // Custom toast function
  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  // تحديد الـ active بناءً على الـ route الحالي
  const getActiveKey = () => {
    if (location.pathname.startsWith("/pages/User/dashboard"))
      return "dashboard";
    if (location.pathname.startsWith("/pages/User/leaves")) return "leaves";
    if (location.pathname.startsWith("/pages/User/time_tracking"))
      return "time_tracking";
    if (location.pathname.startsWith("/pages/User/attendance-logs"))
      return "attendance";
    if (location.pathname.startsWith("/pages/User/break-tracking"))
      return "break_tracking";
    // Check admin routes for custom roles
    if (location.pathname.startsWith("/pages/admin/leaves")) return "admin_leaves";
    if (location.pathname.startsWith("/pages/admin/attendance")) return "admin_attendance";
    if (location.pathname.startsWith("/pages/admin/break")) return "admin_break";
    if (location.pathname.startsWith("/pages/admin/all-employees")) return "admin_employees";
    if (location.pathname.startsWith("/pages/admin/new-employee")) return "admin_new_employee";
    if (location.pathname.startsWith("/pages/admin/all-departments")) return "admin_departments";
    if (location.pathname.startsWith("/pages/admin/new-department")) return "admin_new_department";
    if (location.pathname.startsWith("/pages/admin/edit-department")) return "admin_departments";
    if (location.pathname.startsWith("/pages/admin/company")) return "admin_company";
    if (location.pathname.startsWith("/pages/admin/Roles&Permissions")) return "admin_roles_permissions";
    if (location.pathname.startsWith("/pages/admin/New_Role")) return "admin_new_role";
    if (location.pathname.startsWith("/pages/admin/shifts")) return "admin_shifts";
    return "";
  };
  const active = getActiveKey();

  // Add temporary button to test mobile sidebar (remove this after fixing)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'm' && e.ctrlKey) {
        setTempMobileOpen(!tempMobileOpen);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [tempMobileOpen]);

  // فتح dropdown تلقائي لو كنت على time_tracking أو أي صفحة من children بتوعها
  useEffect(() => {
    if (
      active === "time_tracking" ||
      active === "attendance" ||
      active === "break_tracking"
    ) {
      setOpenDropdown("time_tracking");
    }
    // Auto-open dropdown for admin menu items with children
    if (active === "admin_departments" || active === "admin_new_department") {
      setOpenDropdown("admin_departments");
    }
    if (active === "admin_roles_permissions" || active === "admin_new_role") {
      setOpenDropdown("admin_roles_permissions");
    }
  }, [active]);

  // Set language from localStorage or default to "en"
  useEffect(() => {
    const lang = localStorage.getItem("lang") || "en";
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [i18n]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Ignore errors
    }
  }, [theme]);
  
  // Wait for permissions to load
  if (isLoading) {
    return null; // Don't show anything while loading
  }
  
  // If user is admin, show admin sidebar instead
  // Admin sidebar will show user menu items based on permissions
  if (isAdmin()) {
    return <SideBarAdmin isMobileOpen={isMobileOpen} onMobileClose={onMobileClose} />;
  }

  // تعديل دالة onClick:
  const handleMenuClick = (key) => {
    if (key === "dashboard") navigate("/pages/User/dashboard");
    else if (key === "leaves") navigate("/pages/User/leaves");
    else if (key === "time_tracking") {
      navigate("/pages/User/time_tracking");
    } else if (key === "attendance") navigate("/pages/User/attendance-logs");
    else if (key === "break") navigate("/pages/User/break");
    else if (key === "break_tracking") navigate("/pages/User/break-tracking");
    // Handle admin routes for custom roles
    else if (key === "admin_leaves") navigate("/pages/admin/leaves");
    else if (key === "admin_attendance") navigate("/pages/admin/attendance");
    else if (key === "admin_break") navigate("/pages/admin/break");
    else if (key === "admin_employees") navigate("/pages/admin/all-employees");
    else if (key === "admin_new_employee") navigate("/pages/admin/new-employee");
    else if (key === "admin_teams") navigate("/pages/admin/all-teams");
    else if (key === "admin_departments") navigate("/pages/admin/all-departments");
    else if (key === "admin_new_department") navigate("/pages/admin/new-department");
    else if (key === "admin_company") navigate("/pages/admin/company");
    else if (key === "admin_roles_permissions") navigate("/pages/admin/Roles&Permissions");
    else if (key === "admin_new_role") navigate("/pages/admin/New_Role");
    else if (key === "admin_shifts") navigate("/pages/admin/shifts");
  };

  // Settings click handler
  const handleSettingsClick = (key) => {
    if (key === "settingsItem") {
      navigate("/pages/User/profile"); // ← هنا المسار الصحيح حسب الراوتنج عندك
      return;
    }
    const settingsItem = settingsItems.find(item => item.key === key);
    if (!settingsItem?.implemented) {
      showToast(t('comingSoon'));
      return;
    }
  };

  // Handle mobile menu item click
  const handleMobileMenuClick = (key) => {
    const allItems = [...mainMenuItems, ...allAdminMenuItems, ...settingsItems];
    const item = allItems.find(item => item.key === key) ||
      allItems.flatMap(item => item.children || []).find(child => child.key === key);

    if (!item?.implemented) {
      showToast(t('comingSoon'));
      actualOnMobileClose();
      return;
    }

    handleMenuClick(key);
    actualOnMobileClose();
  };

  // Desktop sidebar classes
  const desktopSidebarClasses = [
    "hidden lg:flex flex-col min-h-0 overflow-hidden rounded-3xl shadow-sm",
    collapsed ? "w-20" : "w-[280px]",
    "ml-4 mr-2 my-4 p-3 border",
  ].join(" ");

  // Mobile sidebar classes
  const mobileSidebarClasses = [
    "fixed inset-y-0 left-0 z-50 w-80 flex flex-col bg-[var(--bg-color)] border-r border-[var(--border-color)]",
    "transform transition-transform duration-300 ease-in-out lg:hidden",
    actualIsMobileOpen ? "translate-x-0" : "-translate-x-full",
  ].join(" ");

  // Mobile overlay
  const MobileOverlay = () => {
    if (!actualIsMobileOpen) return null;
    return (
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-lg z-40 lg:hidden"
        onClick={actualOnMobileClose}
      />
    );
  };

  // Sidebar content component
  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-4 p-2">
        <div className="flex items-center gap-3">
          <div className="size-10 grid place-items-center">
            <img src={logo} alt="WorkHole" className="h-10" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="text-left flex items-center" dir="ltr">
              <span className="text-lg font-bold gradient-text">Work</span>
              <span className="text-lg font-bold text-[var(--sub-text-color]">
                Hole
              </span>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={actualOnMobileClose}
            className="rounded-xl p-2 hover:bg-[var(--hover-color)] transition-colors"
            title="Close"
          >
            <X
              className="w-5 h-5"
              style={{ color: "var(--text-color)" }}
            />
          </button>
        ) : (
          !collapsed && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="rounded-xl p-2 hover:bg-[var(--hover-color)] transition-colors"
              title="Collapse"
            >
              <ChevronLeft
                className="w-5 h-5 transition-transform"
                style={{ color: "var(--text-color)" }}
              />
            </button>
          )
        )}
      </div>

      {/* Collapse/Expand button when collapsed (desktop only) */}
      {collapsed && !isMobile && (
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-2xl p-2 hover:bg-[var(--hover-color)] transition-colors"
            title="Expand"
          >
            <ChevronLeft
              className="w-5 h-5 transition-transform rotate-180"
              style={{ color: "var(--text-color)" }}
            />
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div className={collapsed && !isMobile ? "min-h-0 flex-1 pr-1" : "min-h-0 flex-1 overflow-y-auto pr-1"}>
        {(!collapsed || isMobile) && (
          <p
            className={`px-3 pb-2 text-xs tracking-wide uppercase font-semibold ${isArabic ? "text-right" : "text-left"
              }`}
            style={{
              color: "var(--sub-text-color)",
              direction: isArabic ? "rtl" : "ltr",
            }}
          >
            {t("aside.mainMenu")}
          </p>
        )}
        <nav
          className="flex px-2 flex-col gap-1"
          style={{ alignItems: collapsed && !isMobile ? "center" : "stretch" }}
        >
          {mainMenuItems.map((item) => (
            <SideMenuItem
              key={item.key}
              item={item}
              active={getActiveKey()}
              collapsed={collapsed && !isMobile}
              onClick={isMobile ? handleMobileMenuClick : handleMenuClick}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              setCollapsed={setCollapsed}
              t={t}
              isArabic={isArabic}
              onShowToast={showToast}
            />
          ))}
        </nav>

        {/* Admin Menu Items for Custom Roles - Using react-permission-guard */}
        {allAdminMenuItems.length > 0 && (
          <>
            {(!collapsed || isMobile) && (
              <p
                className={`px-3 pt-4 pb-2 text-xs tracking-wide uppercase font-semibold ${isArabic ? "text-right" : "text-left"
                  }`}
                style={{
                  color: "var(--sub-text-color)",
                  direction: isArabic ? "rtl" : "ltr",
                }}
              >
                {t("aside.adminMenu") || "Admin"}
              </p>
            )}
            <nav
              className="flex px-2 flex-col gap-1"
              style={{ alignItems: collapsed && !isMobile ? "center" : "stretch" }}
            >
              {allAdminMenuItems.map((item) => {
                // Filter children by backend permissions
                const filteredChildren = item.children 
                  ? item.children.filter(child => {
                      return hasMenuItemPermission(child);
                    })
                  : null;

                // Only show parent if there are visible children or no children
                if (item.children && filteredChildren.length === 0) {
                  return null;
                }

                return (
                  <PermissionGuard
                    key={item.key}
                    backendPermissions={item.backendPermissions}
                    fallback={null}
                  >
                    <SideMenuItem
                      item={{
                        key: item.key,
                        Icon: item.Icon,
                        implemented: true,
                        children: filteredChildren ? filteredChildren.map(child => ({
                          key: child.key,
                          Icon: child.Icon,
                          implemented: true,
                        })) : undefined,
                      }}
                      active={getActiveKey()}
                      collapsed={collapsed && !isMobile}
                      onClick={isMobile ? handleMobileMenuClick : handleMenuClick}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      setCollapsed={setCollapsed}
                      t={t}
                      isArabic={isArabic}
                      onShowToast={showToast}
                      customLabel={t(`aside.${item.key}`) || item.name}
                      childLabels={filteredChildren ? filteredChildren.reduce((acc, child) => {
                        acc[child.key] = child.name;
                        return acc;
                      }, {}) : undefined}
                    />
                  </PermissionGuard>
                );
              })}
            </nav>
          </>
        )}

        {(!collapsed || isMobile) && (
          <p
            className={`px-3 pt-4 pb-2 text-xs tracking-wide uppercase font-semibold ${isArabic ? "text-right" : "text-left"
              }`}
            style={{
              color: "var(--sub-text-color)",
              direction: isArabic ? "rtl" : "ltr",
            }}
          >
            {t("aside.settings")}
          </p>
        )}
        <nav
          className="flex px-2 flex-col gap-1 pb-2"
          style={{ alignItems: collapsed && !isMobile ? "center" : "stretch" }}
        >
          {settingsItems.map((item) => (
            <SideMenuItem
              key={item.key}
              item={item}
              active={getActiveKey()}
              collapsed={collapsed && !isMobile}
              onClick={isMobile ? handleMobileMenuClick : handleSettingsClick}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              setCollapsed={setCollapsed}
              t={t}
              isArabic={isArabic}
              onShowToast={showToast}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Language & Theme Toggle */}
      <div className="shrink-0 pt-3 mb-2 space-y-2">
        <div className="block sm:hidden">
          <LanguageToggle
            lang={lang}
            onToggle={() => {
              const newLang = lang === "ar" ? "en" : "ar";
              setLang(newLang);
            }}
            collapsed={collapsed && !isMobile}
            t={t}
            isArabic={isArabic}
          />
        </div>
        <ThemeToggle
          theme={theme}
          onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          collapsed={collapsed && !isMobile}
          t={t}
          isArabic={isArabic}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Custom Toast - pass isArabic prop */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={hideToast}
        isArabic={isArabic}
      />

      {/* Hamburger Menu Button - Only Visible on Mobile/Small Screens */}
      <button
        className="fixed bottom-4 left-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 lg:hidden"
        style={{
          background: 'var(--bg-color)',
          borderColor: 'var(--border-color)',
          border: '1px solid',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
        onClick={() => setTempMobileOpen(!tempMobileOpen)}
        aria-label="Toggle Menu"
      >
        <Menu
          className="w-6 h-6 transition-colors"
          style={{ color: 'var(--text-color)' }}
        />
      </button>

      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Mobile Sidebar */}
      <aside
        className={mobileSidebarClasses}
        style={{
          height: "100vh",
          padding: "1rem",
        }}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={desktopSidebarClasses}
        style={{
          background: "var(--bg-color)",
          borderColor: "var(--border-color)",
          height: "calc(100vh - 96px)",
        }}
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}
