import React from "react";
import { useTranslation } from "react-i18next";

const Card = ({
  header,
  title,
  subTitle,
  icon,
  bar,
  percentage,
  button,
  rightIcon,
  statusDot,
  footer,
  children,
  bottomContent,
  className,
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  return (
    <div
      className={`w-full h-full min-h-[140px] border border-[var(--border-color)] flex flex-col justify-between p-3 rounded-2xl transition-all duration-300 hover:shadow-lg ${isRtl ? 'text-right' : 'text-left'} ${className || ''}`}
      style={{
        backgroundColor: 'var(--bg-color)',
        boxShadow: 'var(--shadow-color)',
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"> {/* Increased gap from default to gap-3 (12px) */}
          <h3 className="text-[16px] font-semibold text-[#777D86]" style={{ color: 'var(--sub-text-color)' }}>
            {header}
          </h3>
          {statusDot}
        </div>
        {/* No background for top right icon */}
        {rightIcon && (
          <div className="w-8 h-8 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col py-0 justify-center">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
          {title}
        </h2>
        <p className="text-xs" style={{ color: 'var(--sub-text-color)' }}>
          {subTitle}
        </p>
        {children}
      </div>

      {/* Progress Bar */}
      {/* {typeof bar === "number" && bar > 0 && (
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--container-color)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
                width: `${bar}%`,
                transition: "width 0.5s ease-out",
              }}
            />
          </div>
          {/* Gradient bg for bottom icon */}
      {/* {footer && (
            <div
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
              style={{
                background: 'var(--hover-color)'
              }}
            >
              {footer}
            </div>
          )}
        </div>
      )} */}

      {/* Footer without progress bar */}
      {(!bar || bar === 0) && footer && (
        <div className="flex justify-end">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{
              background: 'var(--hover-color)',
            }}
          >
            {footer}
          </div>
        </div>
      )}

      {/* Button always at the end of the card */}
      {button && <div className="mt-3">{button}</div>}

      {/* Bottom Content */}
      {bottomContent && <div>{bottomContent}</div>}
    </div>
  );
};

export default Card;
