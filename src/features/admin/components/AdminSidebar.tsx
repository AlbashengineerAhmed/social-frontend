import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Flag,
  FolderKanban,
  ArrowLeft,
  Shield,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Overview & Analytics',
      icon: LayoutDashboard,
      badge: 'Main',
      badgeColor: 'bg-blue-100 text-blue-700'
    },
    {
      to: '/admin/users',
      end: false,
      label: 'User Management',
      icon: Users,
    },
    {
      to: '/admin/posts',
      end: false,
      label: 'Content Moderation',
      icon: FileText,
    },
    {
      to: '/admin/reports',
      end: false,
      label: 'Reports & Flags',
      icon: Flag,
    },
    {
      to: '/admin/groups',
      end: false,
      label: 'Communities & Groups',
      icon: FolderKanban,
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shadow-xs">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-none">Admin Center</h2>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Secure System
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin User Profile Quick Info */}
      <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
        <img
          src={user?.avatar || '/assets/images/avatar/01.jpg'}
          alt={user?.name || 'Admin'}
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
            {user?.name || 'Admin'}
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
          </p>
          <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-md">
            {user?.systemRole === 'superAdmin' ? 'Super Admin' : 'Administrator'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Return Action */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
          <span>Back to Feed</span>
        </Link>
      </div>
    </aside>
  );
};

