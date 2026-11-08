import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Clock, 
  Search, 
  Check, 
  Star, 
  Loader2, 
  X
} from 'lucide-react';
import { eventApi, type EventItem } from '../api/event.api';
import { toast } from '../../../stores/toastStore';

const CATEGORIES = ['All', 'Technology', 'Design', 'Business', 'General'];

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  // Create Event Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [location, setLocation] = useState('Convention Center & Online');
  const [eventType, setEventType] = useState<'in_person' | 'online' | 'hybrid'>('hybrid');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'my') {
        const myEvs = await eventApi.getMyEvents();
        setEvents(myEvs);
      } else {
        const res = await eventApi.getEvents({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          search: search.trim() || undefined,
        });
        setEvents(res.events);
      }
    } catch {
      toast.error('Could not load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeTab, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEvents();
  };

  const handleRsvp = async (event: EventItem, status: 'going' | 'interested' | 'not_going') => {
    setRsvpLoading((prev) => ({ ...prev, [event._id]: true }));
    try {
      const res = await eventApi.rsvpEvent(event._id, status);
      setEvents((prev) =>
        prev.map((e) => {
          if (e._id !== event._id) return e;
          return {
            ...e,
            myRsvp: res.myRsvp,
            attendeesCount: res.attendeesCount || e.attendeesCount,
          };
        })
      );
      toast.success(res.message || `RSVP updated to ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update RSVP');
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [event._id]: false }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsSubmitting(true);
    try {
      const created = await eventApi.createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        startDate: new Date(date).toISOString(),
        time,
        location,
        eventType,
      });
      toast.success('Event created successfully!', 'Created');
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDate('');
      if (created?._id) {
        navigate(`/events/${created._id}`);
      } else {
        loadEvents();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Community Events</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Discover workshops, webinars, tech summits, and local meetups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-60 transition-all focus:bg-white"
            />
          </form>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5 shrink-0 rounded-xl py-2 px-3 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Categories Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Explore Events
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'my'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My RSVPs
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Finding upcoming events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-semibold text-gray-900 text-base">No events found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {activeTab === 'my'
              ? 'You have not RSVP’d to any events yet. Check out upcoming events!'
              : 'Try selecting a different category or search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((item) => {
            const isActing = rsvpLoading[item._id];
            const isGoing = item.myRsvp === 'going';
            const isInterested = item.myRsvp === 'interested';
            const formattedDate = item.startDate
              ? new Date(item.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Upcoming';

            return (
              <Card
                key={item._id}
                className="border border-gray-100 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group"
              >
                <div>
                  <div 
                    onClick={() => navigate(`/events/${item._id}`)}
                    className="h-44 overflow-hidden relative bg-slate-900 cursor-pointer"
                  >
                    <img
                      src={item.cover?.secure_url || '/assets/images/events/01.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-blue-600 text-xs font-bold px-3 py-1 rounded-xl shadow-md">
                      {formattedDate}
                    </span>
                    <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                      {item.eventType}
                    </span>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <span className="text-[11px] font-bold text-blue-600 tracking-wide uppercase">
                      {item.category}
                    </span>
                    <h3 
                      onClick={() => navigate(`/events/${item._id}`)}
                      className="font-bold text-gray-900 text-base leading-snug hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description || 'Join fellow community members for this exciting event.'}
                    </p>

                    <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{item.time || '10:00 AM'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.location || 'Online'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {item.attendeesCount?.going || 1} Going • {item.attendeesCount?.interested || 0} Interested
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  {/* View Details Page */}
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${item._id}`)}
                    className="py-2 px-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Details
                  </button>
                  {/* Going button */}
                  <button
                    type="button"
                    onClick={() => handleRsvp(item, 'going')}
                    disabled={isActing}
                    className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isGoing
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isActing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isGoing ? 'Going' : 'Attend'}</span>
                  </button>

                  {/* Interested button */}
                  <button
                    type="button"
                    onClick={() => handleRsvp(item, 'interested')}
                    disabled={isActing}
                    className={`py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isInterested
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{isInterested ? 'Interested' : 'Star'}</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Create New Event</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Frontend Architecture Conference"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM - 2:00 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="in_person">In-Person</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Meeting Link</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco Convention Center or Zoom Link"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Event schedule, speakers, and details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!title.trim() || !date || isSubmitting}
                  className="rounded-xl gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Create Event</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
