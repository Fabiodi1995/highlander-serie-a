import { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useAuth } from "./use-auth";
import { useNotifications } from "./use-notifications";

interface Friend {
  id: number;
  username: string;
  avatar?: string;
  isOnline: boolean;
  level: number;
  lastSeen: Date;
  mutualGames: number;
  winRate: number;
  status: 'pending' | 'accepted' | 'blocked';
}

interface ChatMessage {
  id: string;
  gameId?: number;
  senderId: number;
  senderUsername: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'achievement' | 'game_update';
  isRead: boolean;
  mentions?: number[];
}

interface GameChat {
  gameId: number;
  messages: ChatMessage[];
  participants: Array<{
    userId: number;
    username: string;
    isOnline: boolean;
    role: 'player' | 'admin' | 'spectator';
  }>;
  unreadCount: number;
}

interface SocialContextType {
  friends: Friend[];
  friendRequests: Friend[];
  gameChats: Record<number, GameChat>;
  isConnected: boolean;
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (userId: number) => Promise<void>;
  removeFriend: (userId: number) => Promise<void>;
  sendMessage: (gameId: number, content: string, mentions?: number[]) => void;
  markMessagesAsRead: (gameId: number) => void;
  joinGameChat: (gameId: number) => void;
  leaveGameChat: (gameId: number) => void;
  getOnlineFriends: () => Friend[];
  getTotalUnreadMessages: () => number;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { sendNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const [gameChats, setGameChats] = useState<Record<number, GameChat>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Friends query
  const { data: friends = [] } = useQuery({
    queryKey: ['/api/social/friends'],
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Friend requests query
  const { data: friendRequests = [] } = useQuery({
    queryKey: ['/api/social/friend-requests'],
    enabled: !!user,
    staleTime: 10000, // 10 seconds
  });

  // WebSocket connection for real-time features
  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/social`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        // Send authentication
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('authToken') // Assuming token-based auth
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, [user]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'friend_request':
        queryClient.invalidateQueries({ queryKey: ['/api/social/friend-requests'] });
        sendNotification(
          'Nuova richiesta di amicizia',
          {
            body: `${data.username} ti ha inviato una richiesta di amicizia`,
            tag: 'friend-request',
            data: { url: '/profile?tab=friends' }
          }
        );
        break;

      case 'friend_accepted':
        queryClient.invalidateQueries({ queryKey: ['/api/social/friends'] });
        sendNotification(
          'Richiesta accettata',
          {
            body: `${data.username} ha accettato la tua richiesta di amicizia`,
            tag: 'friend-accepted'
          }
        );
        break;

      case 'friend_online':
        queryClient.setQueryData(['/api/social/friends'], (old: Friend[] = []) =>
          old.map(friend => 
            friend.id === data.userId 
              ? { ...friend, isOnline: true }
              : friend
          )
        );
        break;

      case 'friend_offline':
        queryClient.setQueryData(['/api/social/friends'], (old: Friend[] = []) =>
          old.map(friend => 
            friend.id === data.userId 
              ? { ...friend, isOnline: false, lastSeen: new Date() }
              : friend
          )
        );
        break;

      case 'chat_message':
        handleNewChatMessage(data.message);
        break;

      case 'game_update':
        handleGameUpdate(data);
        break;
    }
  };

  const handleNewChatMessage = (message: ChatMessage) => {
    const gameId = message.gameId;
    if (!gameId) return;

    setGameChats(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        messages: [...(prev[gameId]?.messages || []), message],
        unreadCount: (prev[gameId]?.unreadCount || 0) + 1
      }
    }));

    // Send notification if not in current chat
    if (message.senderId !== user?.id) {
      sendNotification(
        `Nuovo messaggio da ${message.senderUsername}`,
        {
          body: message.content.length > 50 
            ? message.content.substring(0, 50) + '...'
            : message.content,
          tag: `chat-${gameId}`,
          data: { url: `/game/${gameId}?tab=chat` }
        }
      );
    }
  };

  const handleGameUpdate = (data: any) => {
    // Handle game-related updates like eliminations, new rounds, etc.
    const { gameId, type, message } = data;
    
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      gameId,
      senderId: 0,
      senderUsername: 'Sistema',
      content: message,
      timestamp: new Date(),
      type: 'system',
      isRead: false
    };

    setGameChats(prev => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        messages: [...(prev[gameId]?.messages || []), systemMessage]
      }
    }));
  };

  // Mutations
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch('/api/social/friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!response.ok) throw new Error('Failed to send friend request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
    }
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/social/friend-request/${userId}/accept`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to accept friend request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
    }
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/social/friends/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove friend');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
    }
  });

  const sendMessage = (gameId: number, content: string, mentions?: number[]) => {
    if (!wsRef.current || !isConnected) return;

    const message = {
      type: 'chat_message',
      gameId,
      content: content.trim(),
      mentions,
      timestamp: new Date().toISOString()
    };

    wsRef.current.send(JSON.stringify(message));
  };

  const markMessagesAsRead = async (gameId: number) => {
    try {
      await fetch(`/api/social/games/${gameId}/messages/read`, {
        method: 'POST'
      });

      setGameChats(prev => ({
        ...prev,
        [gameId]: {
          ...prev[gameId],
          unreadCount: 0,
          messages: prev[gameId]?.messages.map(msg => ({ ...msg, isRead: true })) || []
        }
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const joinGameChat = (gameId: number) => {
    if (!wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'join_game_chat',
      gameId
    }));

    // Initialize chat if not exists
    if (!gameChats[gameId]) {
      setGameChats(prev => ({
        ...prev,
        [gameId]: {
          gameId,
          messages: [],
          participants: [],
          unreadCount: 0
        }
      }));
    }
  };

  const leaveGameChat = (gameId: number) => {
    if (!wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'leave_game_chat',
      gameId
    }));
  };

  const getOnlineFriends = () => {
    return friends.filter(friend => friend.isOnline);
  };

  const getTotalUnreadMessages = () => {
    return Object.values(gameChats).reduce((total, chat) => total + chat.unreadCount, 0);
  };

  return (
    <SocialContext.Provider
      value={{
        friends,
        friendRequests,
        gameChats,
        isConnected,
        sendFriendRequest: sendFriendRequestMutation.mutateAsync,
        acceptFriendRequest: acceptFriendRequestMutation.mutateAsync,
        removeFriend: removeFriendMutation.mutateAsync,
        sendMessage,
        markMessagesAsRead,
        joinGameChat,
        leaveGameChat,
        getOnlineFriends,
        getTotalUnreadMessages
      }}
    >
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error("useSocial must be used within a SocialProvider");
  }
  return context;
}

// Chat utilities
export const chatUtils = {
  formatMessage: (content: string, mentions: number[] = []) => {
    // Simple mention formatting
    let formatted = content;
    mentions.forEach(userId => {
      formatted = formatted.replace(
        new RegExp(`@${userId}`, 'g'),
        `<span class="mention">@user${userId}</span>`
      );
    });
    return formatted;
  },

  extractMentions: (content: string): number[] => {
    const mentionRegex = /@(\d+)/g;
    const mentions: number[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(parseInt(match[1]));
    }
    
    return mentions;
  },

  isValidMessage: (content: string): boolean => {
    return content.trim().length > 0 && content.trim().length <= 500;
  }
};