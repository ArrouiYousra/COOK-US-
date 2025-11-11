"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationsList } from "@/components/dashboard/messages/ConversationsList";
import { ChatWindow } from "@/components/dashboard/messages/ChatWindow";

function MessagesContent() {
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Initialiser depuis les paramètres d'URL
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    const cookId = searchParams.get("cook");
    
    // Priorité : conversation > cook
    if (conversationId) {
      setSelectedConversationId(conversationId);
    } else if (cookId) {
      // Si c'est un cookId, on le passe à ChatWindow qui gérera la création de conversation
      setSelectedConversationId(cookId);
    }
  }, [searchParams]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Liste des conversations - Sidebar gauche */}
      {/* Sur mobile : cachée si une conversation est sélectionnée */}
      <div
        className={`w-full lg:w-80 flex-shrink-0 border-r border-border ${
          selectedConversationId ? "hidden lg:block" : "block"
        }`}
      >
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>

      {/* Fenêtre de discussion principale */}
      {/* Sur mobile : affichée uniquement si une conversation est sélectionnée */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          selectedConversationId ? "block" : "hidden lg:flex"
        }`}
      >
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl">
            <div className="text-center">
              <p className="text-muted-foreground text-lg mb-2">
                Sélectionnez une conversation
              </p>
              <p className="text-sm text-muted-foreground">
                Choisissez un cuisinier dans la liste pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Page "Messagerie"
 * Interface de messagerie avec liste des conversations et fenêtre de discussion
 */
export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

