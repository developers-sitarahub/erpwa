"use client";

import {
    Search,
    MoreVertical,
    Image as ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { getConversationTick } from "@/utils/getConversationTicks";
import { useState } from "react";
import { Conversation } from "@/lib/types";

export default function ConversationList({
    conversations,
    selected,
    onSelect,
}: {
    conversations: Conversation[];
    selected: string;
    onSelect: (id: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="w-full md:w-96 bg-card border-r border-border flex flex-col h-full">
            <div className="bg-card p-3 flex items-center justify-between border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Chats</h2>
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-full"
                    >
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                </div>
            </div>

            <div className="px-3 py-2 bg-card border-b border-border">
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2">
                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background">
                {conversations.map((conv, i) => (
                    <motion.button
                        key={conv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => onSelect(conv.id)}
                        className={`w-full px-4 py-3 border-b border-border/50 text-left transition-colors hover:bg-muted/50 ${selected === conv.id ? "bg-muted" : ""
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-lg">
                                    {conv.companyName?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-base font-semibold text-foreground truncate">
                                        {conv.companyName}
                                    </p>

                                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                        {conv.lastActivity}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    {/* LEFT: tick + message text */}
                                    <div className="flex items-center gap-1 min-w-0">
                                        {getConversationTick(
                                            conv.lastMessageDirection,
                                            conv.lastMessageStatus
                                        )}

                                        <p
                                            className={`text-sm truncate ${conv.hasUnread
                                                ? "text-foreground"
                                                : "text-muted-foreground"
                                                }`}
                                        >
                                            {conv.lastMessage}
                                        </p>
                                    </div>

                                    {/* RIGHT: unread badge (ONLY if last message is inbound) */}
                                    {conv.lastMessageDirection === "inbound" &&
                                        conv.unreadCount! > 0 && (
                                            <span className="ml-2 min-w-[20px] h-5 px-2 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}