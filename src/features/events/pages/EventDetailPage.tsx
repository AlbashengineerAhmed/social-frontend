import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { eventApi, type EventItem } from '../api/event.api';
import { useAuth } from '../../auth/context/AuthContext';
import { toast } from '../../../stores/toastStore';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Check,
  X,
  Share2,
  ArrowLeft,
  Loader2,
  Video,
  ExternalLink,
  ShieldCheck,
  Trash2
} from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendees'>('details');

  // Delete Event State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Attendees List State
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [attendeeFilter, setAttendeeFilter] = useState<'going' | 'interested'>('going');

  // RSVP Action State
  const [actionLoading, setActionLoading] = useState(false);

  // Load Event Details
  const loadEventDetails = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await eventApi.getEventById(eventId);
      if (!data) {
        toast.error('Event not found');
        navigate('/events');
        return;
      }
      setEvent(data);
    } catch {
      toast.error('Could not load event details');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, navigate]);

  // Load Attendees
  const loadAttendees = useCallback(async () => {
    if (!eventId) return;
    setIsLoadingAttendees(true);
    try {
      const res = await eventApi.getEventAttendees(eventId, attendeeFilter);
      setAttendees(res.attendees || []);
    } catch {
      toast.error('Could not load attendee list');
    } finally {
      setIsLoadingAttendees(false);
    }
  }, [eventId, attendeeFilter]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  useEffect(() => {
    if (activeTab === 'attendees') {
      loadAttendees();
    }
  }, [activeTab, attendeeFilter, loadAttendees]);

  // Handle RSVP
  const handleRsvp = async (status: 'going' | 'interested' | 'not_going') => {
    if (!event) return;
    setActionLoading(true);
    try {
      await eventApi.rsvpEvent(event._id, status);
      const isSwitchingFromGoing = event.myRsvp === 'going';
      const isSwitchingFromInterested = event.myRsvp === 'interested';

      let newGoing = event.attendeesCount?.going || 0;
      let newInterested = event.attendeesCount?.interested || 0;

      if (isSwitchingFromGoing) newGoing = Math.max(0, newGoing - 1);
      if (isSwitchingFromInterested) newInterested = Math.max(0, newInterested - 1);

      if (status === 'going') newGoing += 1;
      if (status === 'interested') newInterested += 1;

      setEvent((prev) =>
        prev
          ? {
              ...prev,
              myRsvp: prev.myRsvp === status ? null : status,
              attendeesCount: {
                ...prev.attendeesCount,
                going: newGoing,
                interested: newInterested
              }
            }
          : prev
      );

      toast.success(
        status === 'going'
          ? "You're attending this event!"
          : status === 'interested'
          ? 'Event saved to your interested list.'
          : 'RSVP updated.'
      );

      if (activeTab === 'attendees') {
        loadAttendees();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update RSVP status');
    } finally {
      setActionLoading(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied to clipboard!');
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      await eventApi.deleteEvent(event._id);
      toast.success('Event deleted successfully');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not delete event');
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Loading event details...</span>
      </div>
    );
  }

  if (!event) return null;

  const isCreator =
    (typeof event.creator === 'object' && event.creator?._id === user?.id) ||
    event.creator === user?.id ||
    user?.role === 'admin';

  const dateObj = new Date(event.startDate || Date.now());
  const monthStr = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const dayStr = dateObj.toLocaleDateString(undefined, { day: 'numeric' });
  const fullDateStr = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const isGoing = event.myRsvp === 'going';
  const isInterested = event.myRsvp === 'interested';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={copyShareLink}
          className="gap-1.5 text-xs h-8 bg-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Hero Header Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-xs bg-white rounded-3xl">
        {/* Cover Banner */}
        <div className="h-48 sm:h-72 relative bg-slate-900 overflow-hidden">
          <img
            src={event.cover?.secure_url || '/assets/images/events/01.jpg'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Event Type & Privacy badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white capitalize font-medium border border-white/10">
              {event.eventType.replace('_', ' ')}
            </span>
            <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white capitalize font-medium border border-white/10">
              {event.privacy} Event
            </span>
          </div>
        </div>

        {/* Identity & RSVP Bar */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-gray-100 pb-6">
            <div className="flex items-start gap-4">
              {/* Calendar Square Badge */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 tracking-wider">
                  {monthStr}
                </span>
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                  {dayStr}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  {event.category}
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {event.title}
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-2 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{fullDateStr} • {event.time}</span>
                </p>
              </div>
            </div>

            {/* RSVP Interactive Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant={isGoing ? 'primary' : 'outline'}
                disabled={actionLoading}
                onClick={() => handleRsvp('going')}
                className={`rounded-xl px-4 text-xs gap-1.5 h-9 ${
                  isGoing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isGoing ? 'Attending' : 'Attend'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={actionLoading}
                onClick={() => handleRsvp('interested')}
                className={`rounded-xl px-3.5 text-xs gap-1.5 h-9 ${
                  isInterested
                    ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                    : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>{isInterested ? 'Interested' : 'Star'}</span>
              </Button>

              {event.myRsvp && (
                <button
                  type="button"
                  onClick={() => handleRsvp('not_going')}
                  disabled={actionLoading}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove RSVP (Can't Go)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isCreator && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="py-2 px-3 rounded-xl font-semibold text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                  title="Delete this event permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-4">
            {[
              { id: 'details', label: 'About & Schedule', icon: Calendar },
              {
                id: 'attendees',
                label: 'Attendees',
                icon: Users,
                count: (event.attendeesCount?.going || 0) + (event.attendeesCount?.interested || 0)
              }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Tab Contents */}
        <div className="lg:col-span-2 space-y-4">
          {/* TAB 1: ABOUT & SCHEDULE */}
          {activeTab === 'details' && (
            <Card className="p-6 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-5">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Event Description
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Join fellow community members for this exciting event.'}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Event Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-gray-900 block">Date & Time</span>
                      <span className="text-gray-600 text-[11px] mt-0.5 block">
                        {fullDateStr}
                      </span>
                      <span className="text-gray-400 text-[10px] block">{event.time}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                    {event.eventType === 'online' ? (
                      <Video className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-gray-900 block">
                        {event.eventType === 'online' ? 'Online Video Meeting' : 'Location'}
                      </span>
                      <span className="text-gray-600 text-[11px] mt-0.5 block truncate">
                        {event.location}
                      </span>
                      {event.address && (
                        <span className="text-gray-400 text-[10px] block truncate">
                          {event.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Meeting Direct Link Banner */}
              {event.eventType === 'online' && event.meetingUrl && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Video className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">Live Virtual Session</h4>
                      <p className="text-[11px] text-emerald-700">
                        The host provided a live video conferencing link for attendees.
                      </p>
                    </div>
                  </div>

                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-xs shrink-0"
                  >
                    <span>Join Meeting</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </Card>
          )}

          {/* TAB 2: ATTENDEES */}
          {activeTab === 'attendees' && (
            <Card className="border border-gray-100 shadow-xs bg-white rounded-2xl divide-y divide-gray-100 overflow-hidden">
              <div className="p-4 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendeeFilter('going')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      attendeeFilter === 'going'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Attending ({event.attendeesCount?.going || 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendeeFilter('interested')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      attendeeFilter === 'interested'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Interested ({event.attendeesCount?.interested || 0})
                  </button>
                </div>
              </div>

              {isLoadingAttendees ? (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs">Loading attendees...</p>
                </div>
              ) : attendees.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">No attendees in this category yet</p>
                </div>
              ) : (
                attendees.map((item) => {
                  const attendeeUser = item.userId;
                  const attendeeName =
                    attendeeUser?.username ||
                    `${attendeeUser?.firstName || ''} ${attendeeUser?.lastName || ''}`.trim() ||
                    'Community Member';
                  const attendeeAvatar =
                    attendeeUser?.image?.secure_url ||
                    attendeeUser?.avatar ||
                    '/assets/images/avatar/01.jpg';

                  return (
                    <div
                      key={item._id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link to={`/profile/${attendeeUser?._id}`}>
                          <img
                            src={attendeeAvatar}
                            alt={attendeeName}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100 hover:opacity-90"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${attendeeUser?._id}`}
                            className="text-xs font-bold text-gray-900 hover:text-blue-600 truncate block"
                          >
                            {attendeeName}
                          </Link>
                          <span className="text-[10px] text-gray-400 block mt-0.5 capitalize">
                            Status: {item.status}
                          </span>
                        </div>
                      </div>

                      <Link to={`/profile/${attendeeUser?._id}`}>
                        <Button variant="outline" size="sm" className="text-[11px] h-7 px-3">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Host & Overview Sidebar */}
        <div className="space-y-4">
          {/* Host Card */}
          {event.creator && (
            <Card className="p-5 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Event Organizer</span>
              </h4>

              <div className="flex items-center gap-3">
                <img
                  src={event.creator.image?.secure_url || '/assets/images/avatar/01.jpg'}
                  alt={event.creator.username}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100"
                />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-gray-900 truncate">
                    {event.creator.username}
                  </h5>
                  <p className="text-[10px] text-gray-400">Host & Coordinator</p>
                </div>
              </div>

              <Link to={`/profile/${event.creator._id}`} className="block w-full">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-1">
                  Contact Organizer
                </Button>
              </Link>
            </Card>
          )}

          {/* RSVP Status Snapshot */}
          <Card className="p-5 border border-gray-100 shadow-xs bg-white rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-gray-900">Attendance Summary</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Confirmed Going:
                </span>
                <span className="font-bold text-gray-900">
                  {event.attendeesCount?.going || 0}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" /> Interested:
                </span>
                <span className="font-bold text-gray-900">
                  {event.attendeesCount?.interested || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Event Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">Delete Event?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{event.title}"</span>? All attendee registrations and event updates will be cancelled.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="flex-1 rounded-xl text-xs h-9 bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-xs"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
