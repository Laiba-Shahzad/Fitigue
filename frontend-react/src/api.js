const API = 'http://localhost:3000';

function getToken() { return localStorage.getItem("token"); }

export async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

//Clothing Requests
export const getClothingRequests  = ()      => apiFetch('GET',    '/api/clothing-requests');
export const postClothingRequest  = (desc)  => apiFetch('POST',   '/api/clothing-requests', { description: desc });
export const deleteClothingRequest = (id)   => apiFetch('DELETE', `/api/clothing-requests/${id}`);

//Trade History
export const getTradeHistory     = ()   => apiFetch('GET',   '/api/history/trades');
export const getSwapHistory      = ()   => apiFetch('GET',   '/api/history/swaps');
export const getTradeStatusCount = ()   => apiFetch('GET',   '/api/history/trades/status');
export const cancelTrade         = (id) => apiFetch('PATCH', `/api/history/trades/${id}`);

//Notifications
export const getAllNotifications   = ()   => apiFetch('GET',    '/api/notifications');
export const getUnreadNotifications = ()  => apiFetch('GET',    '/api/notifications/unread');
export const getUnreadCount        = ()   => apiFetch('GET',    '/api/notifications/unread/count');
export const markNotifRead         = (id) => apiFetch('PATCH',  `/api/notifications/${id}/read`);
export const deleteReadNotifications = () => apiFetch('DELETE', '/api/notifications/read');

//Ratings
export const submitRating = (reviewed_user_id, trade_id, rating_value) =>
  apiFetch('POST', '/api/ratings', { reviewed_user_id, trade_id, rating_value });
export const deleteRating = (id) => apiFetch('DELETE', `/api/ratings/${id}`);