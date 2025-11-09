"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMessageTime } from "@/lib/utils/messageTime";

interface BookingMessagesProps {
  bookingId: string;
  cookId: string;
}

// Mock data - À remplacer par les vraies données
const mockBookingMessages = [
  {
    id: "1",
    senderId: "cook-1",
    senderName: "Marie Martin",
    text: "Bonjour ! Je confirme ma disponibilité pour le 15 janvier à 19h.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    senderId: "client",
    senderName: "Vous",
    text: "Parfait, merci ! J'ai hâte de goûter vos plats.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

/**
 * Historique des messages liés à une réservation
 */
export function BookingMessages({ bookingId, cookId }: BookingMessagesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const messages = mockBookingMessages;

  if (messages.length === 0) {
    return null;
  }

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
            Messages liés ({messages.length})
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
          <div className="pt-4 border-t border-border">
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
        </div>
      )}
    </motion.div>
  );
}

