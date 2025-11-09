"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

/**
 * Composant pour animer du texte avec effet de frappe
 */
export function AnimatedText({
  text,
  className = "",
  delay = 0,
  duration = 0.05,
}: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const typeText = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeText, duration * 1000);
      } else {
        setIsComplete(true);
      }
    };

    const startTimeout = setTimeout(() => {
      typeText();
    }, delay * 1000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [text, delay, duration]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="inline-block w-0.5 h-6 bg-current ml-1"
        />
      )}
    </motion.span>
  );
}

interface FadeInTextProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Texte avec animation fade-in et slide-up
 */
export function FadeInText({
  children,
  delay = 0,
  className = "",
}: FadeInTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
}

/**
 * Texte avec mots mis en évidence
 */
export function HighlightText({
  text,
  highlight,
  className = "",
}: HighlightTextProps) {
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <motion.span
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-blue-400 font-semibold"
          >
            {part}
          </motion.span>
        ) : (
          part
        )
      )}
    </span>
  );
}

