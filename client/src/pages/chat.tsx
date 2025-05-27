import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Bot, User, Send, Paperclip, Link, Copy, Download, Trash2, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: agentData, isLoading } = useQuery({
    queryKey: ["/api/agents", id],
    enabled: !!id,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "I understand your request. Let me analyze that and provide you with a comprehensive response. This would normally involve processing through the AI orchestration service.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(sampleCode);
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

  const agent = agentData?.agent;
  const sampleCode = `# ${agent?.name || "AI Agent"}
from langchain.agents import initialize_agent
from langchain.llms import OpenAI
from langchain.tools import Tool

class AIAssistant:
    def __init__(self):
        self.llm = OpenAI(temperature=0.7)
        self.tools = [
            Tool(
                name="Analysis",
                description="Analyze data and trends",
                func=self.analyze_data
            ),
            Tool(
                name="Content Generator", 
                description="Generate helpful content",
                func=self.generate_content
            )
        ]
        
    def analyze_data(self, query):
        # Analysis logic here
        return f"Analysis for: {query}"
        
    def generate_content(self, brief):
        # Content generation logic
        return f"Generated content for: {brief}"
        
    def run(self, user_input):
        agent = initialize_agent(
            self.tools,
            self.llm,
            agent="zero-shot-react-description"
        )
        return agent.run(user_input)`;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            <div className="lg:col-span-2 bg-gray-200 rounded-2xl"></div>
            <div className="bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Chat Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-phil-purple rounded-full flex items-center justify-center">
                  <Bot className="text-white h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-phil-dark">
                    {agent?.name || "AI Assistant"}
                  </h3>
                  <p className="text-gray-600 text-sm">Online • Ready to chat</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={clearChat}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender === "user" ? "justify-end" : ""
                }`}
              >
                {message.sender === "ai" && (
                  <div className="w-8 h-8 bg-phil-purple rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-white h-4 w-4" />
                  </div>
                )}
                
                <div className={`flex-1 max-w-md ${message.sender === "user" ? "order-first" : ""}`}>
                  <div
                    className={`rounded-2xl p-4 ${
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
                  <div className="w-8 h-8 bg-phil-pink rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-phil-purple rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <div className="bg-purple-50 rounded-2xl rounded-tl-none p-4">
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
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border-gray-300 focus:ring-purple-600 focus:border-purple-600"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-phil-purple hover:bg-purple-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center mt-3 space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-purple-600">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach File
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-purple-600">
                <Link className="h-4 w-4 mr-1" />
                Add Context URL
              </Button>
            </div>
          </div>
        </div>

        {/* Code Panel */}
        <div className="bg-white rounded-2xl shadow-lg flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-phil-dark">Generated Code</h3>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={copyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Python
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {agent?.config?.framework || "Langchain"}
              </Badge>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <code>{sampleCode}</code>
            </pre>
          </div>

          {/* Tech Review Panel */}
          <div className="p-6 border-t border-gray-200">
            <h4 className="font-bold text-phil-dark mb-3">Quick Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">Uses standard patterns</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-700">Consider adding error handling</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">Est. cost: $0.05/query</span>
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-phil-purple hover:bg-purple-700 text-white"
            >
              Run Full Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
