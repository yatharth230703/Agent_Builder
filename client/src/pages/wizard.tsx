import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Circle, Bot, Lightbulb, Users, User } from "lucide-react";
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Refs for auto-scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Handle option selection with auto-scroll
  const handleOptionSelect = (category: keyof WizardConfig, value: string) => {
    setConfig(prev => ({ ...prev, [category]: value }));
    
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
      const response = await apiRequest({
        url: '/api/ai/recommendations',
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
      return apiRequest({
        url: '/api/agents',
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
      {/* Header */}
      <div className="bg-white border-b border-purple-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-purple-900">AI Agent Builder</h1>
          <p className="text-purple-600 mt-1">Configure your AI agent step by step</p>
          
          {/* Progress indicators */}
          <div className="flex items-center space-x-4 mt-4">
            {wizardSections.map((section, index) => {
              const isCompleted = config[section.key] !== "";
              const canSelect = canSelectSection(section.key);
              
              return (
                <div key={section.key} className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-purple-600 border-purple-600 text-white' 
                      : canSelect
                        ? 'border-purple-300 text-purple-600'
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <span className={`text-sm ${isCompleted ? 'text-purple-900' : canSelect ? 'text-purple-600' : 'text-gray-400'}`}>
                    {section.title}
                  </span>
                  {index < wizardSections.length - 1 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-purple-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
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

        {/* Configuration Sections */}
        {wizardSections.map((section, sectionIndex) => {
          const canSelect = canSelectSection(section.key);
          const isSelected = config[section.key] !== "";
          
          return (
            <div 
              key={section.key}
              ref={el => sectionRefs.current[section.key] = el}
              className={`transition-opacity duration-500 ${canSelect ? 'opacity-100' : 'opacity-50'}`}
            >
              <Card className={`${canSelect ? 'shadow-lg' : 'shadow-sm'} ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
                <CardContent className="p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {isSelected ? <CheckCircle className="h-5 w-5" /> : <span className="font-bold">{sectionIndex + 1}</span>}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                      <p className="text-gray-600">{section.question}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.options.map((option) => {
                      const isOptionSelected = config[section.key] === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => canSelect && handleOptionSelect(section.key, option.value)}
                          disabled={!canSelect}
                          className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                            isOptionSelected
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : canSelect
                                ? 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                                : 'border-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {option.icon && (
                              <option.icon className={`h-5 w-5 mt-0.5 ${
                                isOptionSelected ? 'text-purple-600' : 'text-gray-500'
                              }`} />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-semibold ${
                                  isOptionSelected ? 'text-purple-900' : 'text-gray-900'
                                }`}>
                                  {option.label}
                                </h3>
                                {isOptionSelected && (
                                  <CheckCircle className="h-4 w-4 text-purple-600" />
                                )}
                              </div>
                              <p className={`text-sm ${
                                isOptionSelected ? 'text-purple-700' : 'text-gray-600'
                              }`}>
                                {option.description}
                              </p>
                            </div>
                          </div>
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

        {/* Final Section */}
        {isAllConfigured && (
          <div 
            ref={el => sectionRefs.current['final'] = el}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">Configuration Complete!</h2>
                <p className="text-green-700 mb-6">Your AI agent is ready to be created with the following configuration:</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {Object.entries(config).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="bg-green-100 text-green-800">
                      {key}: {value}
                    </Badge>
                  ))}
                </div>

                <Button 
                  onClick={handleCreateAgent}
                  disabled={createAgentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {createAgentMutation.isPending ? "Creating Agent..." : "Create Agent & Start Chat"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}