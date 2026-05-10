import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Colors } from '../../constants/Colors';
import { marketplaceAPI } from '../../src/api/apiClient';

const W = Dimensions.get('window').width;
const CARD = (W - 48) / 2;

interface MarketplaceItem {
  listing_id?: number;
  item_id: string;
  id: string;
  title: string;
  name: string;
  category: string;
  price: number;
  image_url?: string;
}

const categoryToEmoji: Record<string, string> = {
  'Top': '👕',
  'Bottom': '👖',
  'Dress': '👗',
  'Shoes': '👠',
  'Accessories': '🧣',
  'Outerwear': '🧥',
  'default': '👔',
};

export default function HomeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadMarketplaceListings();
    }, [])
  );

  const loadMarketplaceListings = async () => {
    try {
      setLoading(true);
      const listings = await marketplaceAPI.getAllListings();
      setItems(listings || []);
    } catch (error: any) {
      console.error('Error loading marketplace items:', error);
      Alert.alert('Error', error.message || 'Failed to load marketplace items');
    } finally {
      setLoading(false);
    }
  };

  const getEmoji = (category: string) => {
    return categoryToEmoji[category] || categoryToEmoji['default'];
  };

  const renderImage = (item: MarketplaceItem) => {
    if (item.image_url) {
      return (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      );
    }
    return <Text style={styles.emoji}>{getEmoji(item.category)}</Text>;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Fitigue</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items available</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={item => item.item_id?.toString() || item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/item/${item.listing_id || item.item_id || item.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.imgBox}>
                {renderImage(item)}
              </View>
              <Text style={styles.name} numberOfLines={1}>{item.title || item.name}</Text>
              <Text style={styles.price}>Rs {item.price}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20,
    borderBottomWidth: 1.5, borderBottomColor: Colors.card,
  },
  logo: {
    fontSize: 32, fontWeight: '900',
    color: Colors.deep, fontStyle: 'italic',
  },
  grid: { padding: 16, paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    width: CARD, backgroundColor: Colors.card,
    borderRadius: 20, overflow: 'hidden', padding: 10,
  },
  imgBox: {
    width: '100%', height: CARD - 20,
    backgroundColor: Colors.bg, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: { fontSize: 62 },
  name: {
    marginTop: 8, fontSize: 13, fontWeight: '700', color: Colors.deep,
  },
  price: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 2 },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  emptyText: {
    fontSize: 16, color: Colors.deep, fontStyle: 'italic',
  },
});