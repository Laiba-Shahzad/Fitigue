import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Image, Modal, FlatList,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { marketplaceAPI, purchaseAPI, swapAPI, wardrobeAPI } from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

interface ListingDetail {
  listing_id?: number;
  item_id: number;
  title: string;
  description: string;
  category: string;
  size: string;
  color: string;
  price: number;
  allow_sale: boolean | number;
  allow_swap: boolean | number;
  image_url?: string;
  user_id?: number;
  username: string;
  rating_avg?: number;
  total_trades?: number;
}

interface WardrobeItemOption {
  item_id: number;
  title: string;
}

const categoryToEmoji: Record<string, string> = {
  Top: '👕',
  Bottom: '👖',
  Dress: '👗',
  Shoes: '👠',
  Accessories: '🧣',
  Outerwear: '🧥',
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'buy' | 'swap' | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [myWardrobe, setMyWardrobe] = useState<WardrobeItemOption[]>([]);

  useEffect(() => {
    loadItemDetail();
  }, [id]);

  const loadItemDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const detail = await marketplaceAPI.getListingDetail(String(id));
      setItem(detail);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating?: number) => {
    const rounded = Math.max(0, Math.min(5, Math.round(rating || 0)));
    return rounded;
  };

  const parseFlag = (value: boolean | number | string | undefined) =>
    value === true || value === 1 || value === '1' || value === 'true' || value === 'yes';

  const canBuy = parseFlag(item?.allow_sale);
  const canSwap = parseFlag(item?.allow_swap);
  const isOwnItem = String(user?.username || '').toLowerCase() === String(item?.username || '').toLowerCase();

  const handleBuy = async () => {
    if (!item) return;
    if (isOwnItem) {
      Alert.alert('Not allowed', 'You cannot buy your own item.');
      return;
    }
    try {
      setActionLoading('buy');
      await purchaseAPI.makePurchase({ item_id: item.item_id });
      Alert.alert('Request sent', `Buy request sent to ${item.username}.`);
      router.push('/notifications');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send buy request');
    } finally {
      setActionLoading(null);
    }
  };

  const openSwapModal = async () => {
    if (!item) return;
    if (isOwnItem) {
      Alert.alert('Not allowed', 'You cannot swap with your own item.');
      return;
    }
    try {
      setActionLoading('swap');
      const wardrobe = await wardrobeAPI.getMyWardrobe();
      const options = (wardrobe || [])
        .filter((w: any) => Number(w.item_id) !== Number(item.item_id))
        .map((w: any) => ({ item_id: Number(w.item_id), title: w.title }));
      setMyWardrobe(options);
      setSwapModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load your wardrobe');
    } finally {
      setActionLoading(null);
    }
  };

  const requestSwap = async (offeredItemId: number) => {
    if (!item) return;
    try {
      setActionLoading('swap');
      await swapAPI.createSwap({
        requested_item_id: item.item_id,
        offered_item_id: offeredItemId,
      });
      setSwapModalVisible(false);
      Alert.alert('Request sent', `Swap request sent to ${item.username}.`);
      router.push('/notifications');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send swap request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Item not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={Colors.deep} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.imgBox}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.bigEmoji}>{categoryToEmoji[item.category] || '👔'}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.actionRow}>
          {canSwap && (
            <TouchableOpacity style={styles.actionBtn} onPress={openSwapModal} disabled={!!actionLoading}>
              {actionLoading === 'swap' ? <ActivityIndicator size="small" color={Colors.deep} /> : <Text style={styles.actionTxt}>SWAP</Text>}
            </TouchableOpacity>
          )}
          {canBuy && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleBuy} disabled={!!actionLoading}>
              {actionLoading === 'buy' ? <ActivityIndicator size="small" color={Colors.deep} /> : <Text style={styles.actionTxt}>BUY</Text>}
            </TouchableOpacity>
          )}
          {!canBuy && !canSwap && (
            <View style={styles.noActionWrap}>
              <Text style={styles.noActionText}>This item is currently unavailable for buy/swap.</Text>
            </View>
          )}
        </View>

        <View style={styles.sellerRow}>
          <Ionicons name="person-circle" size={38} color={Colors.accent} />
          <Text style={styles.sellerName}>{item.username?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>

        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < getRatingStars(item.rating_avg) ? 'star' : 'star-outline'}
              size={22}
              color={Colors.deep}
            />
          ))}
          <Text style={styles.tradesTxt}>  ({(item.total_trades || 0).toLocaleString()} TRADES)</Text>
        </View>

        <View style={styles.descBox}>
          <Text style={styles.descTitle}>DESCRIPTION</Text>
          {[
            ['PRICE', `Rs ${item.price}`],
            ['Item Name', item.title],
            ['Description', item.description],
            ['Color', item.color || 'N/A'],
            ['Size', item.size],
            ['Category', item.category],
          ].map(([k, v]) => (
            <Text key={k} style={styles.descLine}>
              <Text style={styles.bold}>{k}: </Text>{v}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
      <Modal
        visible={swapModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSwapModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select your item to offer</Text>
              <TouchableOpacity onPress={() => setSwapModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.deep} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={myWardrobe}
              keyExtractor={(it) => String(it.item_id)}
              ListEmptyComponent={<Text style={styles.emptySwapText}>No available items in your wardrobe.</Text>}
              renderItem={({ item: wardrobeItem }) => (
                <TouchableOpacity style={styles.swapOptionRow} onPress={() => requestSwap(wardrobeItem.item_id)}>
                  <Text style={styles.swapOptionText}>{wardrobeItem.title}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  back: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8,
  },
  backText: { fontSize: 16, color: Colors.deep, fontWeight: '700' },
  imgBox: {
    width: '100%', height: 280,
    backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  bigEmoji: { fontSize: 120 },
  body: { padding: 16, gap: 14 },
  actionRow: { flexDirection: 'row', gap: 14 },
  actionBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accent,
  },
  actionTxt: { fontSize: 18, fontWeight: '900', color: Colors.deep, letterSpacing: 1.5 },
  noActionWrap: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  noActionText: {
    textAlign: 'center',
    color: Colors.deep,
    fontWeight: '700',
    fontSize: 13,
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellerName: { fontSize: 18, fontWeight: '900', color: Colors.deep },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tradesTxt: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  descBox: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 6,
  },
  descTitle: {
    fontSize: 17, fontWeight: '900', color: Colors.deep,
    letterSpacing: 1.5, marginBottom: 6,
  },
  descLine: { fontSize: 14, color: Colors.deep, lineHeight: 22 },
  bold: { fontWeight: '900' },
  emptyText: { fontSize: 16, color: Colors.deep, fontStyle: 'italic' },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },
  backBtnText: { color: Colors.deep, fontWeight: '800' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: '65%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: Colors.deep },
  swapOptionRow: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  swapOptionText: { color: Colors.deep, fontWeight: '700' },
  emptySwapText: { textAlign: 'center', color: Colors.deep, opacity: 0.75, marginTop: 20 },
});