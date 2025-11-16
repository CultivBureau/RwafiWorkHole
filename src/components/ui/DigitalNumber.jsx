import React from 'react';

const DigitalNumber = ({ value, className = "", size = "base" }) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm", 
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  };

  return (
    <div 
      className={`digital-numbers font-bold tracking-wider transition-all duration-200 ${sizeClasses[size]} ${className}`}
    >
      {value}
    </div>
  );
};

export default DigitalNumber;
