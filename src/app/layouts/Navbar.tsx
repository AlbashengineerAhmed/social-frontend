import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  Settings, 
  Bell, 
  Home, 
  Users, 
  Calendar,
  Image,
  Video,
  LogOut,
  User,
  HelpCircle,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useNotificationStore } from '../../stores/notificationStore';
import { getSocket } from '../../lib/socket';
import { ProfileSidebar } from '../../features/feed/components/ProfileSidebar';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount, fetchUnreadCount, incrementUnread } = useNotificationStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Listen to open-mobile-sidebar event from anywhere in the application
  useEffect(() => {
    const handleOpen = () => setIsMobileDrawerOpen(true);
    window.addEventListener('open-mobile-sidebar', handleOpen);
    return () => window.removeEventListener('open-mobile-sidebar', handleOpen);
  }, []);

  // Fetch initial unread count and listen for live notifications
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    const socket = getSocket(user.id);
    const handleLiveEvent = () => {
      incrementUnread();
    };

    socket.on('notification', handleLiveEvent);
    socket.on('message_notification', handleLiveEvent);

    return () => {
      socket.off('notification', handleLiveEvent);
      socket.off('message_notification', handleLiveEvent);
    };
  }, [user, fetchUnreadCount, incrementUnread]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 sm:gap-6">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
              title="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img src="/assets/images/logo.svg" alt="Social" className="h-9 w-auto" />
            </Link>

            <div className="hidden md:block relative w-64 lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Feed
            </Link>
            <Link
              to="/groups"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/groups') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Groups
            </Link>
            <Link
              to="/events"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/events') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>
            <Link
              to="/albums"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/albums') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Image className="w-4 h-4" />
              Albums
            </Link>
            <Link
              to="/videos"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive('/videos') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video className="w-4 h-4" />
              Videos
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/messaging"
              title="Messaging"
              className={`p-2.5 rounded-xl transition-colors relative ${
                isActive('/messaging') ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </Link>

            <Link
              to="/notifications"
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
              className={`p-2.5 rounded-xl transition-all relative flex items-center justify-center ${
                isActive('/notifications') ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'text-blue-600 animate-bell-ring' : ''}`} />
              
              {/* Only show animated red indicator & dot when unread notifications exist */}
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
                  </span>

                  {unreadCount > 1 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full ring-2 ring-white shadow-xs min-w-[16px] h-[16px] flex items-center justify-center pointer-events-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </Link>

            <Link
              to="/settings"
              title="Settings"
              className={`p-2.5 rounded-xl transition-colors ${
                isActive('/settings') ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Admin Badge/Link if user is Admin */}
            {user && (user.isAdmin || user.systemRole === 'admin' || user.systemRole === 'superAdmin') && (
              <Link
                to="/admin"
                title="Admin Dashboard"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Shield className="w-4 h-4 text-inherit" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="relative group p-0.5 rounded-full transition-transform active:scale-95 focus:outline-none"
                  aria-label="User menu"
                  aria-expanded={profileDropdownOpen}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-blue-500 transition-all duration-200 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* User Profile Header Card */}
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-500 transition-all"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-xs text-blue-600 font-medium truncate mt-0.5">
                          View profile
                        </p>
                      </div>
                    </Link>

                    <div className="h-px bg-gray-100 my-1.5" />

                    {/* Navigation Links */}
                    <div className="space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <User className="w-4 h-4" />
                        </div>
                        <span>Your Profile</span>
                      </Link>

                      {(user.isAdmin || user.systemRole === 'admin' || user.systemRole === 'superAdmin') && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                            <Shield className="w-4 h-4" />
                          </div>
                          <span>Admin Control Panel</span>
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span>Account Settings</span>
                      </Link>

                      <Link
                        to="/help"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span>Help & Support</span>
                      </Link>
                    </div>

                    <div className="h-px bg-gray-100 my-1.5" />

                    {/* Sign Out Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                        navigate('/sign-in');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Unified Mobile Off-Canvas Side Drawer (All navigation & profile/shortcuts in ONE side) */}
      {isMobileDrawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex lg:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Slide-in Drawer Container (From the Left Side) */}
            <div className="relative w-84 max-w-[85vw] h-full bg-[#f5f7f9] shadow-2xl z-10 flex flex-col p-4 overflow-y-auto animate-in slide-in-from-left duration-300 space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
                <Link to="/" onClick={() => setIsMobileDrawerOpen(false)} className="flex items-center gap-2">
                  <img src="/assets/images/logo.svg" alt="Social" className="h-8 w-auto" />
                  <span className="font-bold text-gray-900 text-sm">Navigation & Menu</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links Grid in Side Drawer */}
              <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Navigation</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to="/"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Home className="w-4 h-4 text-blue-500" />
                    <span>Feed</span>
                  </Link>
                  <Link
                    to="/groups"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/groups') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Groups</span>
                  </Link>
                  <Link
                    to="/events"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/events') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>Events</span>
                  </Link>
                  <Link
                    to="/albums"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/albums') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Image className="w-4 h-4 text-emerald-500" />
                    <span>Albums</span>
                  </Link>
                  <Link
                    to="/videos"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/videos') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>Videos</span>
                  </Link>
                  <Link
                    to="/messaging"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive('/messaging') ? 'text-blue-600 bg-blue-50 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    <span>Messages</span>
                  </Link>
                </div>
              </div>

              {/* Profile Sidebar & Shortcuts Section in Side Drawer */}
              {user && (
                <div className="space-y-3">
                  <ProfileSidebar user={user} />

                  {/* Admin Panel Link */}
                  {(user.isAdmin || user.systemRole === 'admin' || user.systemRole === 'superAdmin') && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-sm hover:opacity-95 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-white" />
                        <span>Admin Dashboard</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Admin</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
