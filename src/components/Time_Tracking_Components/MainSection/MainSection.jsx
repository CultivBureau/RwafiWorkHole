import WorkHoursCharts from "../WorkHoursChart/WorkHoursCharts"
import TimeFocusLogs from "../timerLogs/TimerLogs"
import MainContent from "../MainConent/MainContent"

const MainSection = () => {
  return (
    <div className="w-full h-max min-h-screen  p-6">
      <div className="">
        <div className="grid grid-cols-1 xl:grid-cols-2   gap-6 h-full min-h-0">
          <div className="xl:col-span-1 h-full min-h-0">
            <MainContent />
          </div>

          {/* Right section - Charts and Logs */}
          <div className="xl:col-span-1 h-full min-h-0 flex flex-col space-y-6">
            <WorkHoursCharts />
            <div className="flex-1 min-h-0 flex flex-col">
              <TimeFocusLogs />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainSection