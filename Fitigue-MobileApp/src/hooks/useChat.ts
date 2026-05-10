import { useState, useEffect } from 'react';
import { chatAPI } from '../api/apiClient';

interface Chat {
  conversation_id: number;
  other_user: string;
  last_message: string | null;
  last_message_time: string | null;
  [key: string]: any;
}

interface Message {
  message_id: number;
  sender_id: number;
  sender_name: string;
  message_text: string;
  sent_at: string;
  [key: string]: any;
}

export const useChat = (chatId?: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const data = await chatAPI.getChats();
      setChats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await chatAPI.getChatMessages(id);
      setMessages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatInfo = async (id: string) => {
    try {
      const data = await chatAPI.getChats() as Chat[];
      const currentChat = data.find((chat) => String(chat.conversation_id) === String(id));
      setOtherUser(currentChat?.other_user || null);
    } catch (err: any) {
      console.warn('Failed to fetch chat info', err);
      setOtherUser(null);
    }
  };

  const sendMessage = async (id: string, message: string) => {
    try {
      await chatAPI.sendMessage(id, message);
      await fetchMessages(id); // Refresh messages
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      return false;
    }
  };

  const createChat = async (userId: string) => {
    try {
      const newChat = await chatAPI.createChat(userId);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err: any) {
      setError(err.message || 'Failed to create chat');
      return null;
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
      fetchChatInfo(chatId);
    } else {
      fetchChats();
      setOtherUser(null);
    }
  }, [chatId]);

  return {
    chats,
    messages,
    otherUser,
    isLoading,
    error,
    fetchChats,
    fetchMessages,
    sendMessage,
    createChat,
  };
};
