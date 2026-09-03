import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  deleteDoc,
  writeBatch,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { User } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with named database if specified in config
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  ANIMALS: 'animals',
  EXPENSES: 'expenses',
  APPOINTMENTS: 'appointments',
  DAIRY_PRODUCTS: 'dairyProducts',
  ADMIN_USERS: 'adminUsers',
  APPLICATIONS: 'applications',
  COMPLAINTS: 'complaints',
  SYSTEM_REPORTS: 'systemReports',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  AI_ACTIVITY: 'aiActivity',
  AUDIT_LOGS: 'adminAuditLogs',
  SETTINGS: 'adminSettings',
  SUPPORT_THREADS: 'support_threads',  // Real-time support chat threads
};

// ─── Real-time Support Chat Types ───────────────────────────────────────────
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'FARMER' | 'ADMIN';
  text: string;
  timestamp: string;  // ISO string
  status?: 'sent' | 'delivered' | 'read';
}

export interface SupportThread {
  threadId: string;        // e.g. thread_{farmerId}
  farmerId: string;
  farmerName: string;
  farmName?: string;
  farmerEmail?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  lastMessage?: string;
  lastUpdated: string;     // ISO string
  unreadAdmin?: number;    // unread messages for admin
  unreadFarmer?: number;   // unread messages for farmer
}

// ─── Real-time Chat Helpers ─────────────────────────────────────────────────

/**
 * Push a new message to support_threads/{threadId}/messages
 * Also upserts the parent thread document
 */
export async function pushChatMessage(
  threadId: string,
  msg: Omit<ChatMessage, 'id'>,
  threadMeta?: Partial<SupportThread>
): Promise<string> {
  try {
    const threadRef = doc(db, COLLECTIONS.SUPPORT_THREADS, threadId);
    const messagesRef = collection(db, COLLECTIONS.SUPPORT_THREADS, threadId, 'messages');

    // Upsert parent thread doc
    await setDoc(threadRef, {
      threadId,
      status: 'OPEN',
      lastMessage: msg.text.substring(0, 80),
      lastUpdated: msg.timestamp,
      ...threadMeta,
    }, { merge: true });

    // Add message sub-document with auto-id
    const msgRef = await addDoc(messagesRef, {
      ...msg,
      id: '',  // will be overwritten below
    });

    // Write back the auto-generated id
    await setDoc(msgRef, { id: msgRef.id }, { merge: true });
    return msgRef.id;
  } catch (error: any) {
    console.warn('pushChatMessage (local fallback):', error?.message);
    return 'local_' + Date.now().toString(36);
  }
}

/**
 * Real-time listener on support_threads/{threadId}/messages (ordered by timestamp)
 * Falls back gracefully when Firestore is unavailable
 */
export function subscribeToSupportThread(
  threadId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  try {
    const messagesRef = collection(db, COLLECTIONS.SUPPORT_THREADS, threadId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach(d => msgs.push(d.data() as ChatMessage));
      callback(msgs);
    }, (err) => {
      console.warn('subscribeToSupportThread error (offline):', err?.message);
    });
  } catch (e) {
    console.warn('subscribeToSupportThread setup error:', e);
    return () => {};
  }
}

/**
 * Real-time listener on all active support threads (for Admin Panel)
 */
export function subscribeToAllSupportThreads(
  callback: (threads: SupportThread[]) => void
): () => void {
  try {
    return onSnapshot(collection(db, COLLECTIONS.SUPPORT_THREADS), (snapshot) => {
      const threads: SupportThread[] = [];
      snapshot.forEach(d => threads.push(d.data() as SupportThread));
      // Sort by lastUpdated desc
      threads.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
      callback(threads);
    }, (err) => {
      console.warn('subscribeToAllSupportThreads error (offline):', err?.message);
    });
  } catch (e) {
    console.warn('subscribeToAllSupportThreads setup error:', e);
    return () => {};
  }
}

/**
 * Fetch or create a user profile document in Firestore
 */
