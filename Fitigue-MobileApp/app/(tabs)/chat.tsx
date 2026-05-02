import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const CHATS = [
  { id: '1', name: 'Emma', last: 'Sure! I can do the swap tomorrow.' },
  { id: '2', name: 'Rhys', last: 'What size is the jacket?' },
  { id: '3', name: 'Laura', last: 'My experience with Fitigue has been great!' },
];

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>

      <FlatList
        data={CHATS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.8}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{item.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.last} numberOfLines={1}>{item.last}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 56 },
  title: {
    fontSize: 30, fontWeight: '900', color: Colors.deep,
    fontStyle: 'italic', paddingHorizontal: 20, marginBottom: 14,
  },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 16, padding: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: Colors.white, fontSize: 22, fontWeight: '900' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: Colors.deep },
  last: { fontSize: 13, color: Colors.deep, opacity: 0.65, marginTop: 2 },
});