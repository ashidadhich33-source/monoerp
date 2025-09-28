import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import MobileNavigation from './MobileNavigation';

const Layout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Main content */}
      <div className="lg:pl-64">
        <div className="pb-20 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;