import { useState, useEffect } from 'react';
import { wardrobeAPI } from '../api/apiClient';

interface WardrobeItem {
  id: string;
  title: string;
  description: string;
  size: string;
  color: string;
  condition: string;
  image: string;
  status: string;
  [key: string]: any;
}

export const useWardrobe = () => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWardrobe = async () => {
    setIsLoading(true);
    try {
      const data = await wardrobeAPI.getMyWardrobe();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wardrobe');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (itemData: FormData) => {
    try {
      await wardrobeAPI.addItem(itemData);
      await fetchWardrobe(); // Refresh wardrobe
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
      return false;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await wardrobeAPI.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      return false;
    }
  };

  const updateStatus = async (itemId: string, status: string) => {
    try {
      await wardrobeAPI.updateStatus(itemId, status);
      setItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, status } : item))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update item status');
      return false;
    }
  };

  useEffect(() => {
    fetchWardrobe();
  }, []);

  return {
    items,
    isLoading,
    error,
    fetchWardrobe,
    addItem,
    deleteItem,
    updateStatus,
  };
};
