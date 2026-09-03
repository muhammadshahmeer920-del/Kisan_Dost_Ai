import { io, Socket } from 'socket.io-client';
import type { User, DairyProduct, CustomerOrderLead } from '../types';

const API_BASE = 'http://localhost:3000';
const TOKEN_KEY = 'kd_auth_token';
const CLIENT_ID_KEY = 'kd_client_id';

let socket: Socket | null = null;
let _clientId: string | null = null;

function getClientId(): string {
  if (!_clientId) {
    _clientId = localStorage.getItem(CLIENT_ID_KEY) || null;
    if (!_clientId) {
      _clientId = 'web_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(CLIENT_ID_KEY, _clientId);
    }
  }
  return _clientId;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function serverUserToWeb(row: any): Partial<User> {
  return {
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    farmName: row.farm_name || '',
    location: row.location || '',
    district: row.district || '',
    language: (row.language as 'ur' | 'en' | 'pb') || 'ur',
    role: row.role,
    isPremium: row.is_premium === 1,
    hasCompletedOnboarding: row.has_completed_onboarding === 1,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function adaptServerProduct(p: any): DairyProduct {
  if (p.nameEn !== undefined || p.nameUr !== undefined) {
    return {
      id: p.id,
      sellerId: p.sellerId || p.owner_id || '',
      name: p.name || p.nameEn || p.nameUr || '',
      nameEn: p.nameEn || p.name || '',
      nameUr: p.nameUr || '',
      category: p.category || 'milk',
      categoryEn: p.categoryEn || '',
      price: p.price ?? p.pricePKR ?? 0,
      pricePKR: p.pricePKR ?? p.price ?? 0,
      unit: p.unit || 'Liter',
      unitUr: p.unitUr || '',
      stock: p.stock ?? 0,
      dailyCapacity: p.dailyCapacity || '',
      isOrganic: p.isOrganic ?? false,
      inStock: p.inStock ?? true,
      description: p.description || p.descriptionEn || '',
      descriptionEn: p.descriptionEn || p.description || '',
      descriptionUr: p.descriptionUr || '',
      imageUrl: p.imageUrl || '',
      sellerName: p.sellerName || '',
      sellerPhone: p.sellerPhone || '',
      sellerCity: p.sellerCity || '',
      farmName: p.farmName || '',
      rating: p.rating,
      updatedAt: p.updatedAt || p.updated_at,
    };
  }
  return {
    id: p.id,
    sellerId: p.owner_id || p.sellerId || '',
    name: p.name || p.name_en || '',
    nameEn: p.name_en || p.name || '',
    nameUr: p.name_ur || '',
    category: p.category || p.category_en || 'milk',
    categoryEn: p.category_en || '',
    price: p.price_pkr ?? p.price ?? 0,
    pricePKR: p.price_pkr ?? p.pricePKR ?? 0,
    unit: p.unit || 'Liter',
    unitUr: p.unit_ur || '',
    stock: p.stock ?? 0,
    dailyCapacity: p.daily_capacity || p.dailyCapacity || '',
    isOrganic: (p.is_organic === 1) || p.isOrganic || false,
    inStock: (p.in_stock === 1) || (p.inStock ?? true),
    description: p.description || p.description_en || '',
    descriptionEn: p.description_en || '',
    descriptionUr: p.description_ur || '',
    imageUrl: p.image_url || p.imageUrl || '',
    sellerName: p.seller_name || p.sellerName || '',
    sellerPhone: p.seller_phone || p.sellerPhone || '',
    sellerCity: p.seller_city || p.sellerCity || '',
    farmName: p.farm_name || p.farmName || '',
    rating: p.rating,
    updatedAt: p.updated_at || p.updatedAt,
  };
}

export function adaptServerOrder(o: any): CustomerOrderLead {
  const statusMap: Record<string, CustomerOrderLead['status']> = {
    new_: 'new',
    contacted: 'contacted',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  return {
    id: o.id,
    customerName: o.customer_name || o.customerName || '',
    customerPhone: o.customer_phone || o.customerPhone || '',
    deliveryAddress: o.delivery_address || o.deliveryAddress || '',
    items: (o.items || []).map((it: any) => ({
      productId: it.product_id || it.productId,
      name: it.name || '',
      quantity: it.quantity || 0,
      unit: it.unit || '',
      pricePKR: it.price_pkr ?? it.pricePKR ?? 0,
    })),
    totalAmountPKR: o.total_amount_pkr ?? o.totalAmountPKR ?? 0,
    date: o.date || '',
    status: statusMap[o.status] || (o.status as CustomerOrderLead['status']) || 'new',
    notes: o.notes || '',
  };
}

async function api(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client': 'web',
    'X-Client-Id': getClientId(),
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res.json();
}

export async function login(phone: string, name?: string): Promise<{ ok: boolean; token?: string; user?: Partial<User>; error?: string }> {
  const result = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, name: name || phone }),
  });
  if (result.ok && result.token) {
    setToken(result.token);
    return { ok: true, token: result.token, user: serverUserToWeb(result.user) };
  }
  return { ok: false, error: result.error || 'Login failed' };
}

