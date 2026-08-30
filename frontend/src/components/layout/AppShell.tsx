import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../common/Toast';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col text-[#17191D] font-sans selection:bg-[#E8752F] selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-20 sm:pl-64 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
