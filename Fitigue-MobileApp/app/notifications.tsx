import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { notificationAPI } from '../src/api/apiClient';

interface NotificationItem {
  notification_id: number;
  type: string;
  reference_id: number;
  is_read: boolean;
  created_at: string;
  message?: string;
  actionable?: number;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications();
      setNotifications(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const respond = async (notificationId: number, decision: 'accept' | 'reject') => {
    try {
      setActionLoadingId(notificationId);
      const result = await notificationAPI.respondToNotification(String(notificationId), decision);
      if (result?.conversation_id) {
        router.push(`/chat/${result.conversation_id}`);
      }
      await loadNotifications();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not process action');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.deep} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notification_id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.message}>{item.message || item.type}</Text>
            {Number(item.actionable) === 1 && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={actionLoadingId === item.notification_id}
                  onPress={() => respond(item.notification_id, 'reject')}
                >
                  <Text style={[styles.actionBtnText, styles.rejectBtnText]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  disabled={actionLoadingId === item.notification_id}
                  onPress={() => respond(item.notification_id, 'accept')}
                >
                  {actionLoadingId === item.notification_id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.actionBtnText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: Colors.card },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontWeight: '700', color: Colors.deep },
  title: { fontSize: 26, fontWeight: '900', color: Colors.deep, fontStyle: 'italic', marginTop: 6 },
  list: { padding: 16, gap: 12, paddingBottom: 30 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 12, gap: 10 },
  message: { color: Colors.deep, fontWeight: '700', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5 },
  acceptBtn: { backgroundColor: Colors.deep, borderColor: Colors.deep },
  rejectBtn: { backgroundColor: Colors.bg, borderColor: '#c62828' },
  actionBtnText: { color: Colors.white, fontWeight: '800' },
  rejectBtnText: { color: '#c62828' },
  emptyText: { textAlign: 'center', color: Colors.deep, opacity: 0.75, marginTop: 40 },
});
