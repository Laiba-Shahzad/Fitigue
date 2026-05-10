import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { chatAPI, clothingRequestsAPI } from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

// Type for a single request post
type Post = {
  request_id: string;
  id: string;
  user_id?: number;
  username: string;
  user: string;
  description: string;
  text: string;
  rating_avg?: number;
  created_at?: string;
};

export default function BlogScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [followUpLoadingId, setFollowUpLoadingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requests = await clothingRequestsAPI.getAllRequests();
      setPosts(requests || []);
    } catch (error: any) {
      console.error('Error loading requests:', error);
      Alert.alert('Error', error.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const submitPost = async () => {
    if (!postText.trim()) return;

    try {
      setSubmitting(true);
      await clothingRequestsAPI.createRequest(postText.trim());
      setPostText('');
      setModalVisible(false);
      // Reload requests
      await loadRequests();
      Alert.alert('Success', 'Your request has been posted!');
    } catch (error: any) {
      console.error('Error submitting post:', error);
      Alert.alert('Error', error.message || 'Failed to post request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clothingRequestsAPI.deleteRequest(requestId);
              await loadRequests();
              Alert.alert('Success', 'Request deleted');
            } catch (error: any) {
              console.error('Error deleting request:', error);
              Alert.alert('Error', error.message || 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const handleFollowUp = async (post: Post) => {
    const otherUserId = post.user_id;
    if (!otherUserId) {
      Alert.alert('Error', 'Could not find user for this request.');
      return;
    }

    try {
      setFollowUpLoadingId(post.request_id);
      const result = await chatAPI.createChat(String(otherUserId));
      const conversationId = result?.conversation_id;

      if (!conversationId) {
        throw new Error('Conversation could not be created.');
      }

      router.push(`/chat/${conversationId}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start conversation.');
    } finally {
      setFollowUpLoadingId(null);
    }
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
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="person" size={28} color={Colors.deep} />
        <Text style={styles.title}>Requests</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={32} color={Colors.deep} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requests yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.request_id?.toString() || item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.userHeader}>
                <View>
                  <Text style={styles.userName}>{item.username || item.user}</Text>
                  <Text style={styles.rating}>{getRatingStars(item.rating_avg)}</Text>
                </View>
                {user?.username === item.username && (
                  <TouchableOpacity
                    onPress={() => handleDelete(item.request_id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{item.description || item.text}</Text>
              </View>
              {user?.username !== item.username && (
                <TouchableOpacity
                  style={styles.followUpBtn}
                  onPress={() => handleFollowUp(item)}
                  disabled={followUpLoadingId === item.request_id}
                >
                  {followUpLoadingId === item.request_id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.followUpBtnText}>Follow Up</Text>
                  )}
                </TouchableOpacity>
              )}
              <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
            </View>
          )}
        />
      )}

      {/* Add Post Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Dark background behind modal */}
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Request</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Ionicons name="close" size={26} color={Colors.deep} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              What are you looking for?
            </Text>

            {/* Text input */}
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. I'm looking for a black hoodie size M..."
              placeholderTextColor={Colors.accent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={postText}
              onChangeText={setPostText}
              autoFocus
              editable={!submitting}
              maxLength={500}
            />

            {/* Character count */}
            <Text style={styles.charCount}>{postText.length} / 500</Text>

            {/* Post button */}
            <TouchableOpacity
              style={[styles.postBtn, (!postText.trim() || submitting) && styles.postBtnDisabled]}
              onPress={submitPost}
              disabled={!postText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.postBtnTxt}>Post Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1.5, borderBottomColor: Colors.card,
  },
  title: {
    fontSize: 26, fontWeight: '900', color: Colors.deep, fontStyle: 'italic',
  },
  list: { padding: 16, gap: 22 },
  card: { gap: 6 },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18, fontWeight: '900', color: Colors.accent, fontStyle: 'italic',
  },
  rating: {
    fontSize: 12, color: Colors.deep, fontWeight: '600', marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  bubble: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
  },
  bubbleText: { fontSize: 14, color: Colors.deep, fontWeight: '600', lineHeight: 21 },
  followUpBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: Colors.deep,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followUpBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  timestamp: {
    fontSize: 11, color: Colors.accent, fontWeight: '500', alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16, color: Colors.deep, fontStyle: 'italic',
  },

  // Modal styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',  // semi-transparent dark background
    justifyContent: 'flex-end',           // slides up from bottom
  },
  modalCard: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22, fontWeight: '900',
    color: Colors.deep, fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 15, fontWeight: '700', color: Colors.deep,
  },
  modalInput: {
    backgroundColor: Colors.white,
    borderRadius: 14, padding: 14,
    fontSize: 15, borderWidth: 1.5,
    borderColor: Colors.card, color: Colors.deep,
    height: 130,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12, color: Colors.accent, fontWeight: '600',
  },
  postBtn: {
    backgroundColor: Colors.deep,
    borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  postBtnDisabled: {
    backgroundColor: Colors.card,  // greyed out when empty
  },
  postBtnTxt: {
    color: Colors.white, fontSize: 17, fontWeight: '900',
  },
});