/**
 * src/services/chatSyncService.ts
 *
 * UNIFIED CHAT SYNCHRONIZATION SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides multi-layer real-time synchronization between Farmer Support Desk
 * and Admin Support Desk (<100ms latency across tabs and windows):
 *  1. Firestore `onSnapshot` real-time database listener
 *  2. HTML5 BroadcastChannel ('kisandost_support_channel')
 *  3. In-memory CustomEvent ('kisandost_chat_update')
 *  4. Native window `storage` event fallback for multi-window sync
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { pushChatMessage, subscribeToSupportThread, subscribeToAllSupportThreads, ChatMessage, SupportThread } from '../lib/firebase';

export type { ChatMessage, SupportThread };

export interface SendMessageParams {
  threadId: string;
  farmerId: string;
  farmerName: string;
  farmName?: string;
  senderRole: 'FARMER' | 'ADMIN';
  senderName: string;
  text: string;
}

// Local Storage Key Helper
export const getLocalChatKey = (threadId: string) => `kisan_admin_chat_${threadId}`;

// Read messages from Local Storage
export function getStoredChatMessages(threadId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getLocalChatKey(threadId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save messages to Local Storage
export function saveStoredChatMessages(threadId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(getLocalChatKey(threadId), JSON.stringify(messages));
  } catch { /* ignore */ }
}

// BroadcastChannel instance (singleton across app)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('kisandost_support_channel');
  }
} catch {
  broadcastChannel = null;
}

/**
 * Send a chat message (Farmer or Admin side)
 * Pushes to Firestore, saves to Local Storage, and broadcasts to all tabs/windows instantly.
 */
export async function sendChatMessage(params: SendMessageParams): Promise<ChatMessage> {
  const { threadId, farmerId, farmerName, farmName, senderRole, senderName, text } = params;
  const nowIso = new Date().toISOString();

  const newMessage: ChatMessage = {
    id: 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    senderId: senderRole === 'FARMER' ? farmerId : 'admin_sys',
    senderName,
    senderType: senderRole,
    text,
    timestamp: nowIso,
    status: 'delivered'
  };

  // 1. Local storage update for instant local re-render
  const currentMessages = getStoredChatMessages(threadId);
  const updatedMessages = [...currentMessages, newMessage];
  saveStoredChatMessages(threadId, updatedMessages);

  // 2. Trigger Firestore push in background (upserts support_threads parent doc)
  const threadStatus = senderRole === 'FARMER' ? 'OPEN' : 'IN_PROGRESS';
  pushChatMessage(threadId, newMessage, {
    threadId,
    farmerId,
    farmerName,
    farmName: farmName || '',
    status: threadStatus,
    lastMessage: text.substring(0, 80),
    lastUpdated: nowIso
  }).catch(err => {
    console.warn('[chatSyncService] Firestore push warning:', err?.message);
  });

  // 3. Broadcast to all open tabs via BroadcastChannel
  try {
    broadcastChannel?.postMessage({
      type: 'NEW_CHAT_MESSAGE',
      threadId,
      message: newMessage,
      timestamp: Date.now()
    });
  } catch { /* ignore */ }

  // 4. Dispatch in-window CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kisandost_chat_update', {
      detail: { threadId, message: newMessage }
    }));

    // 5. Trigger window storage event for cross-window fallback
    try {
      localStorage.setItem('kisandost_chat_sync_ping', JSON.stringify({
        threadId,
        timestamp: Date.now()
      }));
    } catch { /* ignore */ }
  }

  return newMessage;
}

/**
 * Subscribe to a specific thread's messages in real-time.
 * Listens on Firestore, BroadcastChannel, CustomEvent, and storage events.
 */
export function subscribeToThread(
  threadId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  let isUnsubscribed = false;

  const notify = () => {
    if (isUnsubscribed) return;
    const msgs = getStoredChatMessages(threadId);
    callback(msgs);
  };

  // 1. Initial load from local storage
  notify();

  // 2. Subscribe to Firestore onSnapshot
  const unsubFirestore = subscribeToSupportThread(threadId, (firestoreMsgs) => {
    if (isUnsubscribed) return;
    if (firestoreMsgs && firestoreMsgs.length > 0) {
      saveStoredChatMessages(threadId, firestoreMsgs);
      callback(firestoreMsgs);
    }
  });

  // 3. Listen to BroadcastChannel
  const handleBroadcast = (event: MessageEvent) => {
    if (event.data?.threadId === threadId) {
      notify();
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 4. Listen to CustomEvent
  const handleCustomEvent = (event: Event) => {
    const customEvt = event as CustomEvent;
    if (customEvt.detail?.threadId === threadId) {
      notify();
    }
  };
  window.addEventListener('kisandost_chat_update', handleCustomEvent);

  // 5. Listen to native storage events (for cross-window sync)
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === getLocalChatKey(threadId) || event.key === 'kisandost_chat_sync_ping') {
      notify();
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  // Return unsubscribe cleanup function
  return () => {
    isUnsubscribed = true;
    if (typeof unsubFirestore === 'function') unsubFirestore();
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('kisandost_chat_update', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
