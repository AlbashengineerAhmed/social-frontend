import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { adminApi, type AdminReport } from '../api/admin.api';
import { supportApi, type SupportTicket, type TicketDecisionPayload } from '../../support/api/support.api';
import { toast } from '../../../stores/toastStore';
import {
  Flag,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  User,
  MessageCircle,
  X,
  ShieldCheck,
  Send,
  HelpCircle,
  Undo2,
  Ban
} from 'lucide-react';
import { createPortal } from 'react-dom';

const CANNED_REPLIES = [
  {
    label: 'Appeal Accepted — Unbanned',
    text: 'Upon further review by our Trust & Safety team, we determined that your account activity was flagged in error. Your account suspension has been lifted immediately. We apologize for the inconvenience.',
    action: 'user_unbanned' as const,
    status: 'resolved' as const
  },
  {
    label: 'Appeal Denied — Ban Upheld',
    text: 'After a comprehensive review of your account history and the reported incident, we confirmed repeated violations of our Community Guidelines. Your account suspension remains permanent.',
    action: 'none' as const,
    status: 'dismissed' as const
  },
  {
    label: 'Content Removed — Warning Issued',
    text: 'We have reviewed the reported content and found it violates our standards on safety and respect. The content has been taken down and an official warning recorded.',
    action: 'content_deleted' as const,
    status: 'resolved' as const
  },
  {
    label: 'No Violation Found',
    text: 'Thank you for your report. Our moderation team reviewed the target content and determined it does not violate our current Community Standards at this time.',
    action: 'none' as const,
    status: 'dismissed' as const
  }
];

