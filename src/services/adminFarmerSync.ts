/**
 * src/services/adminFarmerSync.ts
 *
 * CENTRALIZED REAL-TIME ADMIN-FARMER DATA SYNC SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronizes all administrative control panel views with live farmer activity:
 *  1. BroadcastChannel ('kisandost_admin_sync')
 *  2. In-memory CustomEvent ('kisandost_admin_sync')
 *  3. Native window `storage` event ('kisandost_admin_ping')
 *
 * Data Slices:
 *  - farmersList: Registered farmer accounts
 *  - livestockMaster: Master cattle inventory across all farms
 *  - grantsApplications: Farmer subsidy & grant applications
 *  - grievancesList: Farmer complaints & support tickets
 *  - bioSecurityAlerts: AI disease scan detections & outbreak warnings
 *  - broadcastMessages: Push notifications & announcements sent to farmers
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  User,
  Animal,
  UserApplication,
  UserComplaint,
  AdminUserItem,
  UnifiedRecord,
  AdminNotification,
  AIActivityLog,
  BiosecurityAssessment
} from '../types';
import {
  getStoredAdminUsers,
  getStoredApplications,
  saveStoredApplications,
  getStoredComplaints,
  saveStoredComplaints,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredAILogs,
  getStoredBiosecurityAssessments,
  saveStoredBiosecurityAssessment,
  getStoredAnimals,
  getStoredUserActivityLogs,
  getUser,
  logAdminAction
} from '../lib/storage';
import { syncDocToFirestore, COLLECTIONS } from '../lib/firebase';

export interface AdminFarmerSyncData {
  farmersList: AdminUserItem[];
  livestockMaster: Animal[];
  grantsApplications: UserApplication[];
  grievancesList: UserComplaint[];
  bioSecurityAlerts: BiosecurityAssessment[];
  broadcastMessages: AdminNotification[];
  aiLogs: AIActivityLog[];
}

// ─── Broadcast Channel Instance ──────────────────────────────────────────────
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('kisandost_admin_sync');
  }
} catch {
  broadcastChannel = null;
}

// ─── Trigger Broadcast Notification ─────────────────────────────────────────
export function notifyAdminSync(eventType: string, payload?: any): void {
  // 1. BroadcastChannel
  try {
    broadcastChannel?.postMessage({
      type: eventType,
      payload,
      timestamp: Date.now()
    });
  } catch { /* ignore */ }

  // 2. CustomEvent in current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kisandost_admin_sync', {
      detail: { type: eventType, payload }
    }));

    // 3. Storage event for cross-window sync
    try {
      localStorage.setItem('kisandost_admin_ping', JSON.stringify({
        type: eventType,
        timestamp: Date.now()
      }));
    } catch { /* ignore */ }
  }
}

