/**
 * AdminMessages.tsx — Real-Time Admin Support Panel
 *
 * REQUIREMENTS IMPLEMENTATION:
 *  1. Connected to `chatSyncService.ts` for instant (<100ms) cross-tab & cross-window sync.
 *  2. Real-time thread list listening to active threads.
 *  3. Admin reply box:
 *     - Reads current input text.
 *     - Appends message as `senderRole: 'ADMIN'`, `senderName: 'Kisan Dost Support Officer'`.
 *     - Dispatches event via `sendChatMessage(...)`.
 *     - Clears input field immediately.
 */
import React, { useState, useRef, useEffect } from 'react';
import { SupportMessageThread, Language } from '../types';
import {
  MessageSquare,
  Send,
  Search,
  CheckCircle2,
  User as UserIcon,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCheck,
  Check,
  Headphones,
  Tractor
} from 'lucide-react';
import { logAdminAction } from '../lib/storage';
import { subscribeToAllSupportThreads } from '../lib/firebase';
import {
  sendChatMessage,
  subscribeToThread,
  ChatMessage,
  SupportThread,
  getStoredChatMessages
} from '../services/chatSyncService';

interface AdminMessagesProps {
  threads: SupportMessageThread[];
  language: Language;
  onRefreshThreads: () => void;
}

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const diff = today.getDate() - d.getDate();
    if (diff === 0) return fmtTime(iso);
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({
  threads,
  language,
  onRefreshThreads
}) => {
  const isEn = language === 'en';

  // ── Firestore real-time thread list ──────────────────────────────────────
  const [liveThreads, setLiveThreads] = useState<SupportThread[]>([]);
  const [isFirestoreOnline, setIsFirestoreOnline] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = subscribeToAllSupportThreads((threads) => {
      if (threads) {
        setLiveThreads(threads);
        setIsFirestoreOnline(true);
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  // ── Selected Thread State ─────────────────────────────────────────────────
  const [activeThreadId, setActiveThreadId] = useState<string>('thread_usr_001');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Auto-subscribe to the active thread via chatSyncService
  useEffect(() => {
    if (!activeThreadId) return;

    const unsubscribe = subscribeToThread(activeThreadId, (msgs: ChatMessage[]) => {
      setChatMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeThreadId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Build merged thread list: Firestore live threads + legacy localStorage threads
  const mergedThreadList: Array<{
    id: string;
    farmerId: string;
    name: string;
    farmName?: string;
    lastMsg: string;
    status: string;
    lastUpdated: string;
  }> = [];

  // Add Firestore live threads
  liveThreads.forEach(t => {
    mergedThreadList.push({
      id: t.threadId,
      farmerId: t.farmerId || t.threadId.replace('thread_', ''),
      name: t.farmerName || 'Farmer',
      farmName: t.farmName,
      lastMsg: t.lastMessage || '',
      status: t.status || 'OPEN',
      lastUpdated: t.lastUpdated || new Date().toISOString()
    });
  });

  // Add fallback threads (including default Chaudhry Ahmed Ali)
  const defaultThreads = [
    {
      id: 'thread_usr_001',
      farmerId: 'usr_001',
      name: 'Chaudhry Ahmed Ali',
      farmName: 'المدینہ ڈیری فارم (Al-Madina Dairy Farm)',
      lastMsg: 'Assalam o Alaikum, need advice for cow milk yield',
      status: 'OPEN',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'thread_ali_khan',
      farmerId: 'ali_khan',
      name: 'Ali Khan',
      farmName: 'Bismillah Cattle Farm',
      lastMsg: 'Vaccination inquiry for calf',
      status: 'OPEN',
      lastUpdated: new Date().toISOString()
    }
  ];

  defaultThreads.forEach(dt => {
    if (!mergedThreadList.some(m => m.id === dt.id)) {
      mergedThreadList.push(dt);
    }
  });

  // Also include any prop threads
  threads.forEach(t => {
    const tid = `thread_${t.userId}`;
    if (!mergedThreadList.some(m => m.id === tid || m.id === t.id)) {
      const lastMsg = t.messages[t.messages.length - 1];
      mergedThreadList.push({
        id: tid,
        farmerId: t.userId,
        name: t.userName,
        farmName: undefined,
        lastMsg: lastMsg?.message || t.subject || '',
        status: t.status === 'open' ? 'OPEN' : t.status === 'in_progress' ? 'IN_PROGRESS' : 'RESOLVED',
        lastUpdated: t.lastMessageDate || new Date().toISOString()
      });
    }
  });

  // Filter threads by search query
  const filteredThreads = mergedThreadList.filter(t =>
    !searchTerm ||
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.farmName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.lastMsg.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeThreadMeta = mergedThreadList.find(t => t.id === activeThreadId) || mergedThreadList[0];

  // If activeThreadId is not set, set it to the first thread
  useEffect(() => {
    if (!activeThreadId && mergedThreadList.length > 0) {
      setActiveThreadId(mergedThreadList[0].id);
    }
  }, [mergedThreadList, activeThreadId]);

  // ── Admin Reply Handler ─────────────────────────────────────────────────────
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThreadId || isSending) return;

    const text = replyText.trim();
    setReplyText(''); // Clear input immediately
    setIsSending(true);

    try {
      await sendChatMessage({
        threadId: activeThreadId,
        farmerId: activeThreadMeta?.farmerId || activeThreadId.replace('thread_', ''),
        farmerName: activeThreadMeta?.name || 'Farmer',
        farmName: activeThreadMeta?.farmName || '',
        senderRole: 'ADMIN',
        senderName: isEn ? 'Kisan Dost Support Officer' : 'کسان دوست سپورٹ آفیسر',
        text
      });

      logAdminAction({
        adminId: 'admin_sys',
        adminName: 'Kisan Dost Support Officer',
        action: `Sent reply to Farmer: ${activeThreadMeta?.name || activeThreadId} — "${text.substring(0, 40)}..."`,
        targetEntity: 'SupportThread',
        targetId: activeThreadId
      });

      onRefreshThreads();
    } catch (err) {
      console.error('Error sending admin reply:', err);
    } finally {
      setIsSending(false);
      replyInputRef.current?.focus();
    }
  };

  const statusBadge = (status: string, compact = false) => {
    const s = status?.toUpperCase() || 'OPEN';
    const base = compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]';
    if (s === 'OPEN') return <span className={`${base} rounded-full font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`}>🟡 {isEn ? 'Open' : 'کھلا'}</span>;
    if (s === 'IN_PROGRESS' || s === 'in_progress') return <span className={`${base} rounded-full font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`}>🔵 {isEn ? 'Active' : 'فعال'}</span>;
    return <span className={`${base} rounded-full font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`}>✅ {isEn ? 'Resolved' : 'حل شدہ'}</span>;
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black mb-2">
            <Headphones className="w-3.5 h-3.5" />
            <span>{isEn ? 'Real-Time Farmer Helpdesk Chat' : 'ریئل ٹائم کسان ہیلپ ڈیسک چیٹ'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'Support Conversations & Live Admin Reply' : 'کسان سپورٹ چیٹ — لائیو ایڈمن جواب'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? 'Multi-channel real-time chat with instant (<100ms) cross-tab & cross-window synchronization.'
              : 'ملٹی چینل ریئل ٹائم چیٹ — فوری دو طرفہ رابطہ۔'}
          </p>
        </div>

        <div className="flex items-center space-x-2 rtl:space-x-reverse shrink-0">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isFirestoreOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
              : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50'
          }`}>
            {isFirestoreOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <Wifi className="w-3.5 h-3.5 text-teal-500" />}
            <span>{isFirestoreOnline ? (isEn ? 'Firestore + Broadcast Live' : 'فائر اسٹور + براڈکاسٹ لائیو') : (isEn ? 'Sync Channel Active' : 'سنک چینل فعال')}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
            {filteredThreads.length} {isEn ? 'Threads' : 'تھریڈز'}
          </span>
        </div>
      </div>

      {/* ── Two-Panel Chat Layout ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px]">

        {/* Left Panel: Thread List */}
        <div className="w-full lg:w-80 lg:min-w-[280px] border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 flex flex-col">

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 start-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isEn ? 'Search farmers...' : 'کسان تلاش کریں...'}
                className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {isEn ? 'No support threads found.' : 'کوئی تھریڈ نہیں ملا۔'}
              </div>
            ) : filteredThreads.map(th => {
              const isSelected = th.id === activeThreadId;

              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setActiveThreadId(th.id)}
                  className={`w-full text-start p-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 rtl:space-x-reverse">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                    }`}>
                      {(th.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate max-w-[110px]">{th.name}</span>
                        <span className={`text-[9px] font-mono ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                          {fmtDate(th.lastUpdated)}
                        </span>
                      </div>

                      {th.farmName && (
                        <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-teal-600 dark:text-teal-400'}`}>
                          🌾 {th.farmName}
                        </p>
                      )}

                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {th.lastMsg || (isEn ? 'No messages yet' : 'ابھی کوئی پیغام نہیں')}
                      </p>

                      <div className="mt-1">
                        {isSelected
                          ? <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white uppercase">{th.status.replace('_', ' ')}</span>
                          : statusBadge(th.status, true)
                        }
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Active Chat Conversation */}
        <div className="flex-1 flex flex-col">
          {activeThreadMeta ? (
            <>
              {/* Thread Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    {(activeThreadMeta.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">{activeThreadMeta.name}</h3>
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Online" />
                    </div>
                    {activeThreadMeta.farmName && (
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">🌾 {activeThreadMeta.farmName}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-mono">{activeThreadMeta.id}</p>
                  </div>
                </div>
                <div>
                  {statusBadge(activeThreadMeta.status)}
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto min-h-0" style={{ maxHeight: '420px' }}>
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {isEn ? 'No messages in this thread yet. Type a reply below.' : 'اس تھریڈ میں ابھی کوئی پیغام نہیں ہے۔'}
                  </div>
                ) : chatMessages.map((msg, idx) => {
                  const isAdmin = msg.senderType === 'ADMIN';
                  const showTime = idx === 0 || Math.abs(
                    new Date(msg.timestamp).getTime() - new Date(chatMessages[idx - 1]?.timestamp || 0).getTime()
                  ) > 5 * 60 * 1000;

                  return (
                    <React.Fragment key={msg.id || idx}>
                      {showTime && (
                        <div className="text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800">
                            {fmtTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%]">
                          {!isAdmin && (
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block px-1">
                              🌾 {msg.senderName}
                            </span>
                          )}
                          <div className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-br-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                          }`}>
                            {isAdmin && (
                              <div className="text-[10px] opacity-80 mb-1 font-bold flex items-center space-x-1 rtl:space-x-reverse">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>{msg.senderName}</span>
                              </div>
                            )}
                            <p>{msg.text}</p>
                          </div>

                          <div className={`flex items-center mt-1 space-x-1 rtl:space-x-reverse text-[10px] text-slate-400 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span className="px-1">{fmtTime(msg.timestamp)}</span>
                            {isAdmin && msg.status === 'sent' && <Check className="w-2.5 h-2.5" />}
                            {isAdmin && (msg.status === 'delivered' || msg.status === 'read') && <CheckCheck className="w-2.5 h-2.5 text-teal-500" />}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Admin Reply Input Form */}
              <form
                onSubmit={handleSendAdminReply}
                className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-slate-800/60"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-black">
                  A
                </div>
                <input
                  ref={replyInputRef}
                  id="admin-reply-input"
                  type="text"
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={isEn
                    ? 'Type official admin reply (sends instantly to farmer)...'
                    : 'کسان کو آفیشل جواب لکھیں (فوری ارسال ہوگا)...'}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center space-x-1.5 rtl:space-x-reverse shrink-0"
                >
                  {isSending
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4 rtl:rotate-180" />
                  }
                  <span className="hidden sm:inline">{isEn ? 'Reply' : 'جواب'}</span>
                </button>
              </form>

              {/* Footer info strip */}
              <div className="px-4 py-2 bg-teal-50 dark:bg-teal-950/30 border-t border-teal-100 dark:border-teal-900/60 flex items-center space-x-2 rtl:space-x-reverse text-[10px] text-teal-700 dark:text-teal-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {isEn
                    ? 'Replies dispatch instantly (<100ms) to the active farmer thread across tabs and windows'
                    : 'ایڈمن جواب فوری طور پر کسان اسکرین پر پہنچتا ہے'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-teal-400" />
              </div>
              <h3 className="text-base font-black text-slate-700 dark:text-slate-300">
                {isEn ? 'Select a Farmer Thread' : 'ایک تھریڈ منتخب کریں'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {isEn
                  ? 'Click any farmer thread from the left panel to view their messages and send a real-time reply.'
                  : 'بائیں پینل سے کوئی بھی کسان تھریڈ منتخب کریں اور جواب دیں۔'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
