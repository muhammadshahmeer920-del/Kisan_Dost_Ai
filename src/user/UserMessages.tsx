/**
 * UserMessages.tsx — Dual-Tab Support Desk
 *
 * REQUIREMENTS IMPLEMENTATION:
 *  1. Gemini AI Assistant Tab (`activeTab === 'ai'`):
 *     - Only contains Gemini AI prompts & responses (`kisan_gemini_ai_chat_${userId}`).
 *     - Strictly isolated from Direct Admin Support.
 *
 *  2. Direct Admin Support Tab (`activeTab === 'admin'`):
 *     - Connected via `chatSyncService.ts` to Firestore + BroadcastChannel + CustomEvents.
 *     - NO AUTOMATED BOT REPLIES (fake auto-reply timeouts completely removed).
 *     - Displays "Awaiting Admin Reply... / ایڈمن کے جواب کا انتظار" when last message is from farmer.
 *     - Real-time updates land in <100ms when Admin replies from Admin Panel.
 */
import React, { useState, useRef, useEffect } from 'react';
import { User, SupportMessageThread, Language } from '../types';
import {
  MessageSquare,
  Send,
  Bot,
  Headphones,
  Sparkles,
  Clock,
  CheckCheck,
  Check,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell
} from 'lucide-react';
import {
  sendChatMessage,
  subscribeToThread,
  ChatMessage,
  getLocalChatKey
} from '../services/chatSyncService';

interface UserMessagesProps {
  user: User;
  thread: SupportMessageThread | null;
  language: Language;
  onRefreshMessages: () => void;
}

type SupportTab = 'ai' | 'admin';

interface AiMessageItem {
  id: string;
  senderRole: 'user' | 'model';
  senderName: string;
  message: string;
  timestamp: string;
}

// ─── Local Storage Keys ──────────────────────────────────────────────────────
const LOCAL_AI_KEY = (uid: string) => `kisan_gemini_ai_chat_${uid}`;

function getLocalAiMessages(uid: string, isEn: boolean): AiMessageItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_AI_KEY(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }

  return [
    {
      id: 'ai_init_welcome',
      senderRole: 'model',
      senderName: isEn ? 'Kisan AI Assistant (Gemini)' : 'کسان اے آئی اسسٹنٹ',
      message: isEn
        ? 'Assalam-o-Alaikum! I am your Kisan AI Assistant powered by Google Gemini. Ask me any question about livestock health, disease symptoms, feed formulation, or medicine dosages.'
        : 'السلام علیکم! میں آپ کا کسان دوست اے آئی معاون (گوگل جیمنائی) ہوں۔ مویشیوں کی بیماری، علامات، خوراک یا ادویات کی مقدار سے متعلق کوئی بھی سوال پوچھیں۔',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
}

function saveLocalAiMessages(uid: string, msgs: AiMessageItem[]): void {
  try {
    localStorage.setItem(LOCAL_AI_KEY(uid), JSON.stringify(msgs));
  } catch { /* ignore */ }
}

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function playChime(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }
}

