import React from 'react'

export default function DataReview({ data, fieldLabels }) {
  // Helper function to render value with enhanced colored bullet points
  const renderValue = (value) => {
    if (typeof value !== 'string') return value
    
    // Check if value contains bullet points (•)
    if (value.includes(' • ')) {
      const parts = value.split(' • ').filter(Boolean)
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 w-full text-center sm:text-left">
          {parts.map((part, index) => (
            <div
              key={index}
              className="flex items-center gap-2 justify-center sm:justify-start text-sm sm:text-base"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: 'rgb(77, 184, 172)',
                  boxShadow: '0 0 8px rgba(77, 184, 172, 0.4)',
                }}
              />
              <span className="transition-colors duration-200">{part}</span>
            </div>
          ))}
        </div>
      )
    }
    
    return value
  }

  const fields = Object.keys(data).map((key) => ({
    label: fieldLabels[key] || key,
    value: data[key],
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 md:gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-7 md:gap-y-8 lg:gap-y-10">
      {fields.map((field, index) => (
        <div 
          key={index} 
          className="space-y-2.5 sm:space-y-3 group cursor-pointer p-3 sm:p-4 -m-3 sm:-m-4 rounded-xl transition-all duration-300 hover:bg-[var(--hover-color)] hover:shadow-sm text-center"
        >
          <label 
            className="text-xs sm:text-sm font-semibold block transition-colors duration-300 uppercase tracking-wide"
            style={{ color: 'var(--sub-text-color)' }}
          >
            {field.label}
          </label>
          <div 
            className="text-sm sm:text-base font-medium leading-relaxed relative transition-all duration-300 flex items-center justify-center"
            style={{ color: 'var(--text-color)' }}
          >
            <p className="break-words">
              {renderValue(field.value)}
            </p>
            {/* Enhanced hover underline with glow effect */}
            <span 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-3/4 transition-all duration-500 ease-out rounded-full"
              style={{ 
                backgroundColor: 'rgb(77, 184, 172)',
                boxShadow: '0 0 8px rgba(77, 184, 172, 0.5)'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
