import React from 'react'

const Table = ({ 
  data, 
  columns, 
  title, 
  emptyMessage = "No data available",
  statusConfig = null 
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 sm:py-16 rounded-xl border"
        style={{ 
          backgroundColor: 'var(--bg-color)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="text-3xl sm:text-4xl mb-4">📊</div>
        <p 
          className="text-base sm:text-lg font-medium text-center px-4"
          style={{ color: 'var(--sub-text-color)' }}
        >
          {emptyMessage}
        </p>
      </div>
    )
  }

  const getStatusBadge = (status, statusConfig) => {
    if (!statusConfig) return status
    
    const config = statusConfig[status]
    if (!config) {
      return (
        <span 
          className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: 'var(--hover-color)',
            color: 'var(--text-color)'
          }}
        >
          {status}
        </span>
      )
    }
    
    return (
      <span 
        className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: config.bg,
          color: config.text
        }}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {title && (
        <div className="space-y-2">
          <h2 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--text-color)' }}
          >
            {title}
          </h2>
          <p 
            className="text-xs sm:text-sm font-medium"
            style={{ color: 'var(--sub-text-color)' }}
          >
            {data.length} records found
          </p>
        </div>
      )}
      
      <div 
        className="rounded-xl border overflow-hidden"
        style={{ 
          backgroundColor: 'var(--bg-color)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-color)'
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr 
                className="border-b"
                style={{ 
                  backgroundColor: 'var(--hover-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                {columns.map((column, index) => (
                  <th 
                    key={index} 
                    className="text-left py-3 sm:py-4 px-3 sm:px-6 font-semibold text-xs sm:text-sm tracking-wide"
                    style={{ color: 'var(--sub-text-color)' }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className="border-b transition-all duration-200 hover:scale-[1.01] group"
                  style={{ 
                    borderColor: 'var(--divider-color)',
                    ':hover': {
                      backgroundColor: 'var(--hover-color)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-color)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium transition-all duration-200"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {column.key === 'status' && statusConfig 
                        ? getStatusBadge(row[column.key], statusConfig)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Table