import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/context/AuthContext';
import { getSocket } from '../../../lib/socket';
import { chatApi, type ConversationItem } from '../api/chat.api';
import { followApi, type UserSuggestion } from '../../feed/api/follow.api';
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  CheckCheck,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from '../../../stores/toastStore';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  conversationId?: string;
  unread?: number;
  online?: boolean;
}

export const MessagingPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<{ id: string | number; sender: 'me' | 'them'; text: string; time: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load real registered users and existing conversations
  useEffect(() => {
    let isMounted = true;

    const loadChatData = async () => {
      setIsLoadingContacts(true);
      try {
        const [conversations, suggestions] = await Promise.allSettled([
          chatApi.getConversations(),
          followApi.getSuggestions(),
        ]);

        const contactList: Contact[] = [];
        const seenUserIds = new Set<string>();

        // 1. Process active conversations
        if (conversations.status === 'fulfilled' && Array.isArray(conversations.value)) {
          conversations.value.forEach((conv: ConversationItem) => {
            const other = conv.participants?.find((p) => p._id !== user?.id);
            if (other) {
              seenUserIds.add(other._id);
              contactList.push({
                id: other._id,
                name: other.username || other.email?.split('@')[0] || 'Member',
                avatar:
                  other.image?.secure_url ||
                  other.profilePicture?.secure_url ||
                  '/assets/images/avatar/01.jpg',
                lastMessage: conv.lastMessage?.text || 'Started a conversation',
                time: conv.updatedAt
                  ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recent',
                conversationId: conv._id,
                online: true,
              });
            }
          });
        }

        // 2. Add other registered members so user can initiate chat with anyone
        if (suggestions.status === 'fulfilled' && Array.isArray(suggestions.value)) {
          suggestions.value.forEach((sug: UserSuggestion) => {
            const sId = sug._id || sug.id;
            if (sId && !seenUserIds.has(sId) && sId !== user?.id) {
              seenUserIds.add(sId);
              contactList.push({
                id: sId,
                name: sug.name || sug.username || sug.email?.split('@')[0] || 'Member',
                avatar: sug.avatar || '/assets/images/avatar/02.jpg',
                lastMessage: 'Click to start chatting',
                time: 'New',
                online: false,
              });
            }
          });
        }

        if (isMounted) {
          setContacts(contactList);
          if (contactList.length > 0 && !activeContact) {
            setActiveContact(contactList[0]);
          }
        }
      } catch {
        toast.error('Could not load chat contacts.');
      } finally {
        if (isMounted) setIsLoadingContacts(false);
      }
    };

    loadChatData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load real messages when active contact changes
  useEffect(() => {
    if (!activeContact) return;

    let isMounted = true;
    const loadConversationMessages = async () => {
      if (activeContact.conversationId) {
        setIsLoadingMessages(true);
        try {
          const rawMsgs = await chatApi.getMessages(activeContact.conversationId);
          if (isMounted) {
            const formatted = rawMsgs.map((m: any) => {
              const senderObjId = typeof m.senderId === 'object' ? m.senderId?._id : m.senderId;
              const isMe = senderObjId?.toString() === user?.id?.toString();
              return {
                id: m._id || Math.random(),
                sender: (isMe ? 'me' : 'them') as 'me' | 'them',
                text: m.text,
                time: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now',
              };
            });
            setMessages(formatted);
          }
        } catch {
          if (isMounted) setMessages([]);
        } finally {
          if (isMounted) setIsLoadingMessages(false);
        }
      } else {
        setMessages([]);
      }
    };

    loadConversationMessages();
    return () => {
      isMounted = false;
    };
  }, [activeContact, user]);

  // Real-time Socket.IO live messages listener
  useEffect(() => {
    if (!user || !activeContact) return;
    const socket = getSocket(user.id);

    const roomId = activeContact.conversationId || `conv_${activeContact.id}`;
    socket.emit('join_conversation', roomId);

    const handleNewMessage = (data: { senderId: string; text: string; time?: string; conversationId?: string }) => {
      const senderIdStr = typeof data.senderId === 'object' ? (data.senderId as any)._id : data.senderId;
      if (senderIdStr?.toString() !== user.id?.toString()) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'them',
            text: data.text,
            time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', roomId);
    };
  }, [user, activeContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeContact || isSending) return;

    const currentText = inputMessage.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Instant local UI display
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'me',
        text: currentText,
        time: currentTime,
      },
    ]);
    setInputMessage('');
    setIsSending(true);

    try {
      // 1. Emit live via Socket.IO
      const socket = getSocket(user?.id);
      const roomId = activeContact.conversationId || `conv_${activeContact.id}`;
      socket.emit('send_realtime_message', {
        conversationId: roomId,
        senderId: user?.id,
        recipientId: activeContact.id,
        text: currentText,
        time: currentTime,
      });

      // 2. Persist in MongoDB
      const res = (await chatApi.sendMessage(activeContact.id, currentText)) as any;
      const createdMsg = res?.data?.message || res?.message;
      if (createdMsg?.conversationId && !activeContact.conversationId) {
        setActiveContact((prev) => (prev ? { ...prev, conversationId: createdMsg.conversationId } : null));
      }
    } catch {
      toast.error('Failed to send message. Please check connection.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="border border-gray-100 h-[calc(100vh-140px)] flex flex-col md:flex-row overflow-hidden shadow-xs">
      {/* Contact List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Chats</h2>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Socket
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {isLoadingContacts ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs">Loading members...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-7 h-7 mx-auto mb-1.5 text-gray-300" />
              <p className="text-xs font-medium text-gray-500">No members found</p>
            </div>
          ) : (
            filteredContacts.map((c) => {
              const isSelected = activeContact?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveContact(c)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/70 border-r-2 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-full object-cover ring-1 ring-gray-100" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">{c.name}</h4>
                      <span className="text-[10px] text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {activeContact ? (
          <>
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{activeContact.name}</h3>
                  <p className="text-[11px] text-emerald-600 font-medium">Online • Socket Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <Video className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-1.5">
                  <Smile className="w-8 h-8 text-gray-300" />
                  <p className="text-xs font-medium text-gray-600">No messages yet with {activeContact.name}</p>
                  <p className="text-[11px] text-gray-400">Say hello and start the conversation!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender === 'me';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}
                      >
                        <p className="leading-relaxed">{m.text}</p>
                        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          <span>{m.time}</span>
                          {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                <Smile className="w-5 h-5" />
              </button>
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                placeholder={`Message ${activeContact.name}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <Button type="submit" size="sm" variant="primary" disabled={!inputMessage.trim() || isSending}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <Users className="w-10 h-10 text-gray-300 mb-2" />
            <h4 className="text-sm font-bold text-gray-700">Select a conversation</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              Choose a registered member from the list on the left to start a real-time chat.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
