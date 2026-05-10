import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useChat } from '../../src/hooks/useChat';

export default function ChatScreen() {
  const router = useRouter();
  const { chats, isLoading, error, fetchChats } = useChat();

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchChats}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>

      <FlatList
        data={chats}
        keyExtractor={item => String(item.conversation_id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No conversations yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.8}
            onPress={() => router.push(`/chat/${item.conversation_id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{item.other_user?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.other_user}</Text>
              <Text style={styles.last} numberOfLines={1}>{item.last_message || 'No messages yet'}</Text>
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
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
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
  emptyText: { fontSize: 14, color: Colors.deep, opacity: 0.75, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: { color: Colors.white, fontWeight: '800' },
});