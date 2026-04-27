import { useState, useEffect, useRef } from 'react';
import {
  getChatbox, startConversation, getChatHistory,
  sendMessage, deleteMessage, deleteConversation, getUnreadCount,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user }                        = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv]     = useState(null);   // { conversation_id, other_user }
  const [messages, setMessages]         = useState([]);
  const [newMsg, setNewMsg]             = useState('');
  const [unread, setUnread]             = useState(0);
  const [newChatUserId, setNewChatUserId] = useState('');
  const [showNewChat, setShowNewChat]   = useState(false);
  const [error, setError]               = useState('');
  const messagesEndRef                  = useRef(null);

  // ── On mount: load chatbox + unread count ─────────────────────
  useEffect(() => {
    fetchChatbox();
    fetchUnread();
  }, []);

  // ── Auto-scroll to bottom when messages update ────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Poll messages every 5s when a chat is open ────────────────
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(() => fetchMessages(activeConv.conversation_id), 5000);
    return () => clearInterval(interval);
  }, [activeConv]);

  const fetchChatbox = async () => {
    try { const r = await getChatbox(); setConversations(r.data); }
    catch (err) { console.error(err); }
  };

  const fetchUnread = async () => {
    try { const r = await getUnreadCount(); setUnread(r.data.unread_count); }
    catch (err) { console.error(err); }
  };

  const fetchMessages = async (id) => {
    try { const r = await getChatHistory(id); setMessages(r.data); }
    catch (err) { console.error(err); }
  };

  // ── Open a conversation ───────────────────────────────────────
  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    await fetchMessages(conv.conversation_id);
  };

  // ── Start new chat ────────────────────────────────────────────
  const handleStartChat = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await startConversation({ other_user_id: parseInt(newChatUserId) });
      setNewChatUserId('');
      setShowNewChat(false);
      await fetchChatbox();
      // Open the new conversation immediately
      const convId = res.data.conversation_id;
      setActiveConv({ conversation_id: convId, other_user: `User ${newChatUserId}` });
      await fetchMessages(convId);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start conversation');
    }
  };

  // ── Send message ──────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      await sendMessage(activeConv.conversation_id, { message_text: newMsg });
      setNewMsg('');
      await fetchMessages(activeConv.conversation_id);
      await fetchChatbox();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  // ── Delete a message ──────────────────────────────────────────
  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(activeConv.conversation_id, msgId);
      setMessages((prev) => prev.filter((m) => m.message_id !== msgId));
    } catch (err) {
      setError('Could not delete message');
    }
  };

  // ── Delete conversation ───────────────────────────────────────
  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      if (activeConv?.conversation_id === convId) {
        setActiveConv(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Could not delete conversation');
    }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>

        {/* ── LEFT: Conversation List ────────────────────────── */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>
              💬 Chats
              {unread > 0 && <span style={styles.unreadBadge}>{unread}</span>}
            </h2>
            <button style={styles.newChatBtn} onClick={() => setShowNewChat(!showNewChat)}>
              + New
            </button>
          </div>

          {/* Start new chat input */}
          {showNewChat && (
            <form onSubmit={handleStartChat} style={styles.newChatForm}>
              <input
                style={styles.newChatInput}
                type="number"
                placeholder="Enter User ID to chat"
                value={newChatUserId}
                onChange={(e) => setNewChatUserId(e.target.value)}
                required
              />
              <button style={styles.newChatSubmit} type="submit">Go</button>
            </form>
          )}

          {error && <div style={styles.error}>{error}</div>}

          {/* Conversation items */}
          {conversations.length === 0
            ? <p style={styles.emptyChat}>No conversations yet.</p>
            : conversations.map((c) => (
              <div
                key={c.conversation_id}
                style={{
                  ...styles.convItem,
                  ...(activeConv?.conversation_id === c.conversation_id ? styles.convItemActive : {})
                }}
                onClick={() => openConversation(c)}
              >
                <div style={styles.convAvatar}>
                  {c.other_user_img
                    ? <img src={c.other_user_img} alt="" style={styles.avatarImg} />
                    : <div style={styles.avatarFallback}>{c.other_user?.[0]?.toUpperCase()}</div>
                  }
                </div>
                <div style={styles.convInfo}>
                  <div style={styles.convNameRow}>
                    <span style={styles.convName}>{c.other_user}</span>
                    <span style={styles.convTime}>{formatDate(c.last_message_time)}</span>
                  </div>
                  <p style={styles.lastMsg}>{c.last_message || 'No messages yet'}</p>
                </div>
                <button
                  style={styles.deleteConvBtn}
                  onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c.conversation_id); }}
                  title="Delete conversation"
                >✕</button>
              </div>
            ))
          }
        </div>

        {/* ── RIGHT: Chat Window ─────────────────────────────── */}
        <div style={styles.chatWindow}>
          {!activeConv ? (
            <div style={styles.noChatSelected}>
              <p style={styles.noChatText}>Select a conversation to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderAvatar}>
                  {activeConv.other_user?.[0]?.toUpperCase()}
                </div>
                <span style={styles.chatHeaderName}>{activeConv.other_user}</span>
              </div>

              {/* Messages */}
              <div style={styles.messagesArea}>
                {messages.length === 0
                  ? <p style={styles.noMessages}>No messages yet. Say hello! 👋</p>
                  : messages.map((m) => {
                    const isMine = m.sender_id === user?.user_id;
                    return (
                      <div key={m.message_id} style={{ ...styles.msgWrapper, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        {!isMine && <div style={styles.msgAvatar}>{m.sender_name?.[0]?.toUpperCase()}</div>}
                        <div style={{ ...styles.bubble, ...(isMine ? styles.bubbleMine : styles.bubbleOther) }}>
                          {!isMine && <p style={styles.senderName}>{m.sender_name}</p>}
                          <p style={styles.msgText}>{m.message_text}</p>
                          <div style={styles.msgFooter}>
                            <span style={styles.msgTime}>{formatTime(m.sent_at)}</span>
                            {isMine && (
                              <button
                                style={styles.deleteMsgBtn}
                                onClick={() => handleDeleteMessage(m.message_id)}
                              >🗑</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={styles.inputBar}>
                <input
                  style={styles.msgInput}
                  type="text"
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                />
                <button style={styles.sendBtn} type="submit">Send ➤</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:           { height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif", background: '#f4f4f8' },
  layout:         { display: 'flex', flex: 1, overflow: 'hidden', maxWidth: 1100, margin: '24px auto', width: '100%', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden' },

  // Sidebar
  sidebar:        { width: 320, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 16px', borderBottom: '1px solid #eee' },
  sidebarTitle:   { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  unreadBadge:    { background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  newChatBtn:     { background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 },
  newChatForm:    { display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid #eee' },
  newChatInput:   { flex: 1, padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13 },
  newChatSubmit:  { background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' },
  error:          { background: '#fff0f0', color: '#c0392b', fontSize: 12, padding: '8px 12px', margin: '0 12px 8px' },
  emptyChat:      { color: '#bbb', textAlign: 'center', padding: 32, fontSize: 14 },
  convItem:       { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s', position: 'relative' },
  convItemActive: { background: '#f0f4ff' },
  convAvatar:     { flexShrink: 0 },
  avatarImg:      { width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 42, height: 42, borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  convInfo:       { flex: 1, overflow: 'hidden' },
  convNameRow:    { display: 'flex', justifyContent: 'space-between' },
  convName:       { fontWeight: 700, fontSize: 14, color: '#222' },
  convTime:       { fontSize: 11, color: '#bbb' },
  lastMsg:        { fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0' },
  deleteConvBtn:  { background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14, padding: 4, flexShrink: 0 },

  // Chat window
  chatWindow:     { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  noChatSelected: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  noChatText:     { color: '#bbb', fontSize: 16 },
  chatHeader:     { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #eee', background: '#fff' },
  chatHeaderAvatar:{ width: 38, height: 38, borderRadius: '50%', background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  chatHeaderName: { fontWeight: 700, fontSize: 16, color: '#1a1a2e' },
  messagesArea:   { flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8, background: '#f9f9fb' },
  noMessages:     { color: '#bbb', textAlign: 'center', marginTop: 40 },
  msgWrapper:     { display: 'flex', alignItems: 'flex-end', gap: 8 },
  msgAvatar:      { width: 28, height: 28, borderRadius: '50%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  bubble:         { maxWidth: '68%', borderRadius: 16, padding: '10px 14px' },
  bubbleMine:     { background: '#1a1a2e', color: '#fff', borderBottomRightRadius: 4 },
  bubbleOther:    { background: '#fff', color: '#222', border: '1px solid #eee', borderBottomLeftRadius: 4 },
  senderName:     { fontSize: 11, fontWeight: 700, color: '#888', margin: '0 0 4px' },
  msgText:        { fontSize: 14, margin: 0, lineHeight: 1.5 },
  msgFooter:      { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 4 },
  msgTime:        { fontSize: 10, opacity: 0.6 },
  deleteMsgBtn:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.5, padding: 0 },
  inputBar:       { display: 'flex', gap: 8, padding: '14px 16px', borderTop: '1px solid #eee', background: '#fff' },
  msgInput:       { flex: 1, padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 24, fontSize: 14, outline: 'none' },
  sendBtn:        { background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
};