// ─── Subscribe to Admin Sync (<50ms real-time listener) ─────────────────────
export function subscribeToAdminSync(callback: () => void): () => void {
  let unsubscribed = false;

  const handleUpdate = () => {
    if (!unsubscribed) callback();
  };

  // 1. Listen to BroadcastChannel
  const handleBroadcast = (event: MessageEvent) => {
    handleUpdate();
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // 2. Listen to CustomEvent
  window.addEventListener('kisandost_admin_sync', handleUpdate);

  // 3. Listen to window storage event
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === 'kisandost_admin_ping' ||
      event.key === 'kisan_dost_applications' ||
      event.key === 'kisan_dost_complaints' ||
      event.key === 'kisan_dost_notifications' ||
      event.key === 'kisan_dost_animals' ||
      event.key === 'kisan_dost_user'
    ) {
      handleUpdate();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    unsubscribed = true;
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('kisandost_admin_sync', handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

// ─── Getters for Data Slices ──────────────────────────────────────────────────

/**
 * Get all registered farmers (combining admin users & logged user activity)
 */
export function getFarmersList(): AdminUserItem[] {
  const adminUsers = getStoredAdminUsers();
  const activityLogs = getStoredUserActivityLogs();
  const currentUser = getUser();

  const farmerMap = new Map<string, AdminUserItem>();

  // Add stored admin users first
  adminUsers.forEach(u => farmerMap.set(u.id, u));

  // Add activity log entries (new sign ups)
  activityLogs.forEach(act => {
    if (!farmerMap.has(act.userId)) {
      farmerMap.set(act.userId, {
        id: act.userId,
        name: act.name || 'Farmer',
        phone: '0300-1234567',
        email: act.email || `${act.userId}@kisandost.ai`,
        farmName: act.farmName || 'Kisan Farm',
        district: act.city || 'Sahiwal',
        role: 'user',
        status: 'active',
        registrationDate: act.timestamp ? act.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        lastLogin: act.lastLogin || act.timestamp || new Date().toISOString(),
        totalRecordsCount: 4
      });
    }
  });

  // Ensure primary demo user is present
  if (currentUser && currentUser.id && !farmerMap.has(currentUser.id)) {
    farmerMap.set(currentUser.id, {
      id: currentUser.id,
      name: currentUser.name || 'Chaudhry Ahmed Ali',
      phone: currentUser.phone || '0300-1234567',
      email: currentUser.email || 'farmer@kisandost.ai',
      farmName: currentUser.farmName || 'المدینہ ڈیری فارم',
      district: currentUser.district || 'ساہیوال (Sahiwal)',
      role: 'user',
      status: 'active',
      registrationDate: currentUser.createdAt ? currentUser.createdAt.split('T')[0] : '2026-08-01',
      lastLogin: new Date().toISOString(),
      totalRecordsCount: 4
    });
  }

  return Array.from(farmerMap.values());
}

/**
 * Get master livestock across all farms
 */
export function getLivestockMaster(): Animal[] {
  return getStoredAnimals();
}

/**
 * Get all grant / subsidy applications
 */
export function getGrantsApplications(): UserApplication[] {
  return getStoredApplications();
}

/**
 * Get all grievances / complaints
 */
export function getGrievancesList(): UserComplaint[] {
  return getStoredComplaints();
}

/**
 * Get biosecurity alerts & AI disease scan detections
 */
export function getBioSecurityAlerts(): BiosecurityAssessment[] {
  return getStoredBiosecurityAssessments();
}

/**
 * Get broadcast messages / notifications
 */
export function getBroadcastMessages(): AdminNotification[] {
  return getStoredNotifications();
}

// ─── Mutators with Real-Time Notification ─────────────────────────────────────

/**
 * Update Grant Application status (Approve / Reject / Review)
 * Instant notification updates Farmer UI in <50ms
 */
export function updateGrantStatus(
  appId: string,
  status: UserApplication['status'],
  adminNotes?: string
): void {
  const apps = getStoredApplications();
  const updated = apps.map(a => {
    if (a.id === appId) {
      return {
        ...a,
        status,
        adminNotes: adminNotes !== undefined ? adminNotes : a.adminNotes
      };
    }
    return a;
  });

  saveStoredApplications(updated);

  // Sync to Firestore
  const targetApp = updated.find(a => a.id === appId);
  if (targetApp) {
    syncDocToFirestore(COLLECTIONS.APPLICATIONS, targetApp).catch(() => {});
  }

  // Audit log
  logAdminAction({
    adminId: 'admin_sys',
    adminName: 'System Administrator',
    action: `Updated Grant Application ${appId} to ${status.toUpperCase()}`,
    targetEntity: 'UserApplication',
    targetId: appId,
    newValue: `Status: ${status}, Notes: ${adminNotes || ''}`
  });

  // Real-time broadcast notification (<50ms)
  notifyAdminSync('GRANT_STATUS_UPDATED', { appId, status, adminNotes });
}

/**
 * Update Grievance / Complaint status (Resolved / In Progress / Rejected)
 */
export function updateGrievanceStatus(
  complaintId: string,
  status: UserComplaint['status'],
  resolutionNotes?: string
): void {
  const complaints = getStoredComplaints();
  const updated = complaints.map(c => {
    if (c.id === complaintId) {
      return {
        ...c,
        status,
        adminResponse: resolutionNotes !== undefined ? resolutionNotes : c.adminResponse
      };
    }
    return c;
  });

  saveStoredComplaints(updated);

  const targetComp = updated.find(c => c.id === complaintId);
  if (targetComp) {
    syncDocToFirestore(COLLECTIONS.COMPLAINTS, targetComp).catch(() => {});
  }

  logAdminAction({
    adminId: 'admin_sys',
    adminName: 'Customer Support Administrator',
    action: `Updated Grievance ${complaintId} status to ${status.toUpperCase()}`,
    targetEntity: 'UserComplaint',
    targetId: complaintId,
    newValue: `Status: ${status}, Resolution: ${resolutionNotes || ''}`
  });

  notifyAdminSync('GRIEVANCE_STATUS_UPDATED', { complaintId, status, resolutionNotes });
}

/**
 * Send an Admin Broadcast message to all farmers (pushes to Notification bell)
 */
export function sendAdminBroadcast(
  title: string,
  message: string,
  priority: AdminNotification['priority'] = 'announcement',
  isUrgent: boolean = false
): AdminNotification {
  const currentNotifs = getStoredNotifications();
  const newNotif: AdminNotification = {
    id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
    title,
    message,
    targetAudience: 'all',
    createdDate: new Date().toISOString().split('T')[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'active',
    priority: isUrgent ? 'alert' : priority,
    createdBy: 'Kisan Admin Broadcast Engine'
  };

  const updated = [newNotif, ...currentNotifs];
  saveStoredNotifications(updated);

  syncDocToFirestore(COLLECTIONS.NOTIFICATIONS, newNotif).catch(() => {});

  logAdminAction({
    adminId: 'admin_sys',
    adminName: 'Broadcast Command Center',
    action: `Broadcasted System Announcement: "${title}"`,
    targetEntity: 'AdminNotification',
    targetId: newNotif.id
  });

  notifyAdminSync('BROADCAST_SENT', newNotif);
  return newNotif;
}

/**
 * Record a farmer AI disease scan (Lumpy Skin Disease detection, etc.)
 */
export function recordFarmerDiseaseScan(assessment: BiosecurityAssessment): void {
  saveStoredBiosecurityAssessment(assessment);
  notifyAdminSync('DISEASE_SCAN_RECORDED', assessment);
}
