import React from 'react';

const MobileCard = ({ 
  children, 
  className = '', 
  onClick, 
  touchable = false,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const touchClasses = touchable ? 'active:scale-95 transition-transform duration-150 cursor-pointer' : '';
  const combinedClasses = `${baseClasses} ${touchClasses} ${className}`;

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default MobileCard;