import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth.tsx";
import { useLocation } from "wouter";
import { Bot, Brain, Plus, MessageSquare, Code, Edit, Trash2, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ["/api/agents"],
    enabled: !!user,
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      await apiRequest("DELETE", `/api/agents/${agentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({
        title: "Agent deleted",
        description: "Your agent has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete agent",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAgent = (agentId: number) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  const agents = agentsData?.agents || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-phil-dark">Your AI Agents</h2>
          <p className="text-gray-600 mt-2">Manage and monitor your created agents</p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
          onClick={() => setLocation("/wizard")}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Agent
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: Agent) => (
          <Card key={agent.id} className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-phil-pink rounded-full flex items-center justify-center">
                  <Bot className="text-white h-6 w-6" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-purple-600"
                    onClick={() => setLocation("/wizard")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => handleDeleteAgent(agent.id)}
                    disabled={deleteAgentMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-phil-dark mb-2">{agent.name}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {agent.config?.framework || "Custom"} + {agent.config?.llmProvider || "OpenAI"}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Est. Cost:</span>
                  <span className="font-semibold text-green-600">$0.05/query</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-800">
                    {new Date(agent.createdAt!).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  className="flex-1 bg-phil-purple hover:bg-purple-700 text-white"
                  onClick={() => setLocation(`/agents/${agent.id}/chat`)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                >
                  <Code className="mr-2 h-4 w-4" />
                  Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Analytics Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Usage Analytics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Agents:</span>
                <span className="font-bold">{agents.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Queries This Month:</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span className="font-bold">$0.00</span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
            >
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Empty state for new users */}
        {agents.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3 bg-white shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No agents yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Get started by creating your first AI agent. Use our wizard to configure everything step by step.
              </p>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                onClick={() => setLocation("/wizard")}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
