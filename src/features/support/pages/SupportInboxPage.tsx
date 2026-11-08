import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { supportApi, type SupportTicket } from '../api/support.api';
import { toast } from '../../../stores/toastStore';
import {
  Inbox,
  Clock,
  CheckCircle2,
  Send,
  Plus,
  RefreshCw,
  Loader2,
  User,
  ShieldCheck,
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';

export const SupportInboxPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // New Ticket Modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newType, setNewType] = useState('content_report');
  const [newReason, setNewReason] = useState('Harassment & Bullying');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchTickets = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await supportApi.getMyTickets(1, 50, statusFilter || undefined);
        setTickets(res.data || []);
        if (res.data?.length > 0) {
          // Keep active selected ticket or select first
          setSelectedTicket((prev) => (prev ? res.data.find((t) => t._id === prev._id) || res.data[0] : res.data[0]));
        } else {
          setSelectedTicket(null);
        }
      } catch {
        toast.error('Could not load Support Inbox');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setReplyLoading(true);
    try {
      const res = await supportApi.replyTicket(selectedTicket._id, replyText.trim());
      setReplyText('');
      toast.success('Your message was sent to the moderation team.');
      setSelectedTicket(res.ticket);
      fetchTickets(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not send message');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.warning('Please enter a subject and detailed explanation.');
      return;
    }

    setCreateLoading(true);
    try {
      await supportApi.createTicket({
        type: newType,
        reason: newReason,
        subject: newSubject.trim(),
        description: newDescription.trim()
      });
      toast.success('Your report has been submitted to Support Inbox.');
      setNewModalOpen(false);
      setNewSubject('');
      setNewDescription('');
      fetchTickets(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit ticket');
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      case 'in_review':
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> In Review
          </span>
        );
      case 'dismissed':
        return (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md flex items-center gap-1">
            <X className="w-3 h-3 text-gray-500" /> Closed / Dismissed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Support Inbox</h1>
          </div>
          <p className="text-xs text-blue-100 max-w-xl">
            Track reports you've submitted, check enforcement decisions, and follow up directly with our moderation team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets(true)}
            disabled={isRefreshing}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-blue-900" />
            New Report / Ticket
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: '', label: 'All Cases' },
          { key: 'pending', label: 'Pending' },
          { key: 'in_review', label: 'Under Review' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'dismissed', label: 'Closed' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              statusFilter === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split Interface */}
      {isLoading ? (
        <Card className="p-12 border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading Support Inbox cases...</p>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs bg-white">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700">No cases found</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            When you report a post, appeal a restriction, or contact our support team, case updates will appear here.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="mt-4 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Submit First Request
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Cases List */}
          <div className="lg:col-span-5 space-y-2.5">
            {tickets.map((t) => {
              const isSelected = selectedTicket?._id === t._id;
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {t.ticketNumber}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>

                  <h3 className="text-xs font-bold text-gray-900 truncate">{t.subject}</h3>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{t.description}</p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-[10px] text-gray-400">
                    <span className="capitalize">{t.reason.replace(/_/g, ' ')}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Case Conversation & Resolution */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <Card className="border border-gray-100 bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col">
                {/* Case Header */}
                <div className="p-5 border-b border-gray-100 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {getStatusBadge(selectedTicket.status)}
                  </div>

                  <h2 className="text-base font-bold text-gray-900">{selectedTicket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                      Reason: <strong className="text-gray-800">{selectedTicket.reason}</strong>
                    </span>
                    {selectedTicket.targetType !== 'None' && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                        Target: <strong className="text-gray-800">{selectedTicket.targetType}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Resolution Action Card (Meta/Instagram Paradigm) */}
                {selectedTicket.resolutionAction && selectedTicket.resolutionAction !== 'none' && (
                  <div className="p-4 mx-5 my-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <h4 className="font-bold text-emerald-900">Enforcement & Moderation Finding</h4>
                      <p className="text-emerald-800 mt-0.5 leading-relaxed">
                        {selectedTicket.resolutionNote ||
                          'Our moderation team reviewed your report and took enforcement action in accordance with our Community Standards.'}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-200/60 text-emerald-900 font-bold text-[10px] rounded uppercase tracking-wider">
                        Action Taken: {selectedTicket.resolutionAction.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Messages Thread */}
                <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
                  {selectedTicket.messages?.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3 ${isAdmin ? 'bg-blue-50/60 border border-blue-100' : 'bg-gray-50 border border-gray-100'} p-3.5 rounded-2xl`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900">
                              {isAdmin ? 'Trust & Safety Team' : (msg.senderName || 'You')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-slate-50/50 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a message or response to moderation..."
                    disabled={replyLoading}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={replyLoading || !replyText.trim()}
                    className="gap-1.5 px-4"
                  >
                    {replyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Reply
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-12 text-center text-gray-400 border border-gray-100 shadow-xs">
                <p className="text-xs">Select a case from the list to view conversation history</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setNewModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Submit New Support Case</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="content_report">Report Inappropriate Content / User</option>
                    <option value="account_inquiry">Account Security & Privacy Inquiry</option>
                    <option value="bug_report">Technical Bug / Problem Report</option>
                    <option value="ban_appeal">Account Penalty Appeal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Violation Reason / Topic</label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  >
                    <option value="Harassment & Bullying">Harassment & Bullying</option>
                    <option value="Hate Speech">Hate Speech</option>
                    <option value="Spam or Scam">Spam or Scam</option>
                    <option value="Violence & Threat">Violence & Physical Threat</option>
                    <option value="Nudity & Sexual Content">Nudity or Inappropriate Media</option>
                    <option value="False Information">Misinformation</option>
                    <option value="Other">Other Community Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Case Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Brief summary of the issue..."
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Explanation</label>
                  <textarea
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide context, links, or describe what occurred..."
                    required
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewModalOpen(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={createLoading}>
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
