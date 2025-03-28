
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, History } from "lucide-react";

type ChatHistoryEntry = {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
};

type ChatHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatHistory: ChatHistoryEntry[];
  onSelectChat: (chatId: string) => void;
};

const ChatHistoryDialog: React.FC<ChatHistoryDialogProps> = ({
  open,
  onOpenChange,
  chatHistory,
  onSelectChat,
}) => {
  // Group chats by date
  const groupedChats = chatHistory.reduce((groups, chat) => {
    const date = chat.date.toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(chat);
    return groups;
  }, {} as Record<string, ChatHistoryEntry[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <span>Chat History</span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedChats).map(([date, chats]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                </div>
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <Button 
                      key={chat.id}
                      variant="outline" 
                      className="w-full justify-start h-auto py-3 px-4"
                      onClick={() => {
                        onSelectChat(chat.id);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{chat.title}</span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {chat.lastMessage}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            
            {chatHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No chat history found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryDialog;
