import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { adminApi, type AdminUser } from '../api/admin.api';
import { toast } from '../../../stores/toastStore';
import {
  Search,
  RefreshCw,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
  UserX,
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin' | 'superAdmin'>('user');

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await adminApi.getUsers({
          page,
          size: pageSize,
          search: search.trim() || undefined
        });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setUsers(list);
        setTotalCount(typeof res?.count === 'number' ? res.count : list.length);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleBan = async (user: AdminUser) => {
    try {
      if (user.isDeleted) {
        await adminApi.unbanUser(user._id);
        toast.success(`User ${user.username} has been unbanned.`);
      } else {
        await adminApi.banUser(user._id);
        toast.warning(`User ${user.username} has been banned.`);
      }
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update ban status');
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedRole((user.role as any) || 'user');
    setRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.changeUserRole(selectedUser._id, selectedRole);
      toast.success(`Role for ${selectedUser.username} updated to ${selectedRole}.`);
      setRoleModalOpen(false);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update role');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(selectedUser._id);
      toast.delete('User permanently removed.');
      setDeleteModalOpen(false);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage members, adjust authorization roles, or restrict accounts. ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            disabled={isRefreshing}
            className="gap-2 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border border-gray-100 shadow-xs bg-white">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="px-4">
            Search
          </Button>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </Card>

      {/* Users Table */}
      <Card className="border border-gray-100 shadow-xs bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-medium">Loading user database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No users found</p>
            <p className="text-xs text-gray-400 mt-1">Try modifying your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Email Confirmed</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {users.map((u) => {
                  const avatarUrl =
                    u.image?.secure_url || '/assets/images/avatar/01.jpg';
                  const displayName =
                    u.username || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{displayName}</p>
                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openRoleModal(u)}
                          className="cursor-pointer"
                          title="Click to edit role"
                        >
                          {u.role === 'superAdmin' ? (
                            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-semibold rounded-lg text-[10px] inline-flex items-center gap-1 hover:bg-purple-200 transition-colors">
                              <ShieldAlert className="w-3 h-3 text-purple-600" />
                              Super Admin
                            </span>
                          ) : u.role === 'admin' ? (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 font-semibold rounded-lg text-[10px] inline-flex items-center gap-1 hover:bg-blue-200 transition-colors">
                              <Shield className="w-3 h-3 text-blue-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold rounded-lg text-[10px] hover:bg-gray-200 transition-colors">
                              User
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.isDeleted ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-semibold inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Confirmed Email */}
                      <td className="py-3 px-4">
                        {u.confirmEmail ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1 text-[11px]">
                            <UserCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium text-[11px]">Pending</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRoleModal(u)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Change Role"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBan(u)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${u.isDeleted
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                              }`}
                            title={u.isDeleted ? 'Unban Account' : 'Ban Account'}
                          >
                            {u.isDeleted ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(u)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 h-auto"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 h-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Role Change Modal */}
      {roleModalOpen &&
        selectedUser &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setRoleModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Change User Authorization</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-600">
                  Select new authorization role for{' '}
                  <span className="font-bold text-gray-900">{selectedUser.username}</span>:
                </p>

                <div className="mt-3 space-y-2">
                  {[
                    { key: 'user', title: 'Regular User', desc: 'Standard social interaction access' },
                    { key: 'admin', title: 'Administrator', desc: 'Access to moderation, reports, and admin console' },
                    { key: 'superAdmin', title: 'Super Admin', desc: 'Full root privileges across the application' }
                  ].map((r) => (
                    <label
                      key={r.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRole === r.key
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.key}
                        checked={selectedRole === r.key}
                        onChange={() => setSelectedRole(r.key as any)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{r.title}</p>
                        <p className="text-[11px] text-gray-500">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveRole}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Update Role
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete User Modal */}
      {deleteModalOpen &&
        selectedUser &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeleteModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900">Delete User Account?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-gray-800">{selectedUser.username}</span>? This action cannot
                  be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

