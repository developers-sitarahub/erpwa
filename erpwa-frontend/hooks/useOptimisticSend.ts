"use client";

import { v4 as uuid } from "uuid";
import type { Message } from "@/lib/types";

interface UseOptimisticSendProps {
  conversationId: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useOptimisticSend({
  conversationId,
  setMessages,
}: UseOptimisticSendProps) {
  const insertOptimisticMessage = (text: string) => {
    const clientTempId = uuid();

    const optimisticMessage: Message = {
      id: clientTempId,
      clientTempId,
      text,
      sender: "executive",
      timestamp: new Date().toISOString(),
      status: "sent", // UI icon overridden by optimistic flag
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    return clientTempId;
  };

  const markOptimisticFailed = (clientTempId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.clientTempId === clientTempId
          ? { ...m, status: "failed", optimistic: false }
          : m
      )
    );
  };

  const replaceOptimisticMessage = (realMessage: Message) => {
    setMessages((prev) => {
      const withoutOptimistic = prev.filter(
        (m) => m.clientTempId !== realMessage.clientTempId
      );

      return [...withoutOptimistic, realMessage].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  };

  return {
    insertOptimisticMessage,
    markOptimisticFailed,
    replaceOptimisticMessage,
  };
}
