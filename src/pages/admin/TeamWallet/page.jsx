import React, { useState, useEffect, useCallback } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { useLang } from "../../../contexts/LangContext";
import Card from "../../../components/Time_Tracking_Components/Stats/Card";
import Table from "../../../components/admin/TeamWallet/Table/Table";
import TopTeamChart from "../../../components/admin/TeamWallet/TopTeamChart/TopTeamChart";
import TeamOverView from "../../../components/admin/TeamWallet/TeamOverView/TeamOverView";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

const AdminTeamWallet = () => {
  const { lang, isRtl } = useLang();
  const { t } = useTranslation();

  const cardData = [
    {
      title: t("adminTeamWallet.cards.totalPenalties"),
      value: "$12000",
      icon: <img src="/assets/AdminTeamWallet/money.svg" alt="Efficiency Score" />
    },
    {
      title: t("adminTeamWallet.cards.teamsWithWarnings"),
      value: "4 Teams",
      icon: <img src="/assets/AdminTeamWallet/warning.svg" alt="KPI Trend vs Last Month" />
    },
    {
      title: t("adminTeamWallet.cards.highestPenaltyTeam"),
      value: "$6800",
      icon: <img src="/assets/AdminTeamWallet/team.svg" alt="KPI Achievements" />
    },
    {
      title: t("adminTeamWallet.cards.resolvedIssues"),
      value: "10",
      icon: <img src="/assets/AdminTeamWallet/issue.svg" alt="Pending KPI Approvals" />
    },
  ]

  return (
    <PermissionGuard 
      backendPermissions={[]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
        <NavBarAdmin/>
        <div className="flex flex-1 min-h-0">
          <SideBarAdmin />
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-4 xl:p-6 bg-[var(--bg-all)]">
          {/* Stats Cards - Enhanced Responsive Grid */}
          <div className="w-full h-max grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-3 xl:gap-4 mb-3 sm:mb-4 md:mb-4 lg:mb-5 xl:mb-6">
            {cardData.map((card, index) => (
              <Card
                key={index}
                header={card.title}
                rightIcon={card.icon}
                title={card.value}
              />
            ))}
          </div>

          {/* Charts Section - Responsive Layout */}
          <section className="w-full h-max pb-5 flex flex-col xl:flex-row justify-center items-start gap-3 lg:gap-4">
            {/* Team Overview - Main Chart */}
            <div className="w-full xl:w-[68%] 2xl:w-[70%] h-full">
              <TeamOverView />
            </div>
            {/* Top Team Chart - Side Chart */}
            <div className="w-full xl:w-[32%] 2xl:w-[30%] h-max flex justify-center items-center">
              <TopTeamChart />
            </div>
          </section>

          {/* Table Section */}
          <div className="w-full h-max">
            <Table />
          </div>
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default AdminTeamWallet;