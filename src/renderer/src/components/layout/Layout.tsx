import React from 'react';
import { Outlet } from '@tanstack/react-router';
import Header from './Header';
import EnvironmentIndicator from '../ui/EnvironmentIndicator';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <EnvironmentIndicator />
    </div>
  );
};

export default Layout;
