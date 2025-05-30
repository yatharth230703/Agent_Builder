import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Circle, Bot, Lightbulb, Users, User, Zap, Trophy, Star, Sparkles, Rocket, Target } from "lucide-react";
import type { WizardConfig } from "@/types/wizard";

interface RecommendationDialogue {
  option: string;
  reason: string;
  benefits: string[];
}

interface WizardSection {
  key: keyof WizardConfig;
  title: string;
  question: string;
  options: Array<{
    value: string;
    label: string;
    description: string;
    icon?: any;
  }>;
}

export default function Wizard() {
  const [userPrompt, setUserPrompt] = useState("");
  const [customUrls, setCustomUrls] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, RecommendationDialogue>>({});
  const [config, setConfig] = useState<WizardConfig>({
    approach: "",
    framework: "",
    llmProvider: "",
    toolUse: "",
    embedder: "",
    vectorDb: "",
  });
  const [score, setScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Refs for auto-scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Achievement system
  const checkAchievements = (newConfig: WizardConfig) => {
    const newAchievements: string[] = [];
    const completedSections = Object.values(newConfig).filter(v => v !== "").length;
    
    if (completedSections >= 1 && !achievements.includes("first-choice")) {
      newAchievements.push("first-choice");
      setScore(prev => prev + 100);
    }
    if (completedSections >= 3 && !achievements.includes("halfway-hero")) {
      newAchievements.push("halfway-hero");
      setScore(prev => prev + 250);
    }
    if (completedSections >= 6 && !achievements.includes("configuration-champion")) {
      newAchievements.push("configuration-champion");
      setScore(prev => prev + 500);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  // Wizard sections configuration
  const wizardSections: WizardSection[] = [
    {
      key: 'approach',
      title: 'Choose Your Approach',
      question: 'How do you want to approach this task?',
      options: [
        {
          value: 'single',
          label: 'Single Agent',
          description: 'One AI agent handles the entire task from start to finish. Simple and straightforward approach.',
          icon: User
        },
        {
          value: 'multi',
          label: 'Multi Agent',
          description: 'Multiple specialized agents work together, each handling different aspects of the task.',
          icon: Users
        }
      ]
    },
    {
      key: 'framework',
      title: 'Pick Your Framework',
      question: 'Which framework would you like to use?',
      options: [
        { value: 'LangChain', label: 'LangChain', description: 'Popular framework for building LLM applications' },
        { value: 'LlamaIndex', label: 'LlamaIndex', description: 'Data framework for LLM applications' },
        { value: 'CrewAI', label: 'CrewAI', description: 'Framework for orchestrating role-playing AI agents' },
        { value: 'LangGraph', label: 'LangGraph', description: 'Library for building stateful, multi-actor applications' }
      ]
    },
    {
      key: 'llmProvider',
      title: 'Who\'s Paying Today?',
      question: 'Select your LLM provider',
      options: [
        { value: 'OpenAI', label: 'OpenAI', description: 'GPT models with excellent performance' },
        { value: 'Anthropic', label: 'Anthropic', description: 'Claude models with strong reasoning' },
        { value: 'Google', label: 'Google', description: 'Gemini models with multimodal capabilities' },
        { value: 'Ollama', label: 'Ollama', description: 'Local models for privacy and control' },
        { value: 'Deepseek', label: 'Deepseek', description: 'Cost-effective models with good performance' },
        { value: 'Claude', label: 'Claude', description: 'Advanced reasoning and analysis capabilities' }
      ]
    },
    {
      key: 'toolUse',
      title: 'The Caveman\'s Tools',
      question: 'What tools should your agent have access to?',
      options: [
        { value: 'RAG', label: 'RAG', description: 'Retrieval-Augmented Generation for knowledge access' },
        { value: 'Websurf', label: 'Websurf', description: 'Web browsing and search capabilities' },
        { value: 'Both', label: 'Both', description: 'Combined RAG and web surfing capabilities' }
      ]
    },
    {
      key: 'embedder',
      title: 'Who Pays for an Embedder?',
      question: 'Choose your embedding provider',
      options: [
        { value: 'Huggingface', label: 'Huggingface', description: 'Open-source embedding models' },
        { value: 'Gemini', label: 'Gemini', description: 'Google\'s embedding service' },
        { value: 'OpenAI', label: 'OpenAI', description: 'High-quality OpenAI embeddings' }
      ]
    },
    {
      key: 'vectorDb',
      title: 'It\'s Always Chroma',
      question: 'Select your vector database',
      options: [
        { value: 'Chroma DB', label: 'Chroma DB', description: 'Simple, open-source vector database' },
        { value: 'Pinecone DB', label: 'Pinecone DB', description: 'Managed vector database service' },
        { value: 'Weaviate DB', label: 'Weaviate DB', description: 'Open-source vector search engine' }
      ]
    }
  ];

  // Get user prompt and URLs from localStorage
  useEffect(() => {
    const prompt = localStorage.getItem("userPrompt");
    const urls = localStorage.getItem("customUrls");
    
    if (prompt) {
      setUserPrompt(prompt);
      fetchRecommendations(prompt);
    } else {
      setLocation("/");
    }
    
    if (urls) {
      setCustomUrls(JSON.parse(urls));
    }
  }, [setLocation]);

  // Auto-scroll function
  const scrollToSection = (sectionKey: string) => {
    const element = sectionRefs.current[sectionKey];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Check if all previous sections are completed
  const canSelectSection = (sectionKey: string): boolean => {
    const sections = ['approach', 'framework', 'llmProvider', 'toolUse', 'embedder', 'vectorDb'];
    const currentIndex = sections.indexOf(sectionKey);
    
    if (currentIndex === 0) return true;
    
    // Check if all previous sections have selections
    for (let i = 0; i < currentIndex; i++) {
      const key = sections[i] as keyof WizardConfig;
      if (!config[key]) return false;
    }
    return true;
  };

  // Handle option selection with auto-scroll and gamification
  const handleOptionSelect = (category: keyof WizardConfig, value: string) => {
    const newConfig = { ...config, [category]: value };
    setConfig(newConfig);
    
    // Check for achievements
    checkAchievements(newConfig);
    
    // Add points for selection
    setScore(prev => prev + 50);
    
    // Auto-scroll to next section
    const sections = ['approach', 'framework', 'llmProvider', 'toolUse', 'embedder', 'vectorDb'];
    const currentIndex = sections.indexOf(category);
    if (currentIndex < sections.length - 1) {
      setTimeout(() => {
        scrollToSection(sections[currentIndex + 1]);
      }, 300);
    } else {
      // All sections completed, scroll to final section
      setTimeout(() => {
        scrollToSection('final');
      }, 300);
    }
  };

  const fetchRecommendations = async (prompt: string) => {
    try {
      const response = await apiRequest('/api/ai/recommendations', {
        method: 'POST',
        body: { 
          prompt: prompt,
          config: {}
        }
      });

      if (response.success && response.recommendations) {
        setRecommendations(response.recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const createAgentMutation = useMutation({
    mutationFn: async (data: { name: string; config: WizardConfig; prompt: string }) => {
      return apiRequest('/api/agents', {
        method: 'POST',
        body: {
          name: data.name,
          prompt: data.prompt,
          config: data.config,
          flow: 'walkthrough',
          contextUrls: customUrls
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Agent Created!",
        description: "Your AI agent has been successfully configured.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setLocation(`/chat/${data.agent.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create agent",
        variant: "destructive"
      });
    }
  });

  const handleCreateAgent = () => {
    if (!userPrompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please provide a prompt for your agent",
        variant: "destructive"
      });
      return;
    }

    const allConfigured = Object.values(config).every(value => value.trim() !== "");
    if (!allConfigured) {
      toast({
        title: "Incomplete Configuration",
        description: "Please complete all configuration steps",
        variant: "destructive"
      });
      return;
    }

    createAgentMutation.mutate({
      name: `Agent for: ${userPrompt.slice(0, 50)}...`,
      config,
      prompt: userPrompt
    });
  };

  // Recommendation component
  const RecommendationBox = ({ sectionKey, selectedValue }: { sectionKey: string; selectedValue: string }) => {
    const recommendation = recommendations[sectionKey];
    if (!recommendation || recommendation.option !== selectedValue) return null;

    return (
      <Card className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Bot className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-2">AI Recommendation</h4>
              <p className="text-purple-800 text-sm mb-3">{recommendation.reason}</p>
              <div className="space-y-1">
                {recommendation.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Lightbulb className="h-3 w-3 text-purple-600" />
                    <span className="text-purple-700 text-xs">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isAllConfigured = Object.values(config).every(value => value.trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Gamified Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-white px-6 py-6 relative overflow-hidden">
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 animate-bounce">
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="absolute top-4 right-1/4 animate-pulse">
              <Star className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="absolute top-2 left-1/2 animate-ping">
              <Trophy className="h-10 w-10 text-yellow-300" />
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <Rocket className="h-8 w-8" />
                <span>AI Agent Builder</span>
              </h1>
              <p className="text-purple-100 mt-1">Level up your AI game step by step!</p>
            </div>
            
            {/* Score System */}
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Zap className="h-5 w-5 text-yellow-300" />
                  <span className="text-2xl font-bold">{score}</span>
                </div>
                <p className="text-xs text-purple-100">Experience Points</p>
              </div>
            </div>
          </div>
          
          {/* Achievement Badges */}
          {achievements.length > 0 && (
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-semibold text-yellow-300">Achievements:</span>
              {achievements.map((achievement) => (
                <Badge key={achievement} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  {achievement === "first-choice" && "🎯 First Choice"}
                  {achievement === "halfway-hero" && "⚡ Halfway Hero"}
                  {achievement === "configuration-champion" && "🏆 Configuration Champion"}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Gamified Progress Bar */}
          <div className="bg-white/20 rounded-full p-1 mb-4">
            <div className="flex items-center space-x-2">
              {wizardSections.map((section, index) => {
                const isCompleted = config[section.key] !== "";
                const canSelect = canSelectSection(section.key);
                const completedCount = Object.values(config).filter(v => v !== "").length;
                
                return (
                  <div key={section.key} className="flex items-center space-x-2 flex-1">
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white shadow-lg transform scale-110' 
                        : canSelect
                          ? 'bg-white/30 text-white border-2 border-white/50 animate-pulse'
                          : 'bg-white/10 text-white/50'
                    }`}>
                      {isCompleted ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-5 w-5" />
                          <div className="absolute -top-1 -right-1">
                            <Star className="h-3 w-3 text-yellow-300 animate-spin" />
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-sm">{index + 1}</span>
                      )}
                    </div>
                    
                    {index < wizardSections.length - 1 && (
                      <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-400' : 'bg-white/20'
                      }`}>
                        {isCompleted && (
                          <div className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Quest Description */}
          <div className="text-center">
            <p className="text-white/90 text-sm">
              🎮 Complete {6 - Object.values(config).filter(v => v !== "").length} more steps to unlock your AI agent!
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-16">
        {/* Prompt Display */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Your Task</h2>
            <p className="text-blue-800">{userPrompt}</p>
          </CardContent>
        </Card>

        {/* Gamified Configuration Sections */}
        {wizardSections.map((section, sectionIndex) => {
          const canSelect = canSelectSection(section.key);
          const isSelected = config[section.key] !== "";
          
          return (
            <div 
              key={section.key}
              ref={el => sectionRefs.current[section.key] = el}
              className={`transition-all duration-500 transform ${
                canSelect ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
              }`}
            >
              <Card className={`relative overflow-hidden transition-all duration-300 ${
                canSelect ? 'shadow-xl hover:shadow-2xl' : 'shadow-sm'
              } ${isSelected ? 'ring-4 ring-green-400 bg-gradient-to-br from-green-50 to-blue-50' : ''}`}>
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs font-bold">+50 XP</span>
                    </div>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg transform scale-110' 
                        : canSelect
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md animate-pulse'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isSelected ? (
                        <div className="relative">
                          <CheckCircle className="h-6 w-6" />
                          <div className="absolute -top-1 -right-1 animate-bounce">
                            <Sparkles className="h-3 w-3 text-yellow-300" />
                          </div>
                        </div>
                      ) : canSelect ? (
                        <Target className="h-6 w-6 animate-pulse" />
                      ) : (
                        <span className="font-bold text-lg">{sectionIndex + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className={`text-2xl font-bold transition-colors ${
                        isSelected ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {section.title}
                      </h2>
                      <p className={`text-lg ${
                        isSelected ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {section.question}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="text-right">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✨ Completed!
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.options.map((option) => {
                      const isOptionSelected = config[section.key] === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => canSelect && handleOptionSelect(section.key, option.value)}
                          disabled={!canSelect}
                          className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-300 transform ${
                            isOptionSelected
                              ? 'border-green-400 bg-gradient-to-br from-green-50 to-blue-50 shadow-xl scale-105 ring-2 ring-green-200'
                              : canSelect
                                ? 'border-gray-200 hover:border-purple-400 hover:shadow-lg hover:scale-105 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50'
                                : 'border-gray-100 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {isOptionSelected && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          
                          <div className="flex items-start space-x-4">
                            {option.icon && (
                              <div className={`p-3 rounded-lg transition-all duration-300 ${
                                isOptionSelected 
                                  ? 'bg-green-100 text-green-600' 
                                  : canSelect
                                    ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                                    : 'bg-gray-100 text-gray-400'
                              }`}>
                                <option.icon className="h-6 w-6" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className={`font-bold text-lg transition-colors ${
                                  isOptionSelected 
                                    ? 'text-green-800' 
                                    : canSelect
                                      ? 'text-gray-900 group-hover:text-purple-900'
                                      : 'text-gray-500'
                                }`}>
                                  {option.label}
                                </h3>
                                {isOptionSelected && (
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Star className="h-4 w-4 animate-spin" />
                                    <span className="text-xs font-bold">Selected!</span>
                                  </div>
                                )}
                              </div>
                              <p className={`text-sm leading-relaxed transition-colors ${
                                isOptionSelected 
                                  ? 'text-green-700' 
                                  : canSelect
                                    ? 'text-gray-600 group-hover:text-purple-700'
                                    : 'text-gray-400'
                              }`}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                          
                          {canSelect && !isOptionSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show recommendation for selected option */}
                  {isSelected && (
                    <RecommendationBox sectionKey={section.key} selectedValue={config[section.key]} />
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Epic Final Victory Section */}
        {isAllConfigured && (
          <div 
            ref={el => sectionRefs.current['final'] = el}
            className="relative"
          >
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                <Trophy className="relative h-20 w-20 text-yellow-500 mx-auto animate-bounce" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-4 mb-2">
                🎉 QUEST COMPLETE! 🎉
              </h2>
              <p className="text-xl text-gray-700 mb-2">You've mastered the AI Agent Builder!</p>
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Zap className="h-6 w-6 text-yellow-500" />
                <span className="text-2xl font-bold text-purple-600">{score} Total XP Earned!</span>
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
            </div>

            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
              
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-purple-900 mb-4">Your AI Agent Configuration</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {Object.entries(config).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-4 shadow-md border border-purple-100">
                        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-lg font-bold text-purple-900">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg">
                      <Rocket className="h-5 w-5" />
                      <span>Ready for Launch!</span>
                      <Sparkles className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={createAgentMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 hover:from-purple-700 hover:via-pink-600 hover:to-blue-600 text-white px-12 py-4 text-xl font-bold rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    {createAgentMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Your Agent...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Rocket className="h-6 w-6" />
                        <span>Launch Agent & Start Chat</span>
                        <Sparkles className="h-6 w-6" />
                      </div>
                    )}
                  </Button>
                  
                  <p className="text-sm text-gray-600 mt-4">
                    Your agent will be created and you'll be taken to the chat interface
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}