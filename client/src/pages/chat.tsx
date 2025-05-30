import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Bot, User, Send, Paperclip, Link, Copy, Download, Trash2, CheckCircle, AlertTriangle, DollarSign, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      content: "Hello! I'm your AI assistant. I can help you with various tasks. What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [contextUrls, setContextUrls] = useState<string[]>([]);
  const [newContextUrl, setNewContextUrl] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agentData, isLoading } = useQuery({
    queryKey: ["/api/agents", id],
    enabled: !!id,
  });

  const agent = (agentData as any)?.agent;

  // Load analysis when agent loads
  const { data: analysisResponse } = useQuery({
    queryKey: ["/api/agents", id, "analysis"],
    enabled: !!id && !!agent,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to AI server for chat
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          message,
          contextUrls,
          currentCode: generatedCode,
          messagesHistory: messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content
          }))
        })
      });
      if (!response.ok) throw new Error('AI service unavailable');
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: data.response || "I've processed your request successfully!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      if (data.generatedCode) {
        setGeneratedCode(data.generatedCode);
      }
      if (data.analysis) {
        setAnalysisData(data.analysis);
      }
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");
    setIsTyping(true);

    chatMutation.mutate(messageToSend);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type - only .py and image files
    const allowedTypes = ['.py', '.png', '.jpg', '.jpeg', '.gif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: "Please upload only Python (.py) files or image files.",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileText = await file.text();
      const fileContent = `[File: ${file.name}]\n${fileText}`;
      setInputValue(prev => prev + '\n' + fileContent);
      toast({
        title: "File attached",
        description: `${file.name} has been added to your message.`,
      });
    } catch (error) {
      toast({
        title: "File upload failed",
        description: "Could not read the file content.",
        variant: "destructive"
      });
    }
  };

  const addContextUrl = () => {
    if (!newContextUrl.trim()) return;
    setContextUrls(prev => [...prev, newContextUrl.trim()]);
    setNewContextUrl("");
    toast({
      title: "Context URL added",
      description: "The URL will be used to enhance AI responses.",
    });
  };

  const removeContextUrl = (index: number) => {
    setContextUrls(prev => prev.filter((_, i) => i !== index));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Code copied",
      description: "The code has been copied to your clipboard.",
    });
  };

  const clearChat = () => {
    setMessages([{
      id: "1",
      sender: "ai",
      content: "Hello! I'm your AI assistant. I can help you with various tasks. What would you like to work on today?",
      timestamp: new Date(),
    }]);
  };

  // Initialize generated code with agent's python_script or empty
  useEffect(() => {
    if (agent?.python_script && !generatedCode) {
      setGeneratedCode(agent.python_script);
    }
  }, [agent, generatedCode]);

  // Set analysis data when it loads
  useEffect(() => {
    if ((analysisResponse as any)?.analysis) {
      setAnalysisData((analysisResponse as any).analysis);
    }
  }, [analysisResponse]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading agent...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content Grid - No Footer, Full Height */}
      <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-4 p-4">
        
        {/* Chat Panel - Takes up 6 columns, 10 rows (much taller) */}
        <div className="col-span-6 row-span-10 bg-white rounded-2xl shadow-lg flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-phil-purple rounded-full flex items-center justify-center">
                  <Bot className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-phil-dark">
                    {agent?.name || "AI Assistant"}
                  </h3>
                  <p className="text-gray-600 text-xs">Online • Ready to chat</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages - Flexible height */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${
                  message.sender === "user" ? "justify-end" : ""
                }`}
              >
                {message.sender === "ai" && (
                  <div className="w-7 h-7 bg-phil-purple rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-white h-3 w-3" />
                  </div>
                )}
                
                <div className={`max-w-sm ${message.sender === "user" ? "order-first" : ""}`}>
                  <div
                    className={`rounded-2xl p-3 text-sm ${
                      message.sender === "ai"
                        ? "bg-purple-50 text-phil-dark rounded-tl-none"
                        : "bg-phil-pink text-white rounded-tr-none ml-auto"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <span className={`text-xs text-gray-500 mt-1 block ${
                    message.sender === "user" ? "text-right" : ""
                  }`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {message.sender === "user" && (
                  <div className="w-7 h-7 bg-phil-pink rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white h-3 w-3" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-2">
                <div className="w-7 h-7 bg-phil-purple rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white h-3 w-3" />
                </div>
                <div className="bg-purple-50 rounded-2xl rounded-tl-none p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-phil-purple rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-phil-purple rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-phil-purple rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 min-h-[60px] max-h-[120px] border-gray-300 focus:ring-purple-600 focus:border-purple-600 resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || chatMutation.isPending}
                className="bg-phil-purple hover:bg-purple-700 text-white self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center mt-2 space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".py,.png,.jpg,.jpeg,.gif"
                className="hidden"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-purple-600"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach File
              </Button>
            </div>
          </div>
        </div>

        {/* Code Panel - Takes up 4 columns, 10 rows (same height as chat) */}
        <div className="col-span-4 row-span-10 bg-white rounded-2xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-phil-dark">Generated Code</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                Python
              </Badge>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto h-full">
              <code>{generatedCode || "# Code will appear here after AI generates it"}</code>
            </pre>
          </div>
        </div>

        {/* Analysis Panel - Takes up 2 columns, 10 rows (same height as chat and code) */}
        <div className="col-span-2 row-span-10 bg-white rounded-2xl shadow-lg flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-bold text-phil-dark text-sm">Analysis</h4>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3 text-xs">
              {analysisData ? (
                <>
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-800 text-xs">Technical Review:</h5>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-gray-700">{analysisData.techReview?.patterns || "Standard patterns"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-gray-700">{analysisData.techReview?.suggestions || "Consider error handling"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-semibold text-gray-800 text-xs">Cost Analysis:</h5>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-3 w-3 text-blue-500" />
                      <span className="text-gray-700">{analysisData.costAnalysis?.estimate || "Est. cost: $0.05/query"}</span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      {analysisData.costAnalysis?.breakdown || "Detailed breakdown available"}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-xs">Analysis will appear after code generation</p>
              )}
            </div>
          </div>
        </div>

        {/* Context URLs Panel - Takes 6 columns, 2 rows (much shorter) */}
        <div className="col-span-6 row-span-2 bg-white rounded-2xl shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <h4 className="font-bold text-phil-dark text-sm">Context URLs</h4>
          </div>
          <div className="p-3">
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add documentation URL..."
                value={newContextUrl}
                onChange={(e) => setNewContextUrl(e.target.value)}
                className="flex-1 text-sm h-8"
              />
              <Button
                onClick={addContextUrl}
                size="sm"
                className="bg-phil-purple hover:bg-purple-700 text-white h-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-16 overflow-y-auto">
              {contextUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-1 rounded text-xs">
                  <span className="truncate flex-1">{url}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContextUrl(index)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {contextUrls.length === 0 && (
                <p className="text-gray-500 text-xs">No context URLs added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
