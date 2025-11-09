"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockCooks } from "@/mockData";

// Fonction pour générer les conversations mock
function getMockConversations() {
  if (!mockCooks || mockCooks.length === 0) return [];
  
  return [
    {
      id: "1",
      cookId: mockCooks[0]?.id || "",
      cook: mockCooks[0],
      lastMessage: "Je serais ravie de cuisiner pour vous ce week-end !",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      cookId: mockCooks[1]?.id || "",
      cook: mockCooks[1],
      lastMessage: "Parfait pour votre dîner romantique !",
      lastMessageTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
      unreadCount: 0,
      isOnline: false,
    },
    {
      id: "3",
      cookId: mockCooks[2]?.id || "",
      cook: mockCooks[2],
      lastMessage: "Je peux préparer un menu sur-mesure selon vos goûts.",
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
      unreadCount: 1,
      isOnline: true,
    },
  ].filter((conv) => conv.cook); // Filtrer les conversations sans cuisinier
}

interface ConversationsListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

/**
 * Liste des conversations avec les cuisiniers
 * Affiche les conversations actives avec état en ligne/hors ligne
 */
export function ConversationsList({
  selectedConversationId,
  onSelectConversation,
}: ConversationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const mockConversations = useMemo(() => getMockConversations(), []);

  // Mock messages pour la recherche dans le contenu
  const mockMessagesByConversation: Record<string, Array<{ text: string }>> = {
    "1": [
      { text: "Bonjour ! Je serais ravie de cuisiner pour vous ce week-end." },
      { text: "Mon tarif est de 35€ par personne." },
      { text: "Avez-vous des allergies ou restrictions alimentaires ?" },
    ],
    "2": [
      { text: "Parfait pour votre dîner romantique !" },
      { text: "Je peux préparer un menu sur-mesure." },
    ],
    "3": [
      { text: "Je peux préparer un menu sur-mesure selon vos goûts." },
    ],
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return mockConversations;
    
    const query = searchQuery.toLowerCase();
    return mockConversations.filter((conv) => {
      // Recherche dans le nom du cuisinier
      if (conv.cook?.name?.toLowerCase().includes(query)) return true;
      
      // Recherche dans le dernier message
      if (conv.lastMessage?.toLowerCase().includes(query)) return true;
      
      // Recherche dans le contenu des messages de la conversation
      const messages = mockMessagesByConversation[conv.id] || [];
      return messages.some((msg) => msg.text.toLowerCase().includes(query));
    });
  }, [searchQuery, mockConversations]);

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
        {filteredConversations.length === 0 ? (
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
  cookId: string;
  cook: typeof mockCooks[0];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
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
            {conversation.cook.avatarUrl ? (
              <Image
                src={conversation.cook.avatarUrl}
                alt={conversation.cook.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-lg">👨‍🍳</span>
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
              {conversation.cook.name}
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