export const AdminReportsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'reports' | 'appeals'>('reports');

  // --- Reports Section State ---
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reportPage, setReportPage] = useState(1);
  const [totalReportCount, setTotalReportCount] = useState(0);
  const pageSize = 10;

  // Review modal for Reports
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'resolved' | 'rejected'>('resolved');
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // --- Appeals & Tickets Section State ---
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('');
  const [ticketPage, setTicketPage] = useState(1);
  const [totalTicketCount, setTotalTicketCount] = useState(0);

  // Decision Console Modal for Tickets/Appeals
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<'resolved' | 'dismissed' | 'in_review'>('resolved');
  const [decisionAction, setDecisionAction] = useState<
    'none' | 'content_hidden' | 'content_deleted' | 'user_banned' | 'user_unbanned' | 'warning_issued'
  >('none');
  const [decisionReply, setDecisionReply] = useState('');
  const [decisionInternalNote, setDecisionInternalNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // 1. Fetch Reports
  const fetchReports = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoadingReports(true);

      try {
        const res = await adminApi.getReports({
          page: reportPage,
          size: pageSize,
          status: statusFilter || undefined
        });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setReports(list);
        setTotalReportCount(typeof res?.count === 'number' ? res.count : list.length);
      } catch {
        toast.error('Could not load reports list');
      } finally {
        setIsLoadingReports(false);
        setIsRefreshing(false);
      }
    },
    [reportPage, statusFilter]
  );

  // 2. Fetch Appeals & Tickets
  const fetchTickets = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoadingTickets(true);

      try {
        const res = await supportApi.adminListTickets({
          page: ticketPage,
          size: pageSize,
          status: ticketStatusFilter || undefined,
          type: ticketTypeFilter || undefined
        });
        setTickets(res.data || []);
        setTotalTicketCount(res.count || 0);
      } catch {
        toast.error('Could not load support cases & appeals');
      } finally {
        setIsLoadingTickets(false);
        setIsRefreshing(false);
      }
    },
    [ticketPage, ticketStatusFilter, ticketTypeFilter]
  );

  useEffect(() => {
    if (activeSection === 'reports') {
      fetchReports();
    } else {
      fetchTickets();
    }
  }, [activeSection, fetchReports, fetchTickets]);

  // Report Modal Handlers
  const openReviewModal = (report: AdminReport) => {
    setSelectedReport(report);
    setReviewStatus(report.status === 'pending' ? 'resolved' : (report.status as any));
    setReviewNote(report.reviewNote || '');
    setReviewModalOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await adminApi.reviewReport(selectedReport._id, {
        status: reviewStatus,
        reviewNote: reviewNote.trim() || undefined
      });
      toast.success(`Report marked as ${reviewStatus}.`);
      setReviewModalOpen(false);
      fetchReports(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update report');
    } finally {
      setActionLoading(false);
    }
  };

  // Ticket Decision Modal Handlers
  const openDecisionModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    const validStatus = (['resolved', 'dismissed', 'in_review'].includes(ticket.status)
      ? ticket.status
      : 'resolved') as 'resolved' | 'dismissed' | 'in_review';
    setDecisionStatus(validStatus);
    setDecisionAction((ticket.resolutionAction as any) || (ticket.type.includes('appeal') ? 'user_unbanned' : 'none'));
    setDecisionReply('');
    setDecisionInternalNote(ticket.resolutionNote || '');
    setDecisionModalOpen(true);
  };

  const handleApplyCanned = (canned: typeof CANNED_REPLIES[0]) => {
    setDecisionReply(canned.text);
    setDecisionAction(canned.action);
    setDecisionStatus(canned.status);
  };

  const handleSubmitDecision = async () => {
    if (!selectedTicket) return;
    setSubmittingDecision(true);
    try {
      const payload: TicketDecisionPayload = {
        status: decisionStatus,
        action: decisionAction,
        replyMessage: decisionReply.trim() || undefined,
        resolutionNote: decisionInternalNote.trim() || undefined
      };
      await supportApi.adminResolveTicket(selectedTicket._id, payload);
      toast.success(`Case ${selectedTicket.ticketNumber} updated successfully.`);
      setDecisionModalOpen(false);
      fetchTickets(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const totalReportPages = Math.ceil(totalReportCount / pageSize) || 1;
  const totalTicketPages = Math.ceil(totalTicketCount / pageSize) || 1;

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'User':
        return <User className="w-3.5 h-3.5 text-blue-500" />;
      case 'Post':
        return <FileText className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Comment':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-600" />
            Moderation & Case Resolution Console
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Meta & Instagram-style resolution center: review community flags, examine ban appeals, and execute compound administrative decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeSection === 'reports' ? fetchReports(true) : fetchTickets(true))}
            disabled={isRefreshing}
            className="gap-2 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Mode Switcher */}
      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveSection('reports')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeSection === 'reports'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <Flag className="w-3.5 h-3.5 text-red-600" />
          Content Flags & Reports ({totalReportCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('appeals')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeSection === 'appeals'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
            }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Support Cases & Ban Appeals ({totalTicketCount})
        </button>
      </div>

      {/* ================= SECTION 1: CONTENT REPORTS ================= */}
      {activeSection === 'reports' && (
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            {[
              { key: '', label: 'All Reports' },
              { key: 'pending', label: 'Pending' },
              { key: 'reviewed', label: 'Under Review' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'rejected', label: 'Rejected' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setReportPage(1);
                }}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${statusFilter === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {isLoadingReports ? (
            <Card className="p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Fetching filed reports...</p>
            </Card>
          ) : reports.length === 0 ? (
            <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Inbox Zero</p>
              <p className="text-xs text-gray-400 mt-1">No reports found matching the selected filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card
                  key={report._id}
                  className="p-4 border border-gray-100 shadow-xs bg-white hover:border-gray-200 transition-all rounded-2xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded-md uppercase tracking-wider">
                          {report.reason.replace('_', ' ')}
                        </span>

                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold text-[10px] rounded-md flex items-center gap-1">
                          {getTargetIcon(report.targetType)}
                          Target: {report.targetType}
                        </span>

                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          Target ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">{report.targetId}</code>
                        </span>

                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-xs text-gray-800 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 italic">
                          "{report.description}"
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span>
                          Reporter:{' '}
                          <span className="font-semibold text-gray-700">
                            {report.reporter?.username || report.reporter?.email || 'Anonymous Member'}
                          </span>
                        </span>

                        {report.reviewNote && (
                          <span className="text-blue-600 font-medium">
                            Admin Note: {report.reviewNote}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${report.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : report.status === 'rejected'
                              ? 'bg-gray-100 text-gray-600'
                              : report.status === 'reviewed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                      >
                        {report.status.toUpperCase()}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReviewModal(report)}
                        className="text-xs h-7 px-3 gap-1.5"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Reports Pagination */}
          {totalReportPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {reportPage} of {totalReportPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                  disabled={reportPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReportPage((p) => Math.min(totalReportPages, p + 1))}
                  disabled={reportPage >= totalReportPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 2: APPEALS & SUPPORT TICKETS ================= */}
      {activeSection === 'appeals' && (
        <div className="space-y-4">
          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              {[
                { key: '', label: 'All Cases' },
                { key: 'open', label: 'Open' },
                { key: 'in_review', label: 'In Review' },
                { key: 'resolved', label: 'Resolved' },
                { key: 'dismissed', label: 'Dismissed' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setTicketStatusFilter(tab.key);
                    setTicketPage(1);
                  }}
                  className={`pb-1 px-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${ticketStatusFilter === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTicketTypeFilter(ticketTypeFilter === 'appeal' ? '' : 'appeal')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${ticketTypeFilter === 'appeal'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                🔥 Ban Appeals Only
              </button>
            </div>
          </div>

          {/* Cases List */}
          {isLoadingTickets ? (
            <Card className="p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Fetching support cases & appeals...</p>
            </Card>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white">
              <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No Pending Cases</p>
              <p className="text-xs text-gray-400 mt-1">
                There are no dispute cases or ban appeals waiting for review.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card
                  key={t._id}
                  className={`p-4 border shadow-xs bg-white hover:border-gray-300 transition-all rounded-2xl ${t.type === 'appeal' ? 'border-amber-200 bg-amber-50/10' : 'border-gray-100'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {t.ticketNumber}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${t.type === 'appeal'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {t.type === 'appeal' ? '⚠️ Ban Appeal' : 'User Grievance'}
                        </span>

                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(t.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{t.subject}</h4>
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          "{t.description}"
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                        <span>
                          Account:{' '}
                          <span className="font-semibold text-gray-700">
                            {t.requester?.username || t.requesterEmail || 'Suspended Account'}
                          </span>
                        </span>

                        {t.resolutionAction && t.resolutionAction !== 'none' && (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Action Taken: {t.resolutionAction.replace('_', ' ')}
                          </span>
                        )}

                        <span className="text-gray-400">
                          Messages in thread: {t.messages?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'dismissed'
                              ? 'bg-gray-100 text-gray-600'
                              : t.status === 'in_review'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                      >
                        {t.status.toUpperCase()}
                      </span>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openDecisionModal(t)}
                        className="text-xs h-8 px-3 gap-1.5 bg-blue-600 hover:bg-blue-700"
                      >
                        Take Decision
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Ticket Pagination */}
          {totalTicketPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Page {ticketPage} of {totalTicketPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                  disabled={ticketPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTicketPage((p) => Math.min(totalTicketPages, p + 1))}
                  disabled={ticketPage >= totalTicketPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: REPORT REVIEW MODAL ================= */}
      {reviewModalOpen &&
        selectedReport &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-600" />
                  Review Content Report
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason:</span>
                    <span className="font-bold text-red-600">{selectedReport.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Type:</span>
                    <span className="font-semibold text-gray-800">{selectedReport.targetType}</span>
                  </div>
                  {selectedReport.description && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-500 block mb-1">Reporter Statement:</span>
                      <p className="text-gray-800 italic">"{selectedReport.description}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">Decision Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['resolved', 'reviewed', 'rejected'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReviewStatus(st)}
                        className={`py-2 text-xs font-bold rounded-lg border capitalize transition-all ${reviewStatus === st
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    Review Note / Action Taken
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Log explanation or enforcement taken (e.g. Content deleted, user warned)..."
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveReview}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Resolution
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= MODAL 2: TICKET / BAN APPEAL DECISION CONSOLE ================= */}
      {decisionModalOpen &&
        selectedTicket &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Administrative Decision Console — Case {selectedTicket.ticketNumber}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Apply compound resolution actions, send official canned replies, and notify user.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Case Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Subject: {selectedTicket.subject}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold uppercase text-[10px]">
                    {selectedTicket.type}
                  </span>
                </div>
                <p className="text-gray-700 italic bg-white p-2.5 rounded border border-gray-100">
                  "{selectedTicket.description}"
                </p>
                <div className="flex items-center gap-3 text-gray-500 pt-1">
                  <span>User: {selectedTicket.requester?.email || selectedTicket.requesterEmail || 'N/A'}</span>
                  <span>•</span>
                  <span>Priority: {selectedTicket.priority}</span>
                </div>
              </div>

              {/* Canned Policy Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span>Policy Canned Presets</span>
                  <span className="text-[10px] text-gray-400 font-normal">(Click to auto-populate)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CANNED_REPLIES.map((canned, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyCanned(canned)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-gray-200 rounded-lg text-[11px] font-medium transition-all"
                    >
                      {canned.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compound Moderation Action Radios */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Compound Enforcement Action (Executed Immediately)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'none', label: 'No Action (Reply Only)', icon: HelpCircle, color: 'text-gray-500' },
                    { key: 'user_unbanned', label: 'Unban User Account', icon: Undo2, color: 'text-emerald-600' },
                    { key: 'user_banned', label: 'Ban / Suspend User', icon: Ban, color: 'text-red-600' },
                    { key: 'content_deleted', label: 'Delete Target Content', icon: XCircle, color: 'text-red-600' },
                    { key: 'content_hidden', label: 'Hide Target Content', icon: AlertTriangle, color: 'text-amber-600' },
                    { key: 'warning_issued', label: 'Issue Official Warning', icon: ShieldCheck, color: 'text-blue-600' }
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => setDecisionAction(act.key as any)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${decisionAction === act.key
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600 font-bold'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium'
                          }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${act.color}`} />
                        <span className="truncate">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Decision Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Case Final Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'resolved', label: 'Resolved (Approved)' },
                    { key: 'dismissed', label: 'Dismissed (Rejected)' },
                    { key: 'in_review', label: 'Keep In Review' }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setDecisionStatus(st.key as any)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${decisionStatus === st.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Reply Message */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Official Response to User (Sent to User's Support Inbox & Notifications)
                </label>
                <textarea
                  rows={3}
                  value={decisionReply}
                  onChange={(e) => setDecisionReply(e.target.value)}
                  placeholder="Type official notification message explaining findings..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Internal Moderator Log */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Internal Moderator Notes (Visible only to administrators)
                </label>
                <input
                  type="text"
                  value={decisionInternalNote}
                  onChange={(e) => setDecisionInternalNote(e.target.value)}
                  placeholder="E.g. Reviewed user audit trail, identity verified..."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                  disabled={submittingDecision}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitDecision}
                  disabled={submittingDecision}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-4"
                >
                  {submittingDecision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Execute Decision & Notify User
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
