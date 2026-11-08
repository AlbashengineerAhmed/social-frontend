import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { adminApi, type AdminGroup } from '../api/admin.api';
import { toast } from '../../../stores/toastStore';
import {
  FolderKanban,
  RefreshCw,
  Search,
  Globe,
  Lock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';

export const AdminGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Delete modal state
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGroups = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await adminApi.getGroups({
          page,
          size: pageSize,
          search: search.trim() || undefined
        });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setGroups(list);
        setTotalCount(typeof res?.count === 'number' ? res.count : list.length);
      } catch {
        toast.error('Could not load community groups');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGroups();
  };

  const openDeleteModal = (group: AdminGroup) => {
    setSelectedGroup(group);
    setDeleteModalOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    setActionLoading(true);
    try {
      await adminApi.deleteGroup(selectedGroup._id);
      toast.delete(`Group "${selectedGroup.name}" deleted.`);
      setDeleteModalOpen(false);
      fetchGroups(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete group');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Communities & Groups Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage user communities, oversee membership counts, and disband abusive groups. ({totalCount} total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchGroups(true)}
            disabled={isRefreshing}
            className="gap-2 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-gray-100 shadow-xs bg-white">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search group name..."
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

      {/* Grid of Groups */}
      {isLoading ? (
        <Card className="p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading groups directory...</p>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white">
          <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No groups found</p>
          <p className="text-xs text-gray-400 mt-1">There are no communities matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const creator = group.createdBy;
            const creatorName =
              creator?.username ||
              `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() ||
              'Admin';
            const creatorAvatar =
              creator?.image?.secure_url || '/assets/images/avatar/01.jpg';

            return (
              <Card
                key={group._id}
                className="p-5 border border-gray-100 bg-white hover:border-gray-200 shadow-xs hover:shadow-md transition-all rounded-2xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {group.privacy === 'private' ? (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-md flex items-center gap-1">
                          <Lock className="w-3 h-3 text-gray-500" /> Private
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-md flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-600" /> Public
                        </span>
                      )}

                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-md">
                        {group.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-tight">{group.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {group.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={creatorAvatar}
                      alt={creatorName}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-100"
                    />
                    <div className="text-[11px] text-gray-500 truncate max-w-[120px]">
                      Created by <span className="font-semibold text-gray-800">{creatorName}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDeleteModal(group)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Disband / Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-3 border border-gray-100 shadow-xs bg-white flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {page} of {totalPages}
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
        </Card>
      )}

      {/* Delete Group Modal */}
      {deleteModalOpen &&
        selectedGroup &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDeleteModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900">Delete Community Group?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-800">"{selectedGroup.name}"</span>?
                  This will archive the group and remove it from public discovery.
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
                  onClick={handleDeleteGroup}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Delete Group
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
