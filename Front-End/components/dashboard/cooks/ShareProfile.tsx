"use client";

import { useState } from "react";
import { Share2, Link2, Facebook, Twitter, Linkedin, Mail, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShareProfileProps {
  cookId: string;
  cookName: string;
}

/**
 * Composant pour partager le profil d'un cuisinier
 * Partage via lien, réseaux sociaux, email
 */
export function ShareProfile({ cookId, cookName }: ShareProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/client/cooks/${cookId}`;
  const shareText = `Découvrez ${cookName} sur Cook US ! Un chef privé exceptionnel pour vos repas à domicile.`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600, height=400");
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600, height=400");
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "width=600, height=400");
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Découvrez ${cookName} sur Cook US`);
    const body = encodeURIComponent(`${shareText}\n\n${profileUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Partager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager le profil de {cookName}</DialogTitle>
          <DialogDescription>
            Partagez ce profil avec vos amis et votre famille
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lien à copier */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Lien du profil</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-accent">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={profileUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {linkCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {linkCopied && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Lien copié dans le presse-papiers !
              </p>
            )}
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Partager sur</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="w-full justify-start"
              >
                <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                onClick={shareOnTwitter}
                className="w-full justify-start"
              >
                <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={shareOnLinkedIn}
                className="w-full justify-start"
              >
                <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={shareByEmail}
                className="w-full justify-start"
              >
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

