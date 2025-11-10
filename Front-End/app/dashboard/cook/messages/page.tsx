"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ConversationsList } from "@/components/dashboard/messages/ConversationsList";
import { ChatWindow } from "@/components/dashboard/messages/ChatWindow";

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationParam = searchParams.get("conversation");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    conversationParam || null
  );

  // Synchroniser avec le paramètre d'URL
  useEffect(() => {
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [conversationParam]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    router.push(`/dashboard/cook/messages?conversation=${conversationId}`);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex border border-border rounded-xl overflow-hidden bg-card">
      {/* Liste des conversations */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Fenêtre de chat */}
      <div className="flex-1 hidden md:flex">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => {
              setSelectedConversationId(null);
              router.push("/dashboard/cook/messages");
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-card border-l border-border">
            <div className="text-center">
              <p className="text-muted-foreground">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Vue mobile : afficher le chat si une conversation est sélectionnée */}
      {selectedConversationId && (
        <div className="md:hidden absolute inset-0 bg-card z-10">
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => {
              setSelectedConversationId(null);
              router.push("/dashboard/cook/messages");
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Page "Messages"
 * Messagerie avec les clients
 */
export default function CookMessagesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-trebuchet text-3xl lg:text-4xl font-bold text-foreground mb-2">
          Messages
        </h1>
        <p className="text-muted-foreground">
          Communiquez avec vos clients
        </p>
      </div>

      {/* Contenu */}
      <Suspense fallback={<div>Chargement...</div>}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}

