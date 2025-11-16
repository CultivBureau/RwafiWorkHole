import React from 'react'
import { useLang } from '../../../contexts/LangContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useTranslation } from "react-i18next";
const QuickActions = () => {
    const { t, i18n } = useTranslation();
    const { isRtl } = useLang();
    const { theme } = useTheme();
    const data = [
        {
            id: 1,
            title: 'Clock In / Out',
            description: 'Dont be late start your day strong',
            icon: '/assets/performance/clockin.svg',
            path: '/pages/users/time_tracking'
        },

        {
            id: 2,
            title: 'Submit Progress',
            description: 'Keep your progress visible and tracked',
            icon: '/assets/performance/start.svg',
            path: '/pages/users/time_tracking'
        },
        {
            id: 3,
            title: 'Create New Task',
            description: 'Set a task now every task done boosts your KPI',
            icon: '/assets/performance/tasks.svg',
            path: '/pages/users/time_tracking'
        },
        {
            id: 4,
            title: 'Request Leave',
            description: 'Plan your time off without affecting performance',
            icon: '/assets/performance/leave.svg',
            path: '/pages/users/time_tracking'
        }
    ]
  return (
    <div className='w-full h-max pb-2 pt-2 flex justify-center gap-2 items-center'>
        <div className='w-[60%] h-max flex bg-[var(--bg-color)] shadow-lg rounded-[22px]  justify-center gap-5 flex-wrap items-center pt-5 pb-5 '>
        {data.map((item) => (
              <div className='w-[45%] min-w-[210px] border border-[var(--border-color)] h-max flex justify-center items-center pt-2 pb-2 pl-2 rounded-[8px]'>
              <div className='w-[20%] h-[50px]  bg-[#C9EEF0] flex justify-center items-center rounded-[8px]'>
               <img src={item.icon} alt={item.title} />
              </div>
              <div className='w-[50%] h-[50px] flex justify-center items-center pl-3 flex-col gap-1 '>
               <h1 className='w-full h-max text-[9px] text-[var(--text-color)] text-start font-semibold'>{item.title}</h1>
               <p className='w-full h-max text-[7px] text-[var(--sub-text-color)] text-start font-normal'>{item.description}</p>
              </div>
              <div className='w-[30%] h-[50px] flex justify-center items-center '>
               <button className='w-[80%] h-[22px] text-[8px] rounded-[4px] border border-[var(--border-color)] flex justify-center items-center shadow-2xl  gradient-text font-medium' onClick={() => navigate(item.path)}>Take me</button>
              </div>
              <div></div>
       </div>
            ))}
        </div>
        <div className='w-[40%] h-max flex justify-center  shadow-lg rounded-[22px] lg:min-w-[347px] items-center pt-7 pb-7 '>
         <img src="/assets/performance/pic.svg" alt="pic for performance" />
        </div>
    </div>
  )
}

export default QuickActions