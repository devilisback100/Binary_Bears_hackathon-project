import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "@/components/UserAvatar";
import Logo from "@/components/Logo";
import SettingsDialog from "@/components/SettingsDialog";
import ProfileDialog from "@/components/ProfileDialog";
import ChatHistoryDialog from "@/components/ChatHistoryDialog";
import SignLanguageGenerator from "@/components/SignLanguageGenerator";
import FileUploadDialog from "@/components/FileUploadDialog";
import VoiceRecordingDialog from "@/components/VoiceRecordingDialog";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { 
  FileText, 
  Mic, 
  Send, 
  Search, 
  History, 
  Settings, 
  LogOut, 
  Upload,
  LoaderCircle,
  User,
  Pencil,
  RefreshCw,
  PlusCircle
} from "lucide-react";
import { chatAPI } from '@/services/api';

// Mock chat messages in English
const initialMessages = [
  {
    id: '1',
    sender: 'bot',
    content: 'Hello! I am your Justice Companion. I am here to help you with legal assistance. You can tell me about your problem or upload a legal document.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5)
  }
];

// Supported languages for the chat
const languages = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'kannada', name: 'Kannada' },
  { id: 'telugu', name: 'Telugu' },
  { id: 'urdu', name: 'Urdu' },
  { id: 'sign', name: 'Sign Language' }
];

// Mock chat history for demo
const mockChatHistory = [
  {
    id: 'chat1',
    title: 'Rental Agreement Issue',
    lastMessage: 'The landlord is asking for extra fees not mentioned in the agreement',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  },
  {
    id: 'chat2',
    title: 'Consumer Complaint',
    lastMessage: 'I purchased a defective product and the store refuses to refund',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24)
  },
  {
    id: 'chat3',
    title: 'Employment Dispute',
    lastMessage: 'My employer terminated me without proper notice',
    date: new Date()
  }
];

