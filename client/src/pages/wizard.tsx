import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardProgress } from "@/components/wizard/wizard-progress";
import { WizardSteps } from "@/components/wizard/wizard-steps";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WizardConfig } from "@/types/wizard";

export default function Wizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
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

  const createAgentMutation = useMutation({
    mutationFn: async (data: { name: string; config: WizardConfig; prompt: string }) => {
      // First generate the agent code using AI
      const aiResponse = await fetch('http://localhost:5001/api/ai/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: data.prompt,
          techStack: `${data.config.framework} + ${data.config.llmProvider} + ${data.config.toolUse}`,
          options: data.config
        })
      });
      
      const aiData = await aiResponse.json();
      
      // Then save the agent with generated code
      const agentData = {
        name: data.name,
        config: data.config,
        pythonScript: aiData.success ? aiData.python : ""
      };
      
      const response = await apiRequest("POST", "/api/agents", agentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent created!",
        description: "Your AI agent has been successfully created.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  const updateConfig = (field: keyof WizardConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(current => current + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(current => current - 1);
    }
  };

  const handleFinish = () => {
    if (!agentName.trim()) {
      toast({
        title: "Agent name required",
        description: "Please enter a name for your agent",
        variant: "destructive",
      });
      return;
    }

    if (!userPrompt.trim()) {
      toast({
        title: "User prompt required",
        description: "Please describe what you want your agent to do",
        variant: "destructive",
      });
      return;
    }

    createAgentMutation.mutate({
      name: agentName,
      config,
      prompt: userPrompt,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return config.approach !== "";
      case 2: return config.framework !== "";
      case 3: return config.llmProvider !== "";
      case 4: return config.toolUse !== "";
      case 5: return config.embedder !== "" && config.vectorDb !== "";
      case 6: return agentName.trim() !== "";
      case 7: return userPrompt.trim() !== "";
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <WizardProgress currentStep={currentStep} totalSteps={6} />

      <Card className="bg-white shadow-lg mt-8">
        <CardContent className="p-8">
          <WizardSteps
            currentStep={currentStep}
            config={config}
            updateConfig={updateConfig}
            agentName={agentName}
            setAgentName={setAgentName}
          />

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-phil-purple hover:bg-purple-700 text-white"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || createAgentMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
