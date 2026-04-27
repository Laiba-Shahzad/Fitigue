import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3000/api' });

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── PURCHASE ───────────────────────────────────────────────────
export const buyItem       = (data)   => API.post('/purchases/', data);
export const getMyPurchases = ()      => API.get('/purchases/purchases');
export const getMySales     = ()      => API.get('/purchases/sales');

// ─── SWAPS ──────────────────────────────────────────────────────
export const sendSwapRequest     = (data) => API.post('/swaps/', data);
export const getIncomingRequests = ()     => API.get('/swaps/incoming');
export const getOutgoingRequests = ()     => API.get('/swaps/outgoing');
export const acceptSwap          = (id)   => API.patch(`/swaps/${id}/accept`);
export const rejectSwap          = (id)   => API.patch(`/swaps/${id}/reject`);
export const completeSwap        = (id)   => API.patch(`/swaps/${id}/complete`);
export const cancelSwap          = (id)   => API.delete(`/swaps/${id}/cancel`);

// ─── CHAT ───────────────────────────────────────────────────────
export const startConversation  = (data) => API.post('/chats/', data);
export const sendMessage        = (id, data) => API.post(`/chats/${id}/messages`, data);
export const getChatbox         = ()     => API.get('/chats/');
export const getChatHistory     = (id)   => API.get(`/chats/${id}/messages`);
export const getUnreadCount     = ()     => API.get('/chats/unread');
export const deleteMessage      = (convId, msgId) => API.delete(`/chats/${convId}/messages/${msgId}`);
export const deleteConversation = (id)   => API.delete(`/chats/${id}`);