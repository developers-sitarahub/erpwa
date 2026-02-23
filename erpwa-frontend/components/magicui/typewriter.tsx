"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const fullText = texts[index];

    if (!isDeleting && currentText === fullText) {
      // Pause at the end of typing
      timeout = setTimeout(() => setIsDeleting(true), delay);
    } else if (isDeleting && currentText === "") {
      // Move to next word after deleting - wrapped in timeout to avoid state change during render pass issues
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      }, 100);
    } else {
      // Type or delete characters
      const speed = isDeleting ? 50 : 100; // Deleting is faster than typing

      timeout = setTimeout(() => {
        setCurrentText(
          fullText.substring(0, currentText.length + (isDeleting ? -1 : 1)),
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, index, texts, delay]);

  return (
    <div className={cn("inline-flex relative", className)}>
      <span className="inline-block relative">
        {currentText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-[3px] h-[1em] bg-white ml-2 align-middle -mt-1"
        />
      </span>
    </div>
  );
}
