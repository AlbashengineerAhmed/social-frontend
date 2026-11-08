import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { AdminStatsCards } from '../components/AdminStatsCards';
import { adminApi, type AdminStats } from '../api/admin.api';
import {
  Users,
  FileText,
  Flag,
  FolderKanban,
  RefreshCw,
  ShieldAlert,
  Server,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '../../../stores/toastStore';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await adminApi.getDashboard();
      setStats(res.stats);
    } catch {
      toast.error('Could not load admin metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            System Overview & Metrics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time management dashboard, moderation stats, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="gap-2 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <AdminStatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/users"
          className="group block p-4 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-4">Manage Users</h3>
          <p className="text-xs text-gray-500 mt-1">
            Browse members, change authorization roles, and ban or reinstate accounts.
          </p>
        </Link>

        <Link
          to="/admin/posts"
          className="group block p-4 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-4">Moderate Content</h3>
          <p className="text-xs text-gray-500 mt-1">
            Review community feeds, hide flagged content, or purge policy violations.
          </p>
        </Link>

        <Link
          to="/admin/reports"
          className="group block p-4 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md hover:border-amber-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flag className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-4">Review Reports</h3>
          <p className="text-xs text-gray-500 mt-1">
            Inspect reported items, evaluate violations, and take resolution actions.
          </p>
        </Link>

        <Link
          to="/admin/groups"
          className="group block p-4 bg-white border border-gray-100 rounded-2xl shadow-xs hover:shadow-md hover:border-purple-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mt-4">Communities & Groups</h3>
          <p className="text-xs text-gray-500 mt-1">
            Audit public and private groups, manage member capacity, and delete spam groups.
          </p>
        </Link>
      </div>

      {/* System Status & Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Platform Status */}
        <Card className="p-5 border border-gray-100 shadow-xs bg-white lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Platform Health & Infrastructure</h3>
                <p className="text-[11px] text-gray-400">Core services and database connection</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Zap className="w-4 h-4 text-amber-500" />
                Socket Real-time
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Connected & Listening</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Live events & push alerts</p>
            </div>

            <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Server className="w-4 h-4 text-blue-500" />
                MongoDB Atlas
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Healthy Connection</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Mongoose indexed models</p>
            </div>

            <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <ShieldAlert className="w-4 h-4 text-purple-500" />
                Access Control
              </div>
              <p className="text-xs text-purple-700 font-medium mt-1">RBAC Active</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Role authentication matrix</p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/50 border border-blue-100/70 rounded-xl flex items-start gap-3">
            <div className="p-1 rounded bg-blue-600 text-white shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-blue-900">Administrator Privileges Active</p>
              <p className="text-blue-700/80 mt-0.5">
                Changes made in this console take effect immediately across all connected users and live web clients.
              </p>
            </div>
          </div>
        </Card>

        {/* Security & Moderation Summary */}
        <Card className="p-5 border border-gray-100 shadow-xs bg-white space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Security & Enforcement</h3>
            <p className="text-[11px] text-gray-400">Account status overview</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-gray-800">Confirmed Email Accounts</p>
                <p className="text-[10px] text-gray-400">Fully verified users</p>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {stats?.activeUsers ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
              <div>
                <p className="text-xs font-semibold text-red-900">Banned Accounts</p>
                <p className="text-[10px] text-red-600/70">Suspended from logging in</p>
              </div>
              <span className="text-sm font-bold text-red-600">
                {stats?.deletedUsers ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
              <div>
                <p className="text-xs font-semibold text-amber-900">Reports Pending</p>
                <p className="text-[10px] text-amber-700/70">Requires evaluation</p>
              </div>
              <span className="text-sm font-bold text-amber-600">
                {stats?.totalReports ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

