import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors overflow-hidden">
      <Header />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
