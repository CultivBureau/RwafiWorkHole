import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import CompanyDetailsCard from "../../../components/admin/company/company-details-card";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import { useTranslation } from "react-i18next";

const Company = () => {
  const { t } = useTranslation();
  
  return (
    <PermissionGuard 
      backendPermissions={["Company.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="flex h-screen w-full flex-col" style={{ background: "var(--bg-all)" }}>
      <NavBarAdmin />

      <div className="flex flex-1 min-h-0">
        <SideBarAdmin />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12 lg:px-12">


            <CompanyDetailsCard />

            <section
              className="rounded-3xl border overflow-hidden"
              style={{
                background: "var(--bg-color)",
                borderColor: "var(--border-color)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            >
            
              
          
            </section>
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default Company;