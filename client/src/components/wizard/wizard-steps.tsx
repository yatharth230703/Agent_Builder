import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Users, Brain, Zap, Database, FileText } from "lucide-react";
import type { WizardConfig } from "@/types/wizard";

interface WizardStepsProps {
  currentStep: number;
  config: WizardConfig;
  updateConfig: (field: keyof WizardConfig, value: string) => void;
  agentName: string;
  setAgentName: (name: string) => void;
  userPrompt: string;
  setUserPrompt: (prompt: string) => void;
}

export function WizardSteps({ currentStep, config, updateConfig, agentName, setAgentName, userPrompt, setUserPrompt }: WizardStepsProps) {
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Choose Your Approach</h2>
            <p className="text-gray-600 mb-8">How do you want to approach this task?</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  config.approach === "single"
                    ? "border-2 border-phil-purple bg-purple-50"
                    : "border-2 border-gray-300 hover:border-phil-purple"
                )}
                onClick={() => updateConfig("approach", "single")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      config.approach === "single" ? "bg-phil-purple" : "bg-gray-400"
                    )}>
                      <User className="text-white h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-phil-dark ml-4">Single Agent</h3>
                  </div>
                  <p className="text-gray-700">
                    One AI agent handles the entire task from start to finish. Simple and straightforward approach.
                  </p>
                </CardContent>
              </Card>
              
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  config.approach === "multi"
                    ? "border-2 border-phil-purple bg-purple-50"
                    : "border-2 border-gray-300 hover:border-phil-purple"
                )}
                onClick={() => updateConfig("approach", "multi")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      config.approach === "multi" ? "bg-phil-purple" : "bg-gray-400"
                    )}>
                      <Users className="text-white h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-phil-dark ml-4">Multi Agent</h3>
                  </div>
                  <p className="text-gray-700">
                    Multiple specialized agents work together, each handling different aspects of the task.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Pick Your Framework</h2>
            <p className="text-gray-600 mb-8">Which AI framework would you like to use?</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {["Langchain", "LlamaIndex", "CrewAI", "Langgraph"].map((framework) => (
                <Button
                  key={framework}
                  variant={config.framework === framework ? "default" : "outline"}
                  className={cn(
                    "h-16 text-lg",
                    config.framework === framework
                      ? "bg-phil-purple hover:bg-purple-700"
                      : "border-phil-purple text-phil-purple hover:bg-phil-purple hover:text-white"
                  )}
                  onClick={() => updateConfig("framework", framework)}
                >
                  {framework}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Choose LLM Provider</h2>
            <p className="text-gray-600 mb-8">Select your preferred language model provider.</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {["OpenAI", "Anthropic", "Gemini", "Ollama", "Deepseek", "Claude"].map((provider) => (
                <Button
                  key={provider}
                  variant={config.llmProvider === provider ? "default" : "outline"}
                  className={cn(
                    "h-16 text-lg",
                    config.llmProvider === provider
                      ? "bg-phil-purple hover:bg-purple-700"
                      : "border-phil-purple text-phil-purple hover:bg-phil-purple hover:text-white"
                  )}
                  onClick={() => updateConfig("llmProvider", provider)}
                >
                  {provider}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Select Tools</h2>
            <p className="text-gray-600 mb-8">What tools should your agent have access to?</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { id: "RAG", label: "RAG", icon: Database, desc: "Retrieval Augmented Generation for document search" },
                { id: "Websurf", label: "Web Search", icon: Zap, desc: "Real-time web search and browsing capabilities" },
                { id: "Both", label: "Both", icon: Brain, desc: "Combined RAG and web search functionality" }
              ].map((tool) => (
                <Card
                  key={tool.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    config.toolUse === tool.id
                      ? "border-2 border-phil-purple bg-purple-50"
                      : "border-2 border-gray-300 hover:border-phil-purple"
                  )}
                  onClick={() => updateConfig("toolUse", tool.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        config.toolUse === tool.id ? "bg-phil-purple" : "bg-gray-400"
                      )}>
                        <tool.icon className="text-white h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-phil-dark ml-4">{tool.label}</h3>
                    </div>
                    <p className="text-gray-700 text-sm">{tool.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Database Configuration</h2>
            <p className="text-gray-600 mb-8">Configure your embedder and vector database.</p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-phil-dark mb-4">Who pays for an embedder?</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {["Huggingface", "Gemini", "OpenAI"].map((embedder) => (
                    <Button
                      key={embedder}
                      variant={config.embedder === embedder ? "default" : "outline"}
                      className={cn(
                        "h-12",
                        config.embedder === embedder
                          ? "bg-phil-purple hover:bg-purple-700"
                          : "border-phil-purple text-phil-purple hover:bg-phil-purple hover:text-white"
                      )}
                      onClick={() => updateConfig("embedder", embedder)}
                    >
                      {embedder}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-phil-dark mb-4">Vector Database</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {["Chroma DB", "Pinecone DB", "Weaviate DB"].map((db) => (
                    <Button
                      key={db}
                      variant={config.vectorDb === db ? "default" : "outline"}
                      className={cn(
                        "h-12",
                        config.vectorDb === db
                          ? "bg-phil-purple hover:bg-purple-700"
                          : "border-phil-purple text-phil-purple hover:bg-phil-purple hover:text-white"
                      )}
                      onClick={() => updateConfig("vectorDb", db)}
                    >
                      {db}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Review & Name Your Agent</h2>
            <p className="text-gray-600 mb-8">Review your configuration and give your agent a name.</p>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="agentName" className="text-sm font-medium text-gray-700">
                  Agent Name
                </Label>
                <Input
                  id="agentName"
                  type="text"
                  placeholder="Enter a name for your agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Card className="bg-gray-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-phil-dark mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Configuration Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approach:</span>
                      <span className="font-medium">{config.approach || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Framework:</span>
                      <span className="font-medium">{config.framework || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">LLM Provider:</span>
                      <span className="font-medium">{config.llmProvider || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tools:</span>
                      <span className="font-medium">{config.toolUse || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Embedder:</span>
                      <span className="font-medium">{config.embedder || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vector DB:</span>
                      <span className="font-medium">{config.vectorDb || "Not selected"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 7:
        return (
          <div>
            <h2 className="text-3xl font-bold text-phil-dark mb-6">Describe Your Agent</h2>
            <p className="text-gray-600 mb-8">Tell us what you want your AI agent to do. Be specific about the tasks, goals, and capabilities you need.</p>
            
            <div className="space-y-4">
              <Label htmlFor="userPrompt" className="text-lg font-medium">
                Agent Description & Goals
              </Label>
              <textarea
                id="userPrompt"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Example: Create an agent that can analyze financial data, generate investment reports, and provide market insights based on current trends..."
                className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-phil-purple focus:border-transparent"
              />
              <p className="text-sm text-gray-500">
                Provide details about what tasks your agent should perform, what data it should work with, and what kind of responses you expect.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}
