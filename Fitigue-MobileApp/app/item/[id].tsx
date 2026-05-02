import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const ITEM_DATA: Record<string, any> = {
  '1': { emoji: '👕', name: 'Maroon Jersey', price: 500, seller: 'Emma', rating: 4, trades: 12000, description: 'Maroon and white polo t-shirt, good condition.', color: 'Maroon', size: 'S', category: 'Shirt', options: 'Sell or Swap' },
  '2': { emoji: '👖', name: 'Black Trousers', price: 1200, seller: 'Rhys', rating: 5, trades: 3400, description: 'Slim fit black trousers, barely worn.', color: 'Black', size: 'M', category: 'Pants', options: 'Sell' },
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const item = ITEM_DATA[id as string] ?? ITEM_DATA['1'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color={Colors.deep} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.imgBox}>
        <Text style={styles.bigEmoji}>{item.emoji}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionTxt}>SWAP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionTxt}>BUY</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sellerRow}>
          <Ionicons name="person-circle" size={38} color={Colors.accent} />
          <Text style={styles.sellerName}>{item.seller.toUpperCase()}</Text>
        </View>

        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < item.rating ? 'star' : 'star-outline'}
              size={22}
              color={Colors.deep}
            />
          ))}
          <Text style={styles.tradesTxt}>  ({item.trades.toLocaleString()} TRADES)</Text>
        </View>

        <View style={styles.descBox}>
          <Text style={styles.descTitle}>DESCRIPTION</Text>
          {[
            ['PRICE', `Rs ${item.price}`],
            ['Item Name', item.name],
            ['Description', item.description],
            ['Color', item.color],
            ['Size', item.size],
            ['Category', item.category],
            ['Options', item.options],
          ].map(([k, v]) => (
            <Text key={k} style={styles.descLine}>
              <Text style={styles.bold}>{k}: </Text>{v}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  back: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8,
  },
  backText: { fontSize: 16, color: Colors.deep, fontWeight: '700' },
  imgBox: {
    width: '100%', height: 280,
    backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center',
  },
  bigEmoji: { fontSize: 120 },
  body: { padding: 16, gap: 14 },
  actionRow: { flexDirection: 'row', gap: 14 },
  actionBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.accent,
  },
  actionTxt: { fontSize: 18, fontWeight: '900', color: Colors.deep, letterSpacing: 1.5 },
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
});