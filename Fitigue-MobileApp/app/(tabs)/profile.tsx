import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../src/context/AuthContext';
import { wardrobeAPI } from '../../src/api/apiClient';
import { tradeHistoryAPI } from '../../src/api/apiClient';
import { useEffect, useState } from 'react';

interface WardrobeItem {
  item_id: number;
  title: string;
  category: string;
  image_url?: string;
}

interface TradeHistory {
  trade_id: number;
  action: string;
  title: string;
  category: string;
  trade_date: string;
  other_party: string;
  status: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, getProfile, logout, deleteAccount } = useAuth();
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [trades, setTrades] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const accountBusy = logoutLoading || deleteLoading;

  const categoryToEmoji: Record<string, string> = {
    'Top': '👕',
    'Bottom': '👖',
    'Dress': '👗',
    'Shoes': '👠',
    'Accessories': '🧣',
    'Outerwear': '🧥',
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Fetch latest profile data
      await getProfile();
      
      // Fetch wardrobe items
      const wardrobeData = await wardrobeAPI.getMyWardrobe();
      setWardrobe(wardrobeData || []);
      
      // Fetch trade history
      const tradeData = await tradeHistoryAPI.getTradeHistory();
      setTrades(tradeData || []);
    } catch (error: any) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', error.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleDeleteWardrobeItem = (item: WardrobeItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.title}" from your wardrobe?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await wardrobeAPI.deleteItem(item.item_id.toString());
              setWardrobe(wardrobe.filter(w => w.item_id !== item.item_id));
              Alert.alert('Success', 'Item deleted from wardrobe');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLogoutLoading(true);
            await logout();
            router.replace('/login');
          } finally {
            setLogoutLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently removes your account from our servers. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              await deleteAccount();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('Could not delete account', error.message || 'Please try again.');
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.bell} onPress={() => router.push('/notifications')}>
        <Ionicons name="notifications-outline" size={26} color={Colors.deep} />
      </TouchableOpacity>

      <View style={styles.avatar}>
        <Ionicons name="person" size={52} color={Colors.white} />
      </View>
      <Text style={styles.username}>{user?.username || 'User'}</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.stars}>{getRatingStars(user?.rating_avg)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Posts</Text>
          <Text style={styles.statNum}>{user?.total_posts || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Trades</Text>
          <Text style={styles.statNum}>{user?.total_trades || 0}</Text>
        </View>
      </View>

      <Text style={styles.section}>Wardrobe ({wardrobe.length})</Text>
      {wardrobe.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardrobeScroll}>
          {wardrobe.map((item) => (
            <TouchableOpacity
              key={item.item_id}
              style={styles.wardrobeCard}
              onPress={() => handleDeleteWardrobeItem(item)}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.wardrobeImage} resizeMode="cover" />
              ) : (
                <Text style={styles.wardrobeEmoji}>
                  {categoryToEmoji[item.category] || '👕'}
                </Text>
              )}
              <View style={styles.wardrobeCardOverlay}>
                <Ionicons name="trash" size={24} color={Colors.white} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>No items in wardrobe yet</Text>
      )}

      <Text style={styles.section}>Trade History</Text>
      {trades.length > 0 ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            {['Date', 'Action', 'Item'].map(h => (
              <Text key={h} style={styles.headCell}>{h}</Text>
            ))}
          </View>
          {trades.map((r, i) => (
            <View key={r.trade_id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? Colors.bg : '#f5d6d9' }]}>
              <Text style={styles.cell}>{formatDate(r.trade_date)}</Text>
              <Text style={styles.cell}>{r.action}</Text>
              <Text style={[styles.cell, { fontSize: 11 }]}>{r.title}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No trade history yet</Text>
      )}

      <Text style={[styles.section, { marginTop: 8 }]}>Account</Text>
      <TouchableOpacity
        style={[styles.accountBtn, styles.logoutBtn]}
        onPress={handleLogout}
        disabled={accountBusy}
      >
        {logoutLoading ? (
          <ActivityIndicator color={Colors.deep} />
        ) : (
          <Text style={styles.accountBtnText}>Log out</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.accountBtn, styles.deleteBtn]}
        onPress={handleDeleteAccount}
        disabled={accountBusy}
      >
        {deleteLoading ? (
          <ActivityIndicator color="#c62828" />
        ) : (
          <Text style={[styles.accountBtnText, styles.deleteBtnText]}>Delete account</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingTop: 56, alignItems: 'center', paddingBottom: 50 },
  bell: { alignSelf: 'flex-end', marginBottom: 12 },
  avatar: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.deep,
  },
  username: {
    fontSize: 30, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', marginTop: 12, marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 10,
    width: '100%', justifyContent: 'space-evenly', marginBottom: 22,
  },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 13, fontWeight: '700', color: Colors.deep },
  stars: { fontSize: 16, color: Colors.deep },
  statNum: { fontSize: 22, fontWeight: '900', color: Colors.deep },
  divider: { width: 1.5, height: 36, backgroundColor: Colors.accent, opacity: 0.4 },
  section: {
    fontSize: 22, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', alignSelf: 'flex-start', marginBottom: 12,
  },
  wardrobeScroll: { width: '100%', marginBottom: 22 },
  wardrobeCard: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: Colors.card, marginRight: 10,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  wardrobeCardOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wardrobeImage: { width: '100%', height: '100%' },
  wardrobeEmoji: { fontSize: 36 },
  table: {
    width: '100%', borderRadius: 14,
    overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.card,
  },
  tableRow: { flexDirection: 'row' },
  tableHead: { backgroundColor: Colors.accent },
  headCell: {
    flex: 1, padding: 10, color: Colors.white,
    fontWeight: '900', fontSize: 13, textAlign: 'center',
  },
  cell: {
    flex: 1, padding: 10, color: Colors.deep,
    fontSize: 12, textAlign: 'center', fontWeight: '600',
  },
  emptyText: {
    fontSize: 14, color: Colors.deep, textAlign: 'center',
    marginVertical: 16, fontStyle: 'italic',
  },
  accountBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.deep,
  },
  logoutBtn: {
    backgroundColor: Colors.card,
  },
  deleteBtn: {
    backgroundColor: Colors.bg,
    borderColor: '#c62828',
    marginBottom: 24,
  },
  accountBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.deep,
  },
  deleteBtnText: {
    color: '#c62828',
  },
});