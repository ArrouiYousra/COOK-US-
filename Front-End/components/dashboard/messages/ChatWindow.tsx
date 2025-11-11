"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [actualConversationId, setActualConversationId] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Charger les messages et les infos de l'autre utilisateur
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

        let convId = conversationId;
        let otherUserData = null;

        if (existingConv) {
          // C'est une conversation existante
          convId = existingConv.id;
          setActualConversationId(convId);
          if (existingConv.other_user) {
            // other_user est l'autre participant (cuisinier pour client, client pour cuisinier)
            otherUserData = {
              id: existingConv.other_user.id,
              name: existingConv.other_user.first_name && existingConv.other_user.last_name
                ? `${existingConv.other_user.first_name} ${existingConv.other_user.last_name}`
                : existingConv.other_user.first_name || (existingConv.other_user.role === "COOK" ? "Cuisinier" : "Client"),
              avatarUrl: existingConv.other_user.avatar_url,
              role: existingConv.other_user.role,
            };
          }
        } else {
          // C'est probablement un userId, charger les infos de l'utilisateur
          try {
            const userProfile = await apiClient.getUserProfile(conversationId);
            if (userProfile?.user) {
              otherUserData = {
                id: userProfile.user.id,
                name: userProfile.user.first_name && userProfile.user.last_name
                  ? `${userProfile.user.first_name} ${userProfile.user.last_name}`
                  : userProfile.user.first_name || (userProfile.user.role === "COOK" ? "Cuisinier" : "Client"),
                avatarUrl: userProfile.user.avatar_url,
                role: userProfile.user.role,
              };
            }
          } catch (err) {
            console.warn("Impossible de charger le profil de l'utilisateur:", err);
          }
        }

        if (otherUserData) {
          setOtherUser(otherUserData);
        }

        // Essayer de charger les messages si c'est une conversation existante
        if (existingConv && convId) {
          try {
            const data = await apiClient.getMessages(convId, { limit: 100 });
            
            // Transformer les messages pour correspondre au format attendu
            const transformedMessages = data.messages.map((msg: any) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderName = isOwnMessage 
                ? "Vous" 
                : msg.sender?.first_name && msg.sender?.last_name
                ? `${msg.sender.first_name} ${msg.sender.last_name}`
                : msg.sender?.first_name || "Client";

              return {
                id: msg.id,
                senderId: msg.sender_id,
                senderName,
                text: msg.content,
                timestamp: new Date(msg.created_at),
                isRead: msg.is_read || false,
                sender: msg.sender,
                attachmentUrl: msg.attachment_url,
                messageType: msg.type || "TEXT",
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

    if (conversationId && user?.id) {
      loadMessages();
      
      // Rafraîchir les messages toutes les 10 secondes
      const interval = setInterval(loadMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    // Scroll vers le bas à chaque nouveau message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !otherUser || !user?.id || isSending) return;

    const messageText = newMessage;
    const imageToSend = selectedImage;
    setNewMessage(""); // Vider immédiatement pour meilleure UX
    setSelectedImage(null); // Vider l'image
    setIsSending(true);
    setError(null);

    try {
      let attachmentUrl: string | undefined;
      
      // Uploader l'image si elle existe
      if (imageToSend) {
        try {
          const uploadResponse = await apiClient.uploadMessageImage(imageToSend);
          attachmentUrl = uploadResponse.image_url;
        } catch (uploadError: any) {
          console.error("Erreur lors de l'upload de l'image:", uploadError);
          setError(uploadError.response?.data?.message || "Erreur lors de l'upload de l'image");
          setNewMessage(messageText); // Restaurer le message
          setSelectedImage(imageToSend); // Restaurer l'image
          setIsSending(false);
          return;
        }
      }

      // Envoyer le message via l'API (cela créera automatiquement la conversation si elle n'existe pas)
      const response = await apiClient.sendMessage({
        recipient_id: otherUser.id,
        content: messageText || (attachmentUrl ? "📷 Image" : ""),
        message_type: attachmentUrl ? "IMAGE" : "TEXT",
        attachment_url: attachmentUrl,
      });

      // Ajouter le message à la liste localement (optimistic update)
      const newMsg = {
        id: response.message.id,
        senderId: user.id,
        senderName: "Vous",
        text: messageText || (attachmentUrl ? "📷 Image" : ""),
        timestamp: new Date(response.message.created_at),
        isRead: false,
        attachmentUrl: attachmentUrl,
        messageType: attachmentUrl ? "IMAGE" : "TEXT",
      };

      setMessages([...messages, newMsg]);

      // Recharger les messages pour obtenir la conversation créée et les données complètes
      // On attend un peu pour que le backend traite le message
      setTimeout(async () => {
        try {
          const conversationsData = await apiClient.getConversations({ limit: 100 });
          const newConv = conversationsData.conversations.find(
            (c: any) => c.other_user?.id === otherUser.id
          );
          if (newConv && newConv.id !== actualConversationId) {
            // La conversation a été créée, mettre à jour l'ID
            setActualConversationId(newConv.id);
            // Recharger la page pour mettre à jour l'URL si nécessaire
            if (conversationId !== newConv.id) {
              router.push(`/dashboard/client/messages?conversation=${newConv.id}`);
            }
          }
          
          const convIdToUse = actualConversationId || newConv?.id || conversationId;
          if (convIdToUse) {
            // Recharger les messages de la conversation actuelle
            const updatedData = await apiClient.getMessages(convIdToUse, { limit: 100 });
            const updatedMessages = updatedData.messages.map((msg: any) => {
              const isOwnMessage = msg.sender_id === user?.id;
              const senderName = isOwnMessage 
                ? "Vous" 
                : msg.sender?.first_name && msg.sender?.last_name
                ? `${msg.sender.first_name} ${msg.sender.last_name}`
                : msg.sender?.first_name || "Client";

              return {
                id: msg.id,
                senderId: msg.sender_id,
                senderName,
                text: msg.content,
                timestamp: new Date(msg.created_at),
                isRead: msg.is_read || false,
                sender: msg.sender,
                attachmentUrl: msg.attachment_url,
                messageType: msg.type || "TEXT",
              };
            });
            updatedMessages.sort((a: any, b: any) => 
              a.timestamp.getTime() - b.timestamp.getTime()
            );
            setMessages(updatedMessages);
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

  if (!client) {
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
              {otherUser?.avatarUrl ? (
                <Image
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span>👤</span>
                </div>
              )}
            </div>
            {/* Indicateur en ligne - TODO: Implémenter via WebSocket */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-400 border-2 border-background" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{otherUser?.name || "Utilisateur"}</h3>
            <p className="text-xs text-muted-foreground">Hors ligne</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwnMessage = message.senderId === user?.id;
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
                    {otherUser?.avatarUrl ? (
                      <Image
                        src={otherUser.avatarUrl}
                        alt={otherUser.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        👤
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
                    {/* Afficher l'image si elle existe */}
                    {message.attachmentUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden max-w-full">
                        <img
                          src={message.attachmentUrl}
                          alt="Image partagée"
                          className="max-w-full h-auto rounded-lg"
                          style={{ maxHeight: "300px" }}
                        />
                      </div>
                    )}
                    {/* Afficher le texte si présent */}
                    {message.text && message.text.trim() && (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    )}
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
          onImageSelect={setSelectedImage}
          selectedImage={selectedImage}
        />
      </div>
    </div>
  );
}