export async function fetchOrCreateUserProfile(firebaseUser: FirebaseUser, extraFields?: Partial<User>): Promise<User> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existingUser = snap.data() as User;
      if (extraFields && Object.keys(extraFields).length > 0) {
        const updated = { ...existingUser, ...extraFields };
        await setDoc(userRef, updated, { merge: true });
        return updated;
      }
      return existingUser;
    }

    const newUser: User = {
      id: firebaseUser.uid,
      name: extraFields?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Chaudhry Farmer',
      email: firebaseUser.email || extraFields?.email || 'farmer@kisandost.ai',
      phone: extraFields?.phone || firebaseUser.phoneNumber || '0300-1234567',
      farmName: extraFields?.farmName || 'Kisan Dost Dairy & Cattle Farm',
      location: extraFields?.location || 'Sahiwal, Punjab',
      district: extraFields?.district || 'Sahiwal',
      language: extraFields?.language || 'ur',
      isPremium: true,
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString()
    };

    await setDoc(userRef, newUser, { merge: true });
    return newUser;
  } catch (error) {
    console.error('Error fetching user profile from Firestore:', error);
    return {
      id: firebaseUser.uid,
      name: extraFields?.name || firebaseUser.displayName || 'Chaudhry Farmer',
      email: firebaseUser.email || 'farmer@kisandost.ai',
      phone: extraFields?.phone || '0300-1234567',
      farmName: 'Kisan Dost Dairy & Cattle Farm',
      location: 'Sahiwal, Punjab',
      district: 'Sahiwal',
      language: 'ur',
      isPremium: true,
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString()
    };
  }
}

/**
 * Sign in with Google Auth
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return await fetchOrCreateUserProfile(result.user);
}

/**
 * Sign in or Register with Email & Password
 */
export async function loginOrRegisterWithEmail(email: string, pass: string, extraData?: Partial<User>): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return await fetchOrCreateUserProfile(res.user, extraData);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
      const newRes = await createUserWithEmailAndPassword(auth, email, pass);
      return await fetchOrCreateUserProfile(newRes.user, extraData);
    }
    throw err;
  }
}

/**
 * Log out current Firebase user
 */
export async function logoutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Auth state updates
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Sync helper: Save an item to Firestore
 */
export async function syncDocToFirestore<T extends { id: string }>(
  collectionName: string, 
  data: T
): Promise<void> {
  try {
    if (!data || !data.id) return;
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      console.warn(`Firestore sync note for ${collectionName}: local offline or permission skipped.`, error?.message);
    } else {
      console.error(`Error syncing document to ${collectionName}:`, error);
    }
  }
}

/**
 * Fetch all documents from a collection
 */
export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${collectionName}:`, error);
    return [];
  }
}

/**
 * Delete document from Firestore
 */
export async function deleteDocFromFirestore(collectionName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting doc ${docId} from ${collectionName}:`, error);
  }
}

/**
 * Real-time listener for a collection
 */
export function subscribeToFirestoreCollection<T>(
  collectionName: string, 
  callback: (data: T[]) => void
) {
  try {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      callback(items);
    }, (error) => {
      console.warn(`Firestore listener warning for ${collectionName}:`, error);
    });
  } catch (e) {
    console.error(`Error setting up listener for ${collectionName}:`, e);
    return () => {};
  }
}

/**
 * Seed initial data to Firestore if empty
 */
export async function seedFirestoreInitialData(
  users: any,
  animals: any[],
  expenses: any[],
  appointments: any[],
  dairyProducts: any[]
): Promise<void> {
  try {
    // Check if animals already exist in Firestore
    const snapshot = await getDocs(collection(db, COLLECTIONS.ANIMALS));
    if (snapshot.empty) {
      console.log('Seeding initial animals to Firestore...');
      const batch = writeBatch(db);
      animals.forEach((animal) => {
        const ref = doc(db, COLLECTIONS.ANIMALS, animal.id);
        batch.set(ref, animal, { merge: true });
      });
      expenses.forEach((expense) => {
        const ref = doc(db, COLLECTIONS.EXPENSES, expense.id);
        batch.set(ref, expense, { merge: true });
      });
      appointments.forEach((apt) => {
        const ref = doc(db, COLLECTIONS.APPOINTMENTS, apt.id);
        batch.set(ref, apt, { merge: true });
      });
      dairyProducts.forEach((dp) => {
        const ref = doc(db, COLLECTIONS.DAIRY_PRODUCTS, dp.id);
        batch.set(ref, dp, { merge: true });
      });
      if (users && users.id) {
        const userRef = doc(db, COLLECTIONS.USERS, users.id);
        batch.set(userRef, users, { merge: true });
      }
      await batch.commit();
      console.log('Firestore initial seeding completed successfully!');
    }
  } catch (e) {
    console.error('Error seeding initial Firestore data:', e);
  }
}
