import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Bot, Wand2, MessageSquare, TrendingUp, Play } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-phil-dark mb-6">
            Build AI Agents Like a Pro
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            PHIL helps junior developers and "vibe coders" create, inspect, and tweak multi-agent AI flows using Langchain, LlamaIndex, CrewAI, and more. See what's under the hood and understand every step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              onClick={() => setLocation("/wizard")}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Start Building Agent
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 text-lg font-semibold transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-phil-purple rounded-full flex items-center justify-center mb-6">
              <Wand2 className="text-white h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-phil-dark mb-4">Agent Creation Wizard</h3>
            <p className="text-gray-600 leading-relaxed">
              Step-by-step UI for selecting frameworks, LLM providers, tools, and configurations. No coding required to get started.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-phil-pink rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="text-white h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-phil-dark mb-4">Interactive Chat</h3>
            <p className="text-gray-600 leading-relaxed">
              Chat with your agents in real-time, see code updates, and watch as agents reconfigure themselves dynamically.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <TrendingUp className="text-white h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-phil-dark mb-4">Cost & Performance</h3>
            <p className="text-gray-600 leading-relaxed">
              Get detailed cost estimates, performance analysis, and technical improvement suggestions for your agents.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
