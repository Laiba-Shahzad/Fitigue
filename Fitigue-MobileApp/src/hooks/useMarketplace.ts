import { useState, useEffect } from 'react';
import { marketplaceAPI } from '../api/apiClient';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  seller: any;
  [key: string]: any;
}

export const useMarketplace = () => {
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async (filters?: any) => {
    setIsLoading(true);
    try {
      const data = await marketplaceAPI.getAllListings(filters);
      setListings(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setIsLoading(false);
    }
  };

  const postListing = async (listingData: any) => {
    try {
      await marketplaceAPI.postListing(listingData);
      await fetchListings(); // Refresh listings
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to post listing');
      return false;
    }
  };

  const removeListing = async (listingId: string) => {
    try {
      await marketplaceAPI.removeListing(listingId);
      setListings(prev => prev.filter(item => item.id !== listingId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove listing');
      return false;
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return {
    listings,
    isLoading,
    error,
    fetchListings,
    postListing,
    removeListing,
  };
};
