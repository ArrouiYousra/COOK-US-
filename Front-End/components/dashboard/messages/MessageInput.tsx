"use client";

import { useState, useRef, useMemo } from "react";
import { Send, Smile, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onImageSelect?: (imageBase64: string) => void;
  selectedImage?: string | null;
}

// Emojis disponibles - défini en dehors du composant pour éviter les recréations
const EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾"] as const;

/**
 * Composant d'input pour envoyer des messages
 * Supporte texte, emoji, et images (optionnel)
 */
export function MessageInput({ value, onChange, onSend, onImageSelect, selectedImage: externalSelectedImage }: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [internalSelectedImage, setInternalSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Utiliser l'image externe si fournie, sinon l'image interne
  const selectedImage = externalSelectedImage !== undefined ? externalSelectedImage : internalSelectedImage;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = reader.result as string;
        if (onImageSelect) {
          onImageSelect(imageBase64);
        } else {
          setInternalSelectedImage(imageBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
  };

  const removeImage = () => {
    if (onImageSelect) {
      onImageSelect("");
    } else {
      setInternalSelectedImage(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {/* Image sélectionnée */}
      {selectedImage && (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
            {/* Utiliser img standard pour les data URLs */}
            <img
              src={selectedImage}
              alt="Image à envoyer"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input et boutons */}
      <div className="flex items-end gap-2">
        {/* Boutons d'action */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded-full"
          >
            <Smile className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Input texte */}
        <Input
          type="text"
          placeholder="Tapez votre message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />

        {/* Bouton envoyer */}
        <Button
          onClick={onSend}
          disabled={!value.trim() && !selectedImage}
          className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white rounded-full"
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Picker d'emoji */}
      {showEmojiPicker && (
        <div className="relative bottom-full left-0 mb-2 bg-card border border-border rounded-xl p-3 shadow-lg max-h-64 overflow-y-auto z-50">
          <div className="grid grid-cols-8 gap-2">
            {EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center hover:bg-accent rounded transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