export async function register(phone: string, name: string, extra?: { farmName?: string; location?: string; district?: string }): Promise<{ ok: boolean; token?: string; user?: Partial<User>; error?: string }> {
  const result = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      phone,
      name,
      farm_name: extra?.farmName,
      location: extra?.location,
      district: extra?.district,
    }),
  });
  if (result.ok && result.token) {
    setToken(result.token);
    return { ok: true, token: result.token, user: serverUserToWeb(result.user) };
  }
  return { ok: false, error: result.error || 'Registration failed', ...(result.code ? { error: result.code } : {}) };
}

export async function restoreSession(): Promise<{ ok: boolean; user?: Partial<User> }> {
  const token = getToken();
  if (!token) return { ok: false };
  const result = await api('/api/auth/me');
  if (result.ok) {
    return { ok: true, user: serverUserToWeb(result.data) };
  }
  clearToken();
  return { ok: false };
}

export async function updateProfile(user: Partial<User> & { updatedAt?: string }): Promise<any> {
  return api('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: user.name,
      phone: user.phone,
      email: user.email,
      farm_name: user.farmName,
      location: user.location,
      district: user.district,
      language: user.language,
      updated_at: user.updatedAt,
    }),
  });
}

export async function fetchDairyProducts(since?: string): Promise<{ ok: boolean; data?: any[]; deletedIds?: string[] }> {
  const params = since ? `?since=${encodeURIComponent(since)}` : '';
  return api(`/api/dairy/products${params}`);
}

type ProfileListener = (data: any) => void;
type ProductListener = (event: string, data: any) => void;
type OrderListener = (event: string, data: any) => void;

let onProfileUpdated: ProfileListener | null = null;
let onProductEvent: ProductListener | null = null;
let onOrderEvent: OrderListener | null = null;

export function connectSocket(token: string, listeners: {
  onProfileUpdated?: ProfileListener;
  onProductEvent?: ProductListener;
  onOrderEvent?: OrderListener;
  onSnapshot?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}): void {
  if (socket?.connected) return;

  socket = io(API_BASE, {
    auth: { token, clientId: getClientId() },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[SyncApi] socket connected');
    listeners.onConnect?.();
  });

  socket.on('disconnect', () => {
    console.log('[SyncApi] socket disconnected');
    listeners.onDisconnect?.();
  });

  socket.on('sync:snapshot', (data: any) => {
    console.log('[SyncApi] snapshot received');
    listeners.onSnapshot?.(data);
  });

  socket.on('profile:updated', (payload: any) => {
    console.log('[SyncApi] profile:updated received, origin:', payload?.origin?.clientId, 'local:', getClientId());
    if (payload?.origin?.clientId === getClientId()) return;
    onProfileUpdated?.(payload);
  });

  socket.on('dairy:product:created', (payload: any) => {
    if (payload?.origin?.clientId === getClientId()) return;
    onProductEvent?.('created', payload);
  });

  socket.on('dairy:product:updated', (payload: any) => {
    if (payload?.origin?.clientId === getClientId()) return;
    onProductEvent?.('updated', payload);
  });

  socket.on('dairy:product:deleted', (payload: any) => {
    if (payload?.origin?.clientId === getClientId()) return;
    onProductEvent?.('deleted', payload);
  });

  socket.on('dairy:order:created', (payload: any) => {
    console.log('[SyncApi] dairy:order:created received');
    if (payload?.origin?.clientId === getClientId()) return;
    onOrderEvent?.('created', payload);
  });

  socket.on('dairy:order:updated', (payload: any) => {
    console.log('[SyncApi] dairy:order:updated received');
    if (payload?.origin?.clientId === getClientId()) return;
    onOrderEvent?.('updated', payload);
  });

  onProfileUpdated = listeners.onProfileUpdated || null;
  onProductEvent = listeners.onProductEvent || null;
  onOrderEvent = listeners.onOrderEvent || null;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function isConnected(): boolean {
  return socket?.connected ?? false;
}

export function emitProductUpsert(product: any): Promise<any> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, code: 'disconnected' });
      return;
    }
    socket.emit('dairy:product:upsert', {
      ...product,
      origin: { clientId: getClientId() },
    }, (response: any) => {
      resolve(response || { ok: true });
    });
  });
}

export function emitProductDelete(productId: string): Promise<any> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve({ ok: false, code: 'disconnected' });
      return;
    }
    socket.emit('dairy:product:delete', {
      id: productId,
      origin: { clientId: getClientId() },
    }, (response: any) => {
      resolve(response || { ok: true });
    });
  });
}
