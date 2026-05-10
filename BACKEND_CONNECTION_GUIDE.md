# Backend Connection Setup Guide

This guide explains how the Fitigue-MobileApp is now connected to the backend server.

## Overview

The mobile app now has a complete API integration layer that connects to the backend server running on `http://localhost:3000/api` (or `http://10.0.2.2:3000/api` for Android emulator).

## Architecture

### 1. **API Client** (`src/api/apiClient.ts`)
- Centralized API handler using fetch API
- Automatic token injection from AsyncStorage
- Organized API endpoints by feature (auth, wardrobe, marketplace, etc.)
- Error handling with status codes

### 2. **Authentication Context** (`src/context/AuthContext.tsx`)
- Manages user authentication state globally
- Stores JWT token in AsyncStorage
- Auto-login on app launch if token exists
- Provides `useAuth()` hook for accessing auth state

### 3. **Custom Hooks** (`src/hooks/`)
- `useMarketplace.ts` - Fetch and manage marketplace listings
- `useWardrobe.ts` - Manage user's wardrobe items
- `useChat.ts` - Handle chat functionality

## Getting Started

### 1. Install Dependencies

```bash
cd Fitigue-MobileApp
npm install @react-native-async-storage/async-storage
```

### 2. Start Backend Server

```bash
cd backend/project
# Make sure .env is configured with PORT=3000
npm install
npm start
```

### 3. Run Mobile App

For Android emulator:
```bash
npm start
# Then select 'a' for Android
```

For iOS simulator:
```bash
npm start
# Then select 'i' for iOS
```

For physical device on same network:
- Update `BASE_URL` in `src/api/apiClient.ts` to your machine's IP
- Example: `http://192.168.1.5:3000/api`

## API Endpoints Available

### Authentication
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /users/profile/me` - Get current user profile
- `GET /users/profile/:id` - Get other user's profile
- `PUT /users/profile` - Update profile
- `PUT /users/profile/password` - Change password

### Wardrobe
- `GET /wardrobe/my` - Get user's wardrobe items
- `POST /wardrobe` - Add new item
- `GET /wardrobe/:id` - Get specific item
- `PUT /wardrobe/:id` - Edit item
- `PATCH /wardrobe/:id/status` - Update item status
- `DELETE /wardrobe/:id` - Delete item

### Marketplace
- `GET /marketplace` - Get all listings
- `POST /marketplace` - Post new listing
- `GET /marketplace/:id` - Get listing details
- `DELETE /marketplace/:id` - Remove listing
- `POST /marketplace/filter` - Filter listings

### Chat
- `GET /chats` - Get user's chats
- `GET /chats/:id` - Get messages from a chat
- `POST /chats` - Create new chat
- `POST /chats/:id` - Send message

### Other Features
- Notifications (`/api/notifications`)
- Ratings (`/api/ratings`)
- Swaps (`/api/swaps`)
- Purchases (`/api/purchases`)

## Usage Examples

### Login Example
```typescript
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login('username', 'password');
      // Navigate to home after login
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
      <Text>{isLoading ? 'Loading...' : 'Login'}</Text>
    </TouchableOpacity>
  );
}
```

### Marketplace Example
```typescript
import { useMarketplace } from '../src/hooks/useMarketplace';

export default function MarketplaceScreen() {
  const { listings, isLoading, fetchListings } = useMarketplace();

  const handleRefresh = () => {
    fetchListings();
  };

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => <ListingCard item={item} />}
      onRefresh={handleRefresh}
      refreshing={isLoading}
    />
  );
}
```

### Wardrobe Example
```typescript
import { useWardrobe } from '../src/hooks/useWardrobe';

export default function WardrobeScreen() {
  const { items, deleteItem, updateStatus } = useWardrobe();

  const handleDelete = async (itemId) => {
    const success = await deleteItem(itemId);
    if (success) {
      Alert.alert('Success', 'Item deleted');
    }
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <WardrobeCard
          item={item}
          onDelete={() => handleDelete(item.id)}
        />
      )}
    />
  );
}
```

## Configuration

### Backend URL
To change the backend URL, edit `src/api/apiClient.ts`:

```typescript
// For localhost (physical device on same network)
const BASE_URL = 'http://192.168.1.5:3000/api';

// For Android emulator (default)
const BASE_URL = 'http://10.0.2.2:3000/api';

// For iOS simulator
const BASE_URL = 'http://localhost:3000/api';
```

### Authentication Token
Tokens are automatically stored in AsyncStorage. To manually clear:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('authToken');
```

## Error Handling

All API calls throw errors with the following structure:
```typescript
{
  status: number,      // HTTP status code
  message: string,     // Error message
  data: any           // Response data
}
```

Handle errors like this:
```typescript
try {
  await someAPICall();
} catch (error) {
  console.error('Status:', error.status);
  console.error('Message:', error.message);
}
```

## Troubleshooting

### Connection Issues
1. Ensure backend is running on port 3000
2. Check if `BASE_URL` is correct for your environment
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. Check firewall settings

### Authentication Issues
1. Verify token is being stored in AsyncStorage
2. Clear AsyncStorage and try logging in again
3. Check backend's .env file for correct JWT_SECRET

### CORS Issues
Backend should have CORS enabled. If not, add to `fitigue_server.js`:
```javascript
const cors = require('cors');
app.use(cors());
```

## Next Steps

1. Update screen components to use the API hooks
2. Add loading states and error boundaries
3. Implement image upload for wardrobe items
4. Add real-time chat with WebSocket
5. Set up push notifications

## Support

For issues or questions, check:
- Backend logs in terminal
- Mobile app console logs
- Network tab in browser DevTools (for web app)