const NormalUserPortal = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showChatHistoryDialog, setShowChatHistoryDialog] = useState(false);
  const [showDocumentUploadDialog, setShowDocumentUploadDialog] = useState(false);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [showVoiceRecordingDialog, setShowVoiceRecordingDialog] = useState(false);
  const [shouldShowProfilePrompt, setShouldShowProfilePrompt] = useState(false);
  const [chatHistory, setChatHistory] = useState(mockChatHistory);
  const [userChatCount, setUserChatCount] = useState(() => {
    const storedCount = localStorage.getItem("userChatCount");
    return storedCount ? parseInt(storedCount, 10) : 0;
  });
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("english");
  const [showSignLanguage, setShowSignLanguage] = useState(false);
  const [signLanguageText, setSignLanguageText] = useState("");
  
  // Check if profile is complete
  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    return localStorage.getItem("userProfileComplete") === "true";
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isLoading && !user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Check if user should be prompted to complete profile
  useEffect(() => {
    if (userChatCount >= 23 && !isProfileComplete) {
      setShouldShowProfilePrompt(true);
      setShowProfileDialog(true);
    }
  }, [userChatCount, isProfileComplete]);

  // Apply language change effect
  useEffect(() => {
    if (currentLanguage === "sign") {
      // Only show sign language for bot messages
      const lastBotMessage = [...messages]
        .reverse()
        .find(msg => msg.sender === 'bot');
      
      if (lastBotMessage) {
        setSignLanguageText(lastBotMessage.content);
        setShowSignLanguage(true);
      }
    } else {
      setShowSignLanguage(false);
    }
  }, [currentLanguage, messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await chatAPI.sendMessage(message);
      console.log('API Response:', response); // Debug log

      if (response && response.response) {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          content: response.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generateBotResponse = (userMessage: string, language: string) => {
    // In a real app, this would call an API for response generation
    let content = 'I am here to help you. Please provide more details about your legal situation so I can provide better advice.';
    
    // Provide response based on language
    if (language === 'hindi') {
      content = 'मैं आपकी मदद करने के लिए यहां हूं। कृपया अपनी कानूनी स्थिति के बारे में अधिक जानकारी प्रदान करें ताकि मैं बेहतर सलाह दे सकूं।';
    } else if (language === 'kannada') {
      content = 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಕಾನೂನು ಪರಿಸ್ಥಿತಿಯ ಕುರಿತು ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ಒದಗಿಸಿ ಆದ್ದರಿಂದ ನಾನು ಉತ್ತಮ ಸಲಹೆಯನ್ನು ನೀಡಬಹುದು.';
    } else if (language === 'telugu') {
      content = 'నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మీ న్యాయపరమైన పరిస్థితి గురించి మరిన్ని వివరాలను అందించండి, తద్వారా నేను మంచి సలహా ఇవ్వగలను.';
    } else if (language === 'urdu') {
      content = 'میں آپ کی مدد کے لیے یہاں موجود ہوں۔ براہ کرم اپنی قانونی حالت کے بارے میں مزید تفصیلات فراہم کریں تاکہ میں بہتر مشورہ دے سکوں۔';
    } else if (language === 'sign') {
      content = 'I am here to help you. This will be translated to sign language.';
    }
    
    return {
      id: Date.now().toString(),
      sender: 'bot',
      content: content,
      timestamp: new Date()
    };
  };

  const handleEditMessage = (messageId: string) => {
    const messageToEdit = messages.find(msg => msg.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setEditedContent(messageToEdit.content);
    }
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === editingMessageId 
          ? { ...msg, content: editedContent } 
          : msg
      )
    );
    
    setEditingMessageId(null);
    setEditedContent("");
    
    // Simulate bot response to the edited message
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = generateBotResponse(editedContent, currentLanguage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // If current language is sign, set the text for sign language generator
      if (currentLanguage === "sign") {
        setSignLanguageText(botResponse.content);
        setShowSignLanguage(true);
      }
    }, 2000);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  const handleRegenerateResponse = (afterMessageId: string) => {
    // Find the user message that generated this response
    const messageIndex = messages.findIndex(msg => msg.id === afterMessageId);
    if (messageIndex >= 0) {
      // Remove the existing bot response
      setMessages(prev => prev.filter((_, index) => index <= messageIndex));
      
      // Show typing indicator
      setIsTyping(true);
      
      // Generate a new response in the selected language
      setTimeout(() => {
        const botResponse = generateBotResponse(messages[messageIndex].content, currentLanguage);
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        
        // If current language is sign, set the text for sign language generator
        if (currentLanguage === "sign") {
          setSignLanguageText(botResponse.content);
          setShowSignLanguage(true);
        }
      }, 2000);
    }
  };

  const handleChangeLanguage = (language: string) => {
    setCurrentLanguage(language);
    
    toast(`Language changed to ${language}`, {
      position: "bottom-center",
    });
    
    // If switching to sign language, show sign language for the last bot message
    if (language === "sign") {
      const lastBotMessage = [...messages]
        .reverse()
        .find(msg => msg.sender === 'bot');
      
      if (lastBotMessage) {
        setSignLanguageText(lastBotMessage.content);
        setShowSignLanguage(true);
      }
    } else {
      setShowSignLanguage(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    const selectedChat = chatHistory.find(chat => chat.id === chatId);
    if (selectedChat) {
      // In a real app, this would fetch the chat history from the backend
      // For demo, we'll just show a toast
      toast(`Loaded chat: ${selectedChat.title}`, {
        position: "bottom-center",
      });
    }
  };
  
  const handleStartNewChat = () => {
    // In a real app, this would create a new chat in the backend
    // For demo, we'll just clear the messages
    setMessages(initialMessages);
    toast("Started a new conversation", {
      position: "bottom-center",
    });
  };

  const handleFileUpload = (file: File, description: string) => {
    // In a real app, this would upload the file to a server
    // For demo, we'll just add a message about the upload
    
    const fileMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: `Uploaded a file: ${file.name}${description ? ` - ${description}` : ''}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, fileMessage]);
    
    // Simulate bot response to the file upload
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: `I've received your file "${file.name}". I'll analyze its contents and provide assistance based on the document.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleVoiceRecording = (audioBlob: Blob, transcript: string) => {
    // Add the transcript as a user message
    const transcriptMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: transcript,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transcriptMessage]);
    
    // Simulate bot response to the voice message
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = generateBotResponse(transcript, currentLanguage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <LoaderCircle className="h-10 w-10 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Settings Dialog */}
        <SettingsDialog 
          open={showSettingsDialog} 
          onOpenChange={setShowSettingsDialog}
          onLanguageChange={handleChangeLanguage}
          currentLanguage={currentLanguage}
        />

        {/* Profile Dialog */}
        <ProfileDialog 
          open={showProfileDialog} 
          onOpenChange={setShowProfileDialog} 
          mandatory={shouldShowProfilePrompt && !isProfileComplete} 
        />

        {/* Chat History Dialog */}
        <ChatHistoryDialog 
          open={showChatHistoryDialog}
          onOpenChange={setShowChatHistoryDialog}
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
        />

        {/* Document Upload Dialog */}
        <FileUploadDialog
          open={showDocumentUploadDialog}
          onOpenChange={setShowDocumentUploadDialog}
          onFileUpload={handleFileUpload}
          type="document"
        />

        {/* Image Upload Dialog */}
        <FileUploadDialog
          open={showImageUploadDialog}
          onOpenChange={setShowImageUploadDialog}
          onFileUpload={handleFileUpload}
          type="image"
        />

        {/* Voice Recording Dialog */}
        <VoiceRecordingDialog
          open={showVoiceRecordingDialog}
          onOpenChange={setShowVoiceRecordingDialog}
          onRecordingComplete={handleVoiceRecording}
        />

        {/* Sidebar */}
        <div 
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative z-10 h-full w-64 md:w-72 bg-white shadow-md`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <Logo className="mb-4" />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-8"
                />
              </div>
            </div>

            {/* Sidebar Content */}
            <ScrollArea className="flex-1 px-3 py-2">
              <div className="space-y-2 pr-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal hover:bg-gray-100" 
                  size="sm"
                  onClick={() => setShowChatHistoryDialog(true)}
                >
                  <History className="mr-2 h-4 w-4" />
                  Chat History
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                  size="sm"
                  onClick={handleStartNewChat}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Chat
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal hover:bg-gray-100"
                  size="sm"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal hover:bg-gray-100"
                  size="sm"
                  onClick={() => setShowProfileDialog(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile Information
                </Button>

                {/* Recent Conversations */}
                <div className="pt-4 pb-2">
                  <h3 className="text-xs font-medium text-muted-foreground mb-2">Recent Conversations</h3>
                  {chatHistory.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      className="w-full justify-start py-2 px-2 my-1 hover:bg-gray-100 h-auto"
                      size="sm"
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium truncate w-full">
                          {chat.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {chat.lastMessage}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Sidebar Footer */}
            <div className="p-4 border-t flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div onClick={() => setShowProfileDialog(true)} className="cursor-pointer">
                    <UserAvatar showName size="sm" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isProfileComplete ? "View profile" : "Complete your profile"}</p>
                </TooltipContent>
              </Tooltip>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
            <div className="flex items-center">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSidebarOpen(prev => !prev)}
                  className="mr-2"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Button>
              )}
              <h2 className="text-lg font-semibold">न्यायसाथी AI Assistant</h2>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  } `}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] relative`}>
                    {msg.sender !== 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="bg-brand-500 text-white text-xs">
                          NS
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {editingMessageId === msg.id ? (
                      <div className="flex flex-col gap-2 w-full">
                        <Input
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleSaveEdit}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Card className={`${
                        msg.sender === 'user' 
                          ? 'bg-brand-100 border-brand-200' 
                          : 'bg-white'
                      }`}>
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="text-sm">{msg.content}</div>
                            <div className="text-xs text-muted-foreground text-right">
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {msg.sender === 'user' && !editingMessageId && (
                      <div className="flex flex-col">
                        <UserAvatar size="sm" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 mt-1"
                              onClick={() => handleEditMessage(msg.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Edit message</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {msg.sender !== 'user' && !editingMessageId && (
                      <div className="absolute right-0 bottom-0 translate-y-[100%] flex items-center">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Regenerate in different language</p>
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-48">
                            {languages.map(lang => (
                              <DropdownMenuItem 
                                key={lang.id}
                                onClick={() => {
                                  handleChangeLanguage(lang.id);
                                  handleRegenerateResponse(msg.id);
                                }}
                                className="cursor-pointer"
                              >
                                {lang.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-brand-500 text-white text-xs">
                        NS
                      </AvatarFallback>
                    </Avatar>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {/* Sign Language Display */}
              {showSignLanguage && signLanguageText && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 max-w-full w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-brand-500 text-white text-xs">
                        NS
                      </AvatarFallback>
                    </Avatar>
                    <Card className="w-full">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-2">Sign Language Translation</h3>
                        <SignLanguageGenerator text={signLanguageText} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => setShowImageUploadDialog(true)}
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Upload image</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => setShowDocumentUploadDialog(true)}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Upload document</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="relative flex-1">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => setShowVoiceRecordingDialog(true)}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Voice recording</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NormalUserPortal;
