# Quick Reference - Using Backend APIs in Mobile App

## Import What You Need

```typescript
// Use authentication context
import { useAuth } from '../src/context/AuthContext';

// Use specific feature hooks
import { useMarketplace } from '../src/hooks/useMarketplace';
import { useWardrobe } from '../src/hooks/useWardrobe';
import { useChat } from '../src/hooks/useChat';

// Use API directly (advanced)
import { authAPI, marketplaceAPI, wardrobeAPI } from '../src/api/apiClient';
```

## Authentication Flow

### Login
```typescript
const { login, isLoading } = useAuth();

await login('username', 'password');
// User data and token are automatically stored
```

### Sign Up
```typescript
const { register, isLoading } = useAuth();

await register('username', 'email@example.com', 'password');
// User is automatically logged in after registration
```

### Get Current User
```typescript
const { user, token } = useAuth();
// user: User object or null
// token: JWT token or null
```

### Logout
```typescript
const { logout } = useAuth();
await logout();
```

## Marketplace

### Fetch All Listings
```typescript
const { listings, isLoading, error, fetchListings } = useMarketplace();

// listings is automatically fetched on mount
// To refresh: await fetchListings();
```

### Post New Listing
```typescript
const { postListing } = useMarketplace();

const success = await postListing({
  title: 'Red T-Shirt',
  description: 'Size M, like new',
  price: 15,
  category: 'clothing',
});
```

### Remove Listing
```typescript
const { removeListing } = useMarketplace();

const success = await removeListing(listingId);
```

## Wardrobe

### Get My Wardrobe Items
```typescript
const { items, isLoading, error, fetchWardrobe } = useWardrobe();
// Items automatically fetched on mount
```

### Add Item
```typescript
const { addItem } = useWardrobe();

const formData = new FormData();
formData.append('title', 'Blue Jeans');
formData.append('description', 'Size 32');
formData.append('size', '32');
formData.append('color', 'blue');
formData.append('condition', 'good');
formData.append('image', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'jeans.jpg',
});

const success = await addItem(formData);
```

### Delete Item
```typescript
const { deleteItem } = useWardrobe();

const success = await deleteItem(itemId);
```

### Update Item Status
```typescript
const { updateStatus } = useWardrobe();

const success = await updateStatus(itemId, 'listed'); // or 'available', 'sold'
```

## Chat

### Get All Chats
```typescript
const { chats, isLoading, fetchChats } = useChat();
// Chats automatically fetched on mount
```

### Get Chat Messages
```typescript
const { messages, fetchMessages } = useChat(chatId);
// Messages automatically fetched when chatId changes
```

### Send Message
```typescript
const { sendMessage } = useChat();

const success = await sendMessage(chatId, 'Hello!');
```

### Create New Chat
```typescript
const { createChat } = useChat();

const newChat = await createChat(userId);
```

## Error Handling

### In Hooks
```typescript
const { items, error } = useWardrobe();

if (error) {
  <Text>Error: {error}</Text>
}
```

### In API Calls
```typescript
try {
  await login('username', 'password');
} catch (error) {
  Alert.alert('Login Failed', error.message);
}
```

## Loading States

All hooks provide `isLoading` state:

```typescript
const { isLoading } = useMarketplace();

{isLoading && <ActivityIndicator />}
{!isLoading && <ListOfItems />}
```

## Direct API Access (Advanced)

If you need direct API access:

```typescript
import { wardrobeAPI, marketplaceAPI, authAPI } from '../src/api/apiClient';

// Any of these can be called directly
const profile = await authAPI.getProfile();
const listings = await marketplaceAPI.getAllListings();
const items = await wardrobeAPI.getMyWardrobe();
```

## Tips

1. Always wrap API calls in try-catch
2. Check `isLoading` before rendering lists
3. Use error states to show user feedback
4. Implement pull-to-refresh with `fetchChats()`, `fetchListings()`, etc.
5. Token is automatic - just use the hooks!
