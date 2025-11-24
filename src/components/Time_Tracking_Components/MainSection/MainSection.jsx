import WorkHoursCharts from "../WorkHoursChart/WorkHoursCharts"
import MainContent from "../MainConent/MainContent"

const MainSection = () => {
  return (
    <div className="w-full h-max min-h-screen  p-6">
      <div className="">
        <div className="grid grid-cols-1 xl:grid-cols-2   gap-6 h-full min-h-0">
          <div className="xl:col-span-1 h-full min-h-0">
            <MainContent />
          </div>

          {/* Right section - Charts */}
          <div className="xl:col-span-1 h-full min-h-0 flex flex-col">
            <WorkHoursCharts />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainSection