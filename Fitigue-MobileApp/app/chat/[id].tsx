import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useChat } from '../../src/hooks/useChat';
import { useAuth } from '../../src/context/AuthContext';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const chatId = String(id || '');

  const { messages, isLoading, sendMessage, otherUser } = useChat(chatId);

  const myUserId = useMemo(() => Number(user?.user_id || user?.id || 0), [user]);

  const handleSend = async () => {
    if (!text.trim() || !chatId) return;
    try {
      setSending(true);
      await sendMessage(chatId, text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.deep} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{otherUser ? otherUser : `Conversation #${chatId}`}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item.message_id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const mine = Number(item.sender_id) === myUserId;
            return (
              <View style={[styles.messageWrap, mine ? styles.messageRight : styles.messageLeft]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.message_text}</Text>
                </View>
                <Text style={styles.meta}>{item.sender_name}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.accent}
          value={text}
          onChangeText={setText}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="send" size={16} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.card,
    gap: 6,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: Colors.deep, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '900', color: Colors.deep },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1 },
  listContent: { padding: 14, gap: 10, paddingBottom: 20 },
  messageWrap: { maxWidth: '82%' },
  messageLeft: { alignSelf: 'flex-start' },
  messageRight: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleMine: { backgroundColor: Colors.deep },
  bubbleOther: { backgroundColor: Colors.card },
  messageText: { color: Colors.deep, fontSize: 14, fontWeight: '600' },
  messageTextMine: { color: Colors.white },
  meta: { marginTop: 3, fontSize: 10, color: Colors.accent, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: Colors.deep, opacity: 0.7, marginTop: 30 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1.5,
    borderTopColor: Colors.card,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.card,
    color: Colors.deep,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
});
