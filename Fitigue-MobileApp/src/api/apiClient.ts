import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.40.245.42:3000/api'; 

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

// Web-compatible storage
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
  // Use AsyncStorage for native platforms
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
};

const getToken = async (): Promise<string | null> => {
  const storage = getStorage();
  return await storage.getItem('authToken');
};

const apiCall = async (endpoint: string, options: RequestOptions = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || data.error || 'An error occurred',
        data,
      };
    }

    return data;
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        status: 0,
        message: 'Network error - please check if the backend server is running',
        data: null,
      };
    }
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
    gender: string;
    age: number;
  }) => apiCall('/users/register', { method: 'POST', body: userData }),

  login: (credentials: { username: string; password: string }) =>
    apiCall('/users/login', { method: 'POST', body: credentials }),

  getProfile: () => apiCall('/users/profile/me'),

  getUserProfile: (userId: string) => apiCall(`/users/profile/${userId}`),

  editProfile: (profileData: any) =>
    apiCall('/users/profile', { method: 'PUT', body: profileData }),

  changePassword: (passwordData: { oldPassword: string; newPassword: string }) =>
    apiCall('/users/profile/password', { method: 'PUT', body: passwordData }),

  deleteAccount: () => apiCall('/users/profile', { method: 'DELETE' }),

  checkUsername: (username: string) => apiCall(`/users/check/${username}`),
};

// Wardrobe APIs
export const wardrobeAPI = {
  getMyWardrobe: () => apiCall('/wardrobe/my'),

  getItem: (itemId: string) => apiCall(`/wardrobe/${itemId}`),

  addItem: async (formData: FormData) => {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}/wardrobe`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      throw {
        status: res.status,
        message:
          `Server returned non-JSON (status ${res.status}). ` +
          'Check BASE_URL points to your Fitigue API.',
        data: null,
      };
    }
    if (!res.ok) {
      throw {
        status: res.status,
        message: (data.message as string) || (data.error as string) || 'Failed to add item',
        data,
      };
    }
    return data;
  },

  editItem: (itemId: string, itemData: any) =>
    apiCall(`/wardrobe/${itemId}`, { method: 'PUT', body: itemData }),

  updateStatus: (itemId: string, status: string) =>
    apiCall(`/wardrobe/${itemId}/status`, { method: 'PATCH', body: { status } }),

  deleteItem: (itemId: string) =>
    apiCall(`/wardrobe/${itemId}`, { method: 'DELETE' }),
};

// Marketplace APIs
export const marketplaceAPI = {
  getAllListings: (filters?: any) =>
    apiCall('/marketplace' + (filters ? '?filter=' + JSON.stringify(filters) : '')),

  getUserListings: (userId: string) =>
    apiCall(`/marketplace/user/${userId}`),

  getListingDetail: (listingId: string) =>
    apiCall(`/marketplace/${listingId}`),

  postListing: (listingData: any) =>
    apiCall('/marketplace', { method: 'POST', body: listingData }),

  filterListings: (filters: any) =>
    apiCall('/marketplace/filter', { method: 'POST', body: filters }),

  removeListing: (listingId: string) =>
    apiCall(`/marketplace/${listingId}`, { method: 'DELETE' }),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: () => apiCall('/notifications'),

  markAsRead: (notificationId: string) =>
    apiCall(`/notifications/${notificationId}`, { method: 'PATCH' }),

  respondToNotification: (notificationId: string, decision: 'accept' | 'reject') =>
    apiCall(`/notifications/${notificationId}/respond`, { method: 'PATCH', body: { decision } }),
};

// Chat APIs
export const chatAPI = {
  getChats: () => apiCall('/chats'),

  getChatMessages: (chatId: string) =>
    apiCall(`/chats/${chatId}/messages`),

  sendMessage: (chatId: string, message: string) =>
    apiCall(`/chats/${chatId}/messages`, { method: 'POST', body: { message_text: message } }),

  createChat: (userId: string) =>
    apiCall('/chats', { method: 'POST', body: { other_user_id: Number(userId) } }),
};

// Swap APIs
export const swapAPI = {
  getSwaps: () => apiCall('/swaps'),

  createSwap: (swapData: any) =>
    apiCall('/swaps', { method: 'POST', body: swapData }),

  acceptSwap: (swapId: string) =>
    apiCall(`/swaps/${swapId}/accept`, { method: 'POST' }),

  rejectSwap: (swapId: string) =>
    apiCall(`/swaps/${swapId}/reject`, { method: 'POST' }),
};

// Purchase APIs
export const purchaseAPI = {
  getPurchases: () => apiCall('/purchases'),

  makePurchase: (purchaseData: any) =>
    apiCall('/purchases', { method: 'POST', body: purchaseData }),
};

// Rating APIs
export const ratingAPI = {
  addRating: (ratingData: any) =>
    apiCall('/ratings', { method: 'POST', body: ratingData }),

  getUserRatings: (userId: string) =>
    apiCall(`/ratings/user/${userId}`),
};

// Trade History APIs
export const tradeHistoryAPI = {
  getTradeHistory: () =>
    apiCall('/history/trades'),

  getSwapHistory: () =>
    apiCall('/history/swaps'),

  getTradeStatusCount: () =>
    apiCall('/history/trades/status'),

  cancelTrade: (tradeId: string) =>
    apiCall(`/history/trades/${tradeId}`, { method: 'PATCH' }),
};

// Clothing Requests APIs
export const clothingRequestsAPI = {
  getAllRequests: () =>
    apiCall('/clothing-requests'),

  createRequest: (description: string) =>
    apiCall('/clothing-requests', { method: 'POST', body: { description } }),

  deleteRequest: (requestId: string) =>
    apiCall(`/clothing-requests/${requestId}`, { method: 'DELETE' }),
};

export default apiCall;
