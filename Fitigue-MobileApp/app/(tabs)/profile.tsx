import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const WARDROBE = ['👕', '👗', '👠', '🧣', '👖', '👞'];
const TRADES = [
  { date: '05/03/2026', price: 1500, item: 'Red Kurta' },
  { date: '10/03/2026', price: 2000, item: 'Golden Dupatta' },
  { date: '20/04/2026', price: 5000, item: 'Embroidered Suit' },
  { date: '05/05/2026', price: 3300, item: 'Floral Dress' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.bell}>
        <Ionicons name="notifications-outline" size={26} color={Colors.deep} />
      </TouchableOpacity>

      <View style={styles.avatar}>
        <Ionicons name="person" size={52} color={Colors.white} />
      </View>
      <Text style={styles.username}>User Name</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.stars}>★★★★★</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Posts</Text>
          <Text style={styles.statNum}>24</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Trades</Text>
          <Text style={styles.statNum}>12</Text>
        </View>
      </View>

      <Text style={styles.section}>Wardrobe</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardrobeScroll}>
        {WARDROBE.map((e, i) => (
          <View key={i} style={styles.wardrobeCard}>
            <Text style={styles.wardrobeEmoji}>{e}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.section}>Trade History</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>
          {['Date', 'Price', 'Item'].map(h => (
            <Text key={h} style={styles.headCell}>{h}</Text>
          ))}
        </View>
        {TRADES.map((r, i) => (
          <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? Colors.bg : '#f5d6d9' }]}>
            <Text style={styles.cell}>{r.date}</Text>
            <Text style={styles.cell}>{r.price}</Text>
            <Text style={styles.cell}>{r.item}</Text>
          </View>
        ))}
      </View>
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
  },
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
});