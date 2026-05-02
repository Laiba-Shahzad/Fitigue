import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Modal, TextInput, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

// Type for a single request post
type Post = {
  id: string;
  user: string;
  text: string;
};

const INITIAL_POSTS: Post[] = [
  { id: '1', user: 'Ahmad', text: 'I want a black hoodie, size M. Anyone selling or swapping?' },
  { id: '2', user: 'Esha', text: 'Anyone up for a swap with my red shirt for a white one?' },
  { id: '3', user: 'Ali', text: 'I need a dress pant for a formal event, size 32.' },
  { id: '4', user: 'Sara', text: 'Looking for a winter coat, preferably navy or grey.' },
];

export default function BlogScreen() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [postText, setPostText] = useState('');

  const submitPost = () => {
    if (!postText.trim()) return; // don't post if empty
    const newPost: Post = {
      id: Date.now().toString(),  // unique id using timestamp
      user: 'You',               // hardcoded for now, will come from auth later
      text: postText.trim(),
    };
    setPosts(prev => [newPost, ...prev]); // add to top of list
    setPostText('');
    setModalVisible(false);
  };

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
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.userName}>{item.user}</Text>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followTxt}>Follow up</Text>
            </TouchableOpacity>
          </View>
        )}
      />

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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
            />

            {/* Character count */}
            <Text style={styles.charCount}>{postText.length} / 200</Text>

            {/* Post button */}
            <TouchableOpacity
              style={[styles.postBtn, !postText.trim() && styles.postBtnDisabled]}
              onPress={submitPost}
              disabled={!postText.trim()}
            >
              <Text style={styles.postBtnTxt}>Post Request</Text>
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
  userName: {
    fontSize: 18, fontWeight: '900', color: Colors.accent, fontStyle: 'italic',
  },
  bubble: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
  },
  bubbleText: { fontSize: 14, color: Colors.deep, fontWeight: '600', lineHeight: 21 },
  followBtn: {
    alignSelf: 'flex-end', backgroundColor: Colors.accent,
    borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8,
  },
  followTxt: { color: Colors.white, fontWeight: '800', fontSize: 13 },

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