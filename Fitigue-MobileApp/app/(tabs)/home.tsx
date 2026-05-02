import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

const W = Dimensions.get('window').width;
const CARD = (W - 48) / 2;

const ITEMS = [
  { id: '1', emoji: '👕', name: 'Maroon Jersey', price: 500 },
  { id: '2', emoji: '👖', name: 'Black Trousers', price: 1200 },
  { id: '3', emoji: '🧣', name: 'Plaid Scarf', price: 800 },
  { id: '4', emoji: '👞', name: 'Oxford Shoes', price: 3500 },
  { id: '5', emoji: '👗', name: 'Dark Dress', price: 2500 },
  { id: '6', emoji: '👠', name: 'Black Heels', price: 1800 },
  { id: '7', emoji: '🩱', name: 'Velvet Gown', price: 5000 },
  { id: '8', emoji: '👗', name: 'White Mini Dress', price: 1400 },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Fitigue</Text>
      </View>

      <FlatList
        data={ITEMS}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/item/${item.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.imgBox}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.price}>Rs {item.price}</Text>
          </TouchableOpacity>
        )}
      />
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
  },
  emoji: { fontSize: 62 },
  name: {
    marginTop: 8, fontSize: 13, fontWeight: '700', color: Colors.deep,
  },
  price: { fontSize: 12, color: Colors.accent, fontWeight: '700', marginTop: 2 },
});