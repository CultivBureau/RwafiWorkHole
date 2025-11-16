import React from "react";
import SideMenu from "../../../components/side-menu/side-menu";
import NavBar from "../../../components/NavBar/navbar";
import StatusCards from "../../../components/team-wallet/status-cards";
import CenterContent from "../../../components/team-wallet/center-content";
import TeamWalletTable from "../../../components/team-wallet/table";

const TeamWallet = () => {
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
                <main
                    className="flex-1 overflow-auto p-4"
                    style={{ background: "var(--bg-all)" }}
                >
                    <div
                        className="h-max rounded-2xl border border-gray-200"
                        style={{ background: "var(--bg-color)" }}
                    >
                        {/* Team Wallet content */}
                        <div className="w-full h-max p-6">
                            {/* Team Wallet Status Cards */}
                            <StatusCards />
                            {/* Center Content Cards */}
                            <CenterContent />
                            {/* Team Wallet Table */}
                            <TeamWalletTable />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TeamWallet;