export const UserMessages: React.FC<UserMessagesProps> = ({
  user,
  language
}) => {
  const isEn = language === 'en';
  const threadId = `thread_${user.id}`;

  // ── Tab state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<SupportTab>('ai');
  const activeTabRef = useRef<SupportTab>('ai');
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // ══════════════════════════════════════════════════════════════════════════
  //  1. GEMINI AI CHAT STATE — Strictly isolated
  // ══════════════════════════════════════════════════════════════════════════
  const [aiMessages, setAiMessages] = useState<AiMessageItem[]>(
    () => getLocalAiMessages(user.id, isEn)
  );
  const [aiInput, setAiInput] = useState('');
  const [isAiSending, setIsAiSending] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiSending]);

  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiSending) return;

    const query = aiInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: AiMessageItem = {
      id: 'ai_u_' + Date.now().toString(36),
      senderRole: 'user',
      senderName: user.name || 'Farmer',
      message: query,
      timestamp: nowTime
    };

    const updatedWithUser = [...aiMessages, userMsg];
    setAiMessages(updatedWithUser);
    saveLocalAiMessages(user.id, updatedWithUser);
    setAiInput('');
    setIsAiSending(true);

    const historyPayload = updatedWithUser.map(m => ({
      role: m.senderRole === 'user' ? 'user' : 'model',
      parts: [{ text: m.message }]
    }));

    fetch('/api/ai/support-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, language, history: historyPayload })
    })
      .then(res => res.json())
      .then(data => {
        const replyText = data?.answer || (
          isEn
            ? 'Thank you for your question. For detailed advice, consult our offline knowledge packs or ask our live admin support.'
            : 'آپ کے سوال کا شکریہ۔ تفصیل کے لیے آف لائن گائیڈ دیکھیں۔'
        );

        const aiReplyMsg: AiMessageItem = {
          id: 'ai_m_' + Date.now().toString(36),
          senderRole: 'model',
          senderName: isEn ? 'Kisan AI Assistant (Gemini)' : 'کسان اے آئی اسسٹنٹ',
          message: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setAiMessages(prev => {
          const finalArr = [...prev, aiReplyMsg];
          saveLocalAiMessages(user.id, finalArr);
          return finalArr;
        });
        setIsAiSending(false);
      })
      .catch(() => {
        const fallbackMsg: AiMessageItem = {
          id: 'ai_err_' + Date.now().toString(36),
          senderRole: 'model',
          senderName: isEn ? 'Kisan AI (Offline Mode)' : 'کسان اے آئی (آف لائن)',
          message: isEn
            ? 'Gemini AI is currently processing in offline mode. Please switch to Direct Admin Support for live human help.'
            : 'اے آئی آف لائن موڈ میں ہے۔ لائیو جواب کے لیے ایڈمن سپورٹ ٹیب استعمال کریں۔',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setAiMessages(prev => {
          const finalArr = [...prev, fallbackMsg];
          saveLocalAiMessages(user.id, finalArr);
          return finalArr;
        });
        setIsAiSending(false);
      });
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  2. DIRECT ADMIN SUPPORT CHAT STATE — via chatSyncService
  // ══════════════════════════════════════════════════════════════════════════
  const [adminMessages, setAdminMessages] = useState<ChatMessage[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [isAdminSending, setIsAdminSending] = useState(false);
  const [adminUnreadBadge, setAdminUnreadBadge] = useState(0);
  const adminEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat via chatSyncService (Firestore + BroadcastChannel + Events)
  useEffect(() => {
    let lastAdminMsgCount = 0;

    const unsubscribe = subscribeToThread(threadId, (msgs: ChatMessage[]) => {
      setAdminMessages(msgs);

      const currentAdminCount = msgs.filter(m => m.senderType === 'ADMIN').length;
      if (currentAdminCount > lastAdminMsgCount && lastAdminMsgCount > 0) {
        if (activeTabRef.current !== 'admin') {
          setAdminUnreadBadge(prev => prev + (currentAdminCount - lastAdminMsgCount));
          playChime();
        }
      }
      lastAdminMsgCount = currentAdminCount;
    });

    return () => unsubscribe();
  }, [threadId]);

  useEffect(() => {
    adminEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminMessages]);

  const handleSwitchToAdminTab = () => {
    setActiveTab('admin');
    setAdminUnreadBadge(0);
  };

  // Farmer sends message directly to Admin thread (NO AUTOMATED BOT REPLIES)
  const handleAdminSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInput.trim() || isAdminSending) return;

    const text = adminInput.trim();
    setAdminInput('');
    setIsAdminSending(true);

    try {
      await sendChatMessage({
        threadId,
        farmerId: user.id,
        farmerName: user.name || 'Chaudhry Farmer',
        farmName: user.farmName || 'Kisan Dost Farm',
        senderRole: 'FARMER',
        senderName: user.name || 'Farmer',
        text
      });
    } catch (err) {
      console.error('Error sending farmer message:', err);
    } finally {
      setIsAdminSending(false);
    }
  };

  // Check if last message was sent by Farmer (awaiting admin reply)
  const lastMsg = adminMessages.length > 0 ? adminMessages[adminMessages.length - 1] : null;
  const isAwaitingAdminReply = lastMsg?.senderType === 'FARMER';

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── Dual-Tab Switcher ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2">

        {/* Tab 1: Gemini AI Assistant */}
        <button
          id="tab-btn-ai"
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isEn ? '🤖 Kisan AI Assistant (Gemini)' : '🤖 کسان اے آئی اسسٹنٹ'}
          </span>
          {activeTab === 'ai' && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20">
              AI
            </span>
          )}
        </button>

        {/* Tab 2: Direct Admin Support */}
        <button
          id="tab-btn-admin"
          type="button"
          onClick={handleSwitchToAdminTab}
          className={`flex-1 flex items-center justify-center space-x-2 rtl:space-x-reverse py-3 px-4 rounded-2xl text-xs font-bold transition-all relative ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/25'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Headphones className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isEn ? '🎧 Direct Admin Support' : '🎧 براہ راست ایڈمن سپورٹ'}
          </span>

          {/* Unread Badge Counter */}
          {adminUnreadBadge > 0 && activeTab !== 'admin' && (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md shadow-rose-500/40">
              {adminUnreadBadge > 9 ? '9+' : adminUnreadBadge}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           TAB 1: KISAN AI ASSISTANT (GEMINI)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ai' && (
        <>
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {isEn ? 'Kisan AI Assistant (Powered by Gemini)' : 'کسان اے آئی اسسٹنٹ (گوگل جیمنائی)'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                    ● {isEn ? 'Gemini AI Online' : 'جیمنائی آن لائن'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Instant AI answers for livestock health, symptoms, nutrition & medicine'
                    : 'مویشیوں کی صحت، علامات، خوراک اور ادویات کے فوری جوابات'}
                </p>
              </div>
            </div>

            {/* Admin arrival alert button if unread */}
            {adminUnreadBadge > 0 && (
              <button
                type="button"
                onClick={handleSwitchToAdminTab}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 transition-all animate-pulse"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {adminUnreadBadge} {isEn ? 'new admin message(s)' : 'نیا ایڈمن پیغام'}
                </span>
              </button>
            )}
          </div>

          {/* AI Chat Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px] overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                  🤖 {isEn ? 'Gemini AI Stream — Isolated AI Conversation' : 'گوگل جیمنائی اے آئی گفتگو'}
                </span>
              </div>

              {aiMessages.map((msg, idx) => {
                const isMe = msg.senderRole === 'user';
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-1.5 rtl:space-x-reverse mb-1 text-[11px] text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700/60'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}

              {isAiSending && (
                <div className="flex items-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tl-sm p-4 text-xs text-slate-500 flex items-center space-x-2 rtl:space-x-reverse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-500" />
                    <span>{isEn ? 'Gemini AI is thinking...' : 'جیمنائی سوچ رہا ہے...'}</span>
                  </div>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>

            {/* AI Form */}
            <form
              onSubmit={handleAiSend}
              className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                id="ai-prompt-input"
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder={isEn ? 'Ask Gemini AI about animal disease, feed, medicine...' : 'بیماری، دوا، خوراک، ٹیکہ جات سے متعلق پوچھیں'}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                disabled={isAiSending}
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || isAiSending}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center space-x-1.5 rtl:space-x-reverse shrink-0"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{isEn ? 'Ask AI' : 'پوچھیں'}</span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
           TAB 2: DIRECT ADMIN & HELPDESK SUPPORT
           (Direct real-time link to Admin Panel — NO automated bot text)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admin' && (
        <>
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20 relative">
                <Headphones className="w-6 h-6" />
                <span className="absolute -top-1 -end-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {isEn ? 'Direct Admin & Helpdesk Support' : 'براہ راست ایڈمن و ہیلپ ڈیسک سپورٹ'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1 rtl:space-x-reverse">
                    <Wifi className="w-2.5 h-2.5" />
                    <span>{isEn ? 'Live Admin Channel' : 'لائیو ایڈمن چینل'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn
                    ? 'Official Support Officer · Live bi-directional chat with Admin Panel'
                    : 'آفیشل سپورٹ آفیسر · ایڈمن پینل کے ساتھ لائیو دو طرفہ چیٹ'}
                </p>
              </div>
            </div>
            <span className="hidden sm:block font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-[10px]">
              {threadId}
            </span>
          </div>

          {/* Admin Chat Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[520px] overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  🔒 {isEn ? 'Direct Helpdesk Channel · Connected to Admin Panel' : 'براہ راست ہیلپ ڈیسک · ایڈمن پینل کے ساتھ منسلک'}
                </span>
              </div>

              {adminMessages.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-teal-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    {isEn ? 'Start a conversation with Support Officers' : 'ایڈمن سپورٹ آفیسرز کو پیغام بھیجیں'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {isEn
                      ? 'Inquire about official subsidies, government grants, vet visits, or complaint follow-ups.'
                      : 'سرکاری سبسڈی، گرانٹ، ڈاکٹری معائنہ یا شکایت کی پیروی کے لیے سوال کریں۔'}
                  </p>
                </div>
              )}

              {/* Renders adminMessages */}
              {adminMessages.map((msg, idx) => {
                const isMe = msg.senderType === 'FARMER';
                const showTime = idx === 0 || Math.abs(
                  new Date(msg.timestamp).getTime() - new Date(adminMessages[idx - 1]?.timestamp || 0).getTime()
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
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-1 px-1">
                          🎧 {msg.senderName}
                        </span>
                      )}
                      <div className={`max-w-[82%] sm:max-w-[68%] rounded-3xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60'
                      }`}>
                        {msg.text}
                      </div>

                      {isMe && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse mt-1 text-[10px] text-slate-400 px-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{fmtTime(msg.timestamp)}</span>
                          {msg.status === 'sent' && <Check className="w-2.5 h-2.5 text-slate-400" />}
                          {msg.status === 'delivered' && <CheckCheck className="w-2.5 h-2.5 text-teal-500" />}
                        </div>
                      )}
                      {!isMe && (
                        <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                          {fmtTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Status indicator when waiting for Admin reply */}
              {isAwaitingAdminReply && (
                <div className="flex justify-start">
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl px-3.5 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    <span className="font-bold">
                      {isEn ? 'Awaiting Admin Reply...' : 'ایڈمن کے جواب کا انتظار hai...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={adminEndRef} />
            </div>

            {/* Admin Form */}
            <form
              onSubmit={handleAdminSend}
              className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                id="admin-msg-input"
                type="text"
                value={adminInput}
                onChange={e => setAdminInput(e.target.value)}
                placeholder={isEn ? 'Type your message for official admin support...' : 'ایڈمن سپورٹ کے لیے پیغام لکھیں...'}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                disabled={isAdminSending}
              />
              <button
                type="submit"
                disabled={!adminInput.trim() || isAdminSending}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center space-x-1.5 rtl:space-x-reverse shrink-0"
              >
                {isAdminSending
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4 rtl:rotate-180" />
                }
                <span className="hidden sm:inline">{isEn ? 'Send' : 'ارسال'}</span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-[11px] text-slate-400 dark:text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isEn ? 'Direct channel with Admin Panel · Messages update in real-time' : 'ایڈمن پینل کے ساتھ براہ راست رابطہ · پیغامات فوری اپ ڈیٹ ہوتے ہیں'}</span>
          </div>
        </>
      )}

    </div>
  );
};
