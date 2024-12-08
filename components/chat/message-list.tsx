"use client";

import { Message } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <ScrollArea className="h-[600px] pr-4">
      {messages.map((message, index) => (
        <Card key={index} className="mb-4 p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2">
              {message.role === "assistant" ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <ReactMarkdown className="prose dark:prose-invert max-w-none">
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </Card>
      ))}
    </ScrollArea>
  );
}