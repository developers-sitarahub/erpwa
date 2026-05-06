"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  texts: string[];
  delay?: number;
  className?: string;
}

export function Typewriter({
  texts,
  delay = 2000,
  className,
}: TypewriterProps) {
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  const type = useCallback(() => {
    const fullText = texts[index];
    
    if (isDeleting) {
      if (currentText === "") {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
      }
    } else {
      if (currentText === fullText) {
        return;
      }
      setCurrentText(fullText.substring(0, currentText.length + 1));
    }
  }, [currentText, isDeleting, index, texts]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const fullText = texts[index];
    const finishedTyping = !isDeleting && currentText === fullText;
    const finishedDeleting = isDeleting && currentText === "";

    if (finishedTyping) {
      timeout = setTimeout(() => setIsDeleting(true), delay);
    } else if (finishedDeleting) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      }, 500);
    } else {
      const speed = isDeleting ? 40 : 80;
      timeout = setTimeout(type, speed);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, index, texts, delay, type]);

  return (
    <div className={cn("inline-flex relative min-h-[1.2em] items-center", className)}>
      <span className="inline-block relative">
        {currentText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-[3px] h-[0.9em] bg-blue-400 ml-2 align-middle shadow-[0_0_10px_rgba(59,130,246,0.6)]"
        />
      </span>
    </div>
  );
}
