import React from 'react'
import { Eye, Download, FileText } from 'lucide-react'
import { useTranslation } from "react-i18next"

const DocumentsSection = ({ documents }) => {
  const { t } = useTranslation()
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="group p-4 sm:p-6 border rounded-xl flex items-center justify-between transition-all duration-300 hover:shadow-md cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--hover-color)' }}
            >
              <FileText 
                className="w-4 h-4 sm:w-5 sm:h-5" 
                style={{ color: 'var(--accent-color)' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-medium text-sm sm:text-base truncate"
                style={{ color: 'var(--text-color)' }}
              >
                {doc.name}
              </h3>
              <p 
                className="text-xs sm:text-sm mt-1"
                style={{ color: 'var(--sub-text-color)' }}
              >
                {doc.uploadDate}
              </p>
            </div>
          </div>
          
          <div className="flex gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
            <button 
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
              style={{ 
                backgroundColor: 'transparent',
                ':hover': { backgroundColor: 'var(--hover-color)' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title={t("roles.table.actions.view")}
            >
              <Eye 
                className="w-4 h-4 sm:w-5 sm:h-5" 
                style={{ color: 'var(--sub-text-color)' }}
              />
            </button>
            <button 
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
              style={{ 
                backgroundColor: 'transparent',
                ':hover': { backgroundColor: 'var(--hover-color)' }
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--hover-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              title={t("employees.newEmployeeForm.documents.uploadFile")}
            >
              <Download 
                className="w-4 h-4 sm:w-5 sm:h-5" 
                style={{ color: 'var(--sub-text-color)' }}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default DocumentsSection
