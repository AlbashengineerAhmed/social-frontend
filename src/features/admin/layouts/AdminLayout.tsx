import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { Menu, Shield, Home } from 'lucide-react';
import { createPortal } from 'react-dom';

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col antialiased">
      {/* Top Mobile Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Open admin navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-gray-900">Admin Portal</span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-gray-500" />
          <span>Feed</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
          <AdminSidebar />
        </div>

        {/* Mobile Slide-over Drawer */}
        {mobileSidebarOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl z-10 flex flex-col">
                <AdminSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
              </div>
            </div>,
            document.body
          )}

        {/* Content Outlet Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

