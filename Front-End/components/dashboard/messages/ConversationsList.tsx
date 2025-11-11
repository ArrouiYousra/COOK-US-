"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";

interface ConversationsListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

/**
 * Liste des conversations
 * Pour les clients : affiche les conversations avec les cuisiniers
 * Pour les cuisiniers : affiche les conversations avec les clients
 */
export function ConversationsList({
  selectedConversationId,
  onSelectConversation,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les conversations depuis l'API
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getConversations({ limit: 100 });
        
        // Transformer les conversations pour correspondre au format attendu
        // other_user est l'autre participant (cuisinier pour client, client pour cuisinier)
        const transformedConversations = data.conversations.map((conv: any) => {
          const otherUser = conv.other_user;
          const otherUserName = otherUser?.first_name && otherUser?.last_name
            ? `${otherUser.first_name} ${otherUser.last_name}`
            : otherUser?.first_name || (otherUser?.role === "COOK" ? "Cuisinier" : "Client");

          return {
            id: conv.id,
            otherUserId: otherUser?.id,
            otherUser: {
              id: otherUser?.id,
              name: otherUserName,
              avatarUrl: otherUser?.avatar_url,
              role: otherUser?.role,
            },
            lastMessage: conv.last_message_content || "Aucun message",
            lastMessageTime: conv.last_message_at ? new Date(conv.last_message_at) : new Date(conv.created_at),
            unreadCount: conv.unread_count || 0,
            isOnline: false, // TODO: Implémenter le statut en ligne via WebSocket
            bookingId: conv.booking_id,
          };
        });

        // Trier par date du dernier message (plus récent en premier)
        transformedConversations.sort((a: any, b: any) => 
          b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        );

        setConversations(transformedConversations);
      } catch (err) {
        console.error("Erreur lors du chargement des conversations:", err);
        setError("Impossible de charger les conversations");
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
    
    // Rafraîchir les conversations toutes les 30 secondes
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // Recherche dans le nom de l'autre utilisateur
      if (conv.otherUser?.name?.toLowerCase().includes(query)) return true;
      
      // Recherche dans le dernier message
      if (conv.lastMessage?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [searchQuery, conversations]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    // Aujourd'hui : afficher l'heure (ex: "14:30")
    if (diffInHours < 24 && messageDate.getDate() === now.getDate()) {
      const hours = messageDate.getHours().toString().padStart(2, "0");
      const minutes = messageDate.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    // Hier : afficher "Hier"
    if (messageDate.getDate() === now.getDate() - 1) {
      return "Hier";
    }

    // Moins de 7 jours : afficher le jour (ex: "Lundi")
    if (diffInHours < 168) {
      const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      return days[messageDate.getDay()];
    }

    // Plus ancien : afficher la date (ex: "15/01")
    const day = messageDate.getDate().toString().padStart(2, "0");
    const month = (messageDate.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-cera text-xl font-bold text-foreground mb-4">
          Messages
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une conversation ou un message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des conversations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Aucune conversation trouvée"
                : "Aucune conversation"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation, index) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={() => onSelectConversation(conversation.id)}
                formatTime={formatTime}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Conversation {
  id: string;
  otherUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  bookingId?: string | null;
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  formatTime: (date: Date) => string;
  index: number;
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  formatTime,
  index,
}: ConversationItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
      className={`
        w-full p-4 text-left hover:bg-accent transition-colors
        ${isSelected ? "bg-accent border-l-4 border-blue-600" : ""}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar avec indicateur en ligne */}
        <div className="relative flex-shrink-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            {conversation.otherUser.avatarUrl ? (
              <Image
                src={conversation.otherUser.avatarUrl}
                alt={conversation.otherUser.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-lg">{conversation.otherUser.role === "COOK" ? "👨‍🍳" : "👤"}</span>
              </div>
            )}
          </div>
          {/* Indicateur en ligne/hors ligne */}
          <div
            className={`
              absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background
              ${conversation.isOnline ? "bg-green-500" : "bg-gray-400"}
            `}
          />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={`font-semibold text-sm truncate ${
                isSelected ? "text-foreground" : "text-foreground"
              }`}
            >
              {conversation.otherUser.name}
            </h3>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatTime(conversation.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-sm truncate ${
                conversation.unreadCount > 0
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {conversation.lastMessage}
            </p>
            {conversation.unreadCount > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
