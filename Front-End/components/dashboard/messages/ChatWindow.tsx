"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Send, Smile, Image as ImageIcon, Paperclip, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageInput } from "./MessageInput";
import { mockCooks } from "@/mockData";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";

// Mock data - À remplacer par les vraies données
const mockMessages = {
  "1": [
    {
      id: "1",
      senderId: "cook-1",
      senderName: "Marie Martin",
      text: "Bonjour ! Je serais ravie de cuisiner pour vous ce week-end.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: "2",
      senderId: "client",
      senderName: "Vous",
      text: "Parfait ! Quels sont vos tarifs ?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: "3",
      senderId: "cook-1",
      senderName: "Marie Martin",
      text: "Mon tarif est de 35€ par personne. Je peux préparer un menu sur-mesure selon vos préférences.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: "4",
      senderId: "cook-1",
      senderName: "Marie Martin",
      text: "Avez-vous des allergies ou restrictions alimentaires ?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
    },
  ],
};

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
  const [messages, setMessages] = useState(mockMessages[conversationId as keyof typeof mockMessages] || []);
  const [newMessage, setNewMessage] = useState("");

  // Trouver le cuisinier de la conversation
  const cook = mockCooks.find((c) => c.id === conversationId);

  useEffect(() => {
    // Scroll vers le bas à chaque nouveau message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now().toString(),
      senderId: "client",
      senderName: "Vous",
      text: newMessage,
      timestamp: new Date(),
      isRead: false,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

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
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span>👨‍🍳</span>
                </div>
              )}
            </div>
            {/* Indicateur en ligne */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{cook.name}</h3>
            <p className="text-xs text-muted-foreground">En ligne</p>
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

