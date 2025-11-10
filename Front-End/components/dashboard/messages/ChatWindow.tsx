"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageInput } from "./MessageInput";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

/**
 * Fenêtre de discussion principale
 * Affiche les messages et permet l'envoi de nouveaux messages
 */
// Fonction pour formater l'heure du message
function formatMessageTime(timestamp: Date): string {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  // Aujourd'hui : afficher l'heure (ex: "14:30")
  if (isToday(messageDate)) {
    return format(messageDate, "HH:mm");
  }

  // Hier : afficher "Hier 14:30"
  if (isYesterday(messageDate)) {
    return `Hier ${format(messageDate, "HH:mm")}`;
  }

  // Moins de 7 jours : afficher le jour et l'heure (ex: "Lundi 14:30")
  if (diffInHours < 168) {
    return format(messageDate, "EEEE HH:mm", { locale: fr });
  }

  // Plus ancien : afficher la date complète (ex: "15 janvier 14:30")
  return format(messageDate, "d MMMM HH:mm", { locale: fr });
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cook, setCook] = useState<any>(null);
  const { user } = useAuthStore();

  // Charger les messages et les infos du cuisinier
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // D'abord, charger toutes les conversations pour vérifier si conversationId est une conversation existante
        const conversationsData = await apiClient.getConversations({ limit: 100 });
        const existingConv = conversationsData.conversations.find(
          (c: any) => c.id === conversationId || c.other_user?.id === conversationId
        );

        let actualConversationId = conversationId;
        let cookData = null;

        if (existingConv) {
          // C'est une conversation existante
          actualConversationId = existingConv.id;
          if (existingConv.other_user) {
            cookData = {
              id: existingConv.other_user.id,
              name: existingConv.other_user.first_name && existingConv.other_user.last_name
                ? `${existingConv.other_user.first_name} ${existingConv.other_user.last_name}`
                : existingConv.other_user.first_name || "Cuisinier",
              avatarUrl: existingConv.other_user.avatar_url,
            };
          }
        } else {
          // C'est probablement un cookId, charger les infos du cuisinier
          try {
            const cookProfiles = await apiClient.getCookProfiles({ limit: 1000 });
            const cookProfile = cookProfiles.profiles.find(
              (p: any) => p.id === conversationId || p.user?.id === conversationId
            );
            if (cookProfile?.user) {
              cookData = {
                id: cookProfile.user.id,
                name: cookProfile.user.first_name && cookProfile.user.last_name
                  ? `${cookProfile.user.first_name} ${cookProfile.user.last_name}`
                  : cookProfile.user.first_name || "Cuisinier",
                avatarUrl: cookProfile.user.avatar_url,
              };
            }
          } catch (err) {
            console.warn("Impossible de charger le profil du cuisinier:", err);
          }
        }

        if (cookData) {
          setCook(cookData);
        }

        // Essayer de charger les messages si c'est une conversation existante
        if (existingConv) {
          try {
            const data = await apiClient.getMessages(actualConversationId, { limit: 100 });
            
            // Transformer les messages pour correspondre au format attendu
            const transformedMessages = data.messages.map((msg: any) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderName = isOwnMessage 
                ? "Vous" 
                : msg.sender?.first_name && msg.sender?.last_name
                ? `${msg.sender.first_name} ${msg.sender.last_name}`
                : msg.sender?.first_name || "Cuisinier";

              return {
                id: msg.id,
                senderId: msg.sender_id,
                senderName,
                text: msg.content,
                timestamp: new Date(msg.created_at),
                isRead: msg.is_read || false,
                sender: msg.sender,
              };
            });

            // Trier par date (plus ancien en premier)
            transformedMessages.sort((a: any, b: any) => 
              a.timestamp.getTime() - b.timestamp.getTime()
            );

            setMessages(transformedMessages);

            // Marquer comme lu
            await apiClient.markConversationAsRead(actualConversationId);
          } catch (err: any) {
            // Si erreur 404, c'est une nouvelle conversation
            if (err.response?.status !== 404) {
              throw err;
            }
            setMessages([]);
          }
        } else {
          // Nouvelle conversation, pas de messages
          setMessages([]);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des messages:", err);
        setError(err.response?.data?.message || "Impossible de charger les messages");
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId && user) {
      loadMessages();
      
      // Rafraîchir les messages toutes les 10 secondes
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [conversationId, user]);

  useEffect(() => {
    // Scroll vers le bas à chaque nouveau message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !cook || !user || isSending) return;

    const messageText = newMessage;
    setNewMessage(""); // Vider immédiatement pour meilleure UX
    setIsSending(true);
    setError(null);

    try {
      // Envoyer le message via l'API (cela créera automatiquement la conversation si elle n'existe pas)
      const response = await apiClient.sendMessage({
        recipient_id: cook.id,
        content: messageText,
        message_type: "TEXT",
      });

      // Ajouter le message à la liste localement (optimistic update)
      const newMsg = {
        id: response.message.id,
        senderId: user.id,
        senderName: "Vous",
        text: messageText,
        timestamp: new Date(response.message.created_at),
        isRead: false,
      };

      setMessages([...messages, newMsg]);

      // Recharger les messages pour obtenir la conversation créée et les données complètes
      // On attend un peu pour que le backend traite le message
      setTimeout(async () => {
        try {
          const conversationsData = await apiClient.getConversations({ limit: 100 });
          const newConv = conversationsData.conversations.find(
            (c: any) => c.other_user?.id === cook.id
          );
          if (newConv && newConv.id !== conversationId) {
            // La conversation a été créée, on peut recharger les messages
            window.location.href = `/dashboard/client/messages?cook=${cook.id}`;
          }
        } catch (err) {
          console.warn("Erreur lors du rafraîchissement:", err);
        }
      }, 1000);
    } catch (err: any) {
      console.error("Erreur lors de l'envoi du message:", err);
      setError(err.response?.data?.message || "Impossible d'envoyer le message");
      setNewMessage(messageText); // Restaurer le message en cas d'erreur
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl">
        <p className="text-muted-foreground">Conversation introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      {/* Header de la conversation */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {/* Bouton retour (mobile uniquement) */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="relative">
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              {cook.avatarUrl ? (
                <Image
                  src={cook.avatarUrl}
                  alt={cook.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span>👨‍🍳</span>
                </div>
              )}
            </div>
            {/* Indicateur en ligne - TODO: Implémenter via WebSocket */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-400 border-2 border-background" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{cook.name}</h3>
            <p className="text-xs text-muted-foreground">Hors ligne</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === "client";
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                {showAvatar && !isOwnMessage && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {cook.avatarUrl ? (
                      <Image
                        src={cook.avatarUrl}
                        alt={cook.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        👨‍🍳
                      </div>
                    )}
                  </div>
                )}
                {showAvatar && isOwnMessage && <div className="w-8" />}

                {/* Message */}
                <div
                  className={`flex flex-col max-w-[70%] ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  {showAvatar && (
                    <span className="text-xs text-muted-foreground mb-1 px-2">
                      {message.senderName}
                    </span>
                  )}
                  <div
                    className={`
                      rounded-2xl px-4 py-2 relative
                      ${
                        isOwnMessage
                          ? "bg-blue-600 dark:bg-blue-600 text-white"
                          : "bg-accent text-foreground"
                      }
                    `}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {/* Indicateur de lecture (seulement pour les messages envoyés) */}
                    {isOwnMessage && (
                      <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5">
                        {message.isRead ? (
                          <div className="flex items-center gap-0.5">
                            <svg
                              className="w-3 h-3 text-blue-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <svg
                              className="w-3 h-3 text-blue-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        ) : (
                          <svg
                            className="w-3 h-3 text-blue-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground px-2">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {!isOwnMessage && !message.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" title="Non lu" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input de message */}
      <div className="p-4 border-t border-border bg-background">
        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}
