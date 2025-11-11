"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils/messageTime";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/authStore";

interface BookingMessagesProps {
  bookingId: string;
  cookId: string;
}

/**
 * Historique des messages liés à une réservation
 */
export function BookingMessages({ bookingId, cookId }: BookingMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  // Charger la conversation et les messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Récupérer toutes les conversations
        const conversationsData = await apiClient.getConversations({ limit: 1000 });
        
        // Trouver la conversation liée à ce booking
        const conversation = conversationsData.conversations.find(
          (conv: any) => conv.booking_id === bookingId
        );

        if (conversation) {
          setConversationId(conversation.id);
          
          // Charger les messages de la conversation
          const messagesData = await apiClient.getMessages(conversation.id, { limit: 50 });
          
          // Transformer les messages pour l'affichage
          const formattedMessages = messagesData.messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_id === user.id 
              ? "Vous" 
              : msg.sender?.first_name && msg.sender?.last_name
              ? `${msg.sender.first_name} ${msg.sender.last_name}`
              : msg.sender?.first_name || "Cuisinier",
            text: msg.content,
            timestamp: new Date(msg.created_at),
          }));

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isExpanded && user?.id) {
      loadMessages();
    }
  }, [isExpanded, bookingId, user?.id]);

  // Toujours afficher le composant (pour permettre l'expansion)
  // Les messages seront chargés quand on expand

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-cera text-lg font-bold text-foreground">
            Messages liés{conversationId ? ` (${messages.length})` : ""}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex gap-3 ${message.senderId === "client" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex flex-col max-w-[70%] ${
                  message.senderId === "client" ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs text-muted-foreground mb-1 px-2">
                  {message.senderName}
                </span>
                <div
                  className={`
                    rounded-2xl px-4 py-2
                    ${
                      message.senderId === "client"
                        ? "bg-blue-600 dark:bg-blue-600 text-white"
                        : "bg-accent text-foreground"
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                  {formatMessageTime(message.timestamp)}
                </span>
              </div>
            </motion.div>
          ))}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aucun message pour cette réservation
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Link href={`/dashboard/client/messages?cook=${cookId}`}>
                  Ouvrir la conversation
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="pt-4 border-t border-border">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Link href={conversationId ? `/dashboard/client/messages?conversation=${conversationId}` : `/dashboard/client/messages?cook=${cookId}`}>
                    Ouvrir la conversation
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

