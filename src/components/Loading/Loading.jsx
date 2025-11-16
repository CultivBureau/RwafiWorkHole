import React from 'react'

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-[var(--bg-color)] flex items-center justify-center z-50">
      {/* Background Pattern */} 
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(9,209,199,0.05)_0%,transparent_50%)]"></div>
      
      {/* Main Loading Container */}
      <div className="relative flex flex-col items-center justify-center space-y-8">
        
        {/* Logo Container with Spinning Animation */}
        <div className="relative">
          {/* Outer Ring Animation */}
          <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-transparent border-t-[#09D1C7] border-r-[#15919B] animate-spin opacity-20"></div>
          
          {/* Middle Ring Animation */}
          <div className="absolute inset-2 w-28 h-28 rounded-full border-2 border-transparent border-t-[#15919B] border-l-[#09D1C7] animate-spin animation-delay-150 opacity-30" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          
          {/* Logo Container */}
          <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-2xl border border-gray-100">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#09D1C7]/10 to-[#15919B]/10"></div>
            
            {/* Logo with Pulse Animation */}
            <div className="relative z-10 animate-pulse">
              <img 
                src="/logo.svg" 
                alt="WorkHole Logo" 
                className="w-16 h-16 drop-shadow-sm"
              />
            </div>
          </div>
          
          {/* Floating Particles */}
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#09D1C7] rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-4 right-0 w-1.5 h-1.5 bg-[#15919B] rounded-full animate-ping animation-delay-300 opacity-50"></div>
          <div className="absolute bottom-0 left-4 w-1 h-1 bg-[#09D1C7] rounded-full animate-ping animation-delay-500 opacity-60"></div>
          <div className="absolute bottom-4 right-4 w-1.5 h-1.5 bg-[#15919B] rounded-full animate-ping animation-delay-700 opacity-40"></div>
        </div>

        {/* Loading Text and Progress */}
        <div className="text-center space-y-4">
          {/* Loading Text with Gradient */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#09D1C7] to-[#15919B] bg-clip-text text-transparent">
            WorkHole
          </h2>
          
          {/* Subtitle */}
          <p className="text-gray-500 text-sm font-medium">
            Preparing your workspace...
          </p>
          
          {/* Progress Bar */}
          <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#09D1C7] to-[#15919B] rounded-full animate-progress"></div>
          </div>
          
          {/* Dots Animation */}
          <div className="flex justify-center space-x-2 pt-2">
            <div className="w-2 h-2 bg-[#09D1C7] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#0FB8B3] rounded-full animate-bounce animation-delay-100"></div>
            <div className="w-2 h-2 bg-[#15919B] rounded-full animate-bounce animation-delay-200"></div>
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-400 font-medium">
          Powered by WorkHole © 2024
        </p>
      </div>

      {/* Custom CSS for additional animations */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 60%; }
          100% { width: 100%; }
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-8px);
          }
          70% {
            transform: translateY(-4px);
          }
          90% {
            transform: translateY(-2px);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}

export default Loading