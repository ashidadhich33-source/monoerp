import React from 'react';

const MobileLoading = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          {spinner}
          {text && (
            <p className="text-sm text-gray-600">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        {spinner}
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
};

export default MobileLoading;