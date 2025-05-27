import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Brain, Lightbulb, FileText } from "lucide-react";

export default function Home() {
  const [userPrompt, setUserPrompt] = useState("");
  const [, setLocation] = useLocation();

  const handleWalkMeThrough = () => {
    if (!userPrompt.trim()) {
      return;
    }
    // Store prompt in localStorage for wizard to access
    localStorage.setItem("userPrompt", userPrompt);
    setLocation("/wizard");
  };

  const handleIKnowWhatImDoing = () => {
    if (!userPrompt.trim()) {
      return;
    }
    // Store prompt and navigate to URL input page
    localStorage.setItem("userPrompt", userPrompt);
    setLocation("/custom-urls");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5E6A3' }}>
      {/* Header */}
      <header className="bg-purple-400 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-8">
            <span className="font-bold text-white text-lg">Home</span>
            <Link href="/dashboard" className="text-white hover:text-purple-200">Dashboard</Link>
            <Link href="/login" className="text-white hover:text-purple-200">login</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">
          {/* Left Side - PHIL Circle */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-full bg-pink-500 flex flex-col items-center justify-center text-white p-8">
                <div className="absolute top-8 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-pink-500" />
                </div>
                <h1 className="text-4xl font-bold mb-2">PHIL:</h1>
                <h2 className="text-2xl font-bold mb-4">Cause Why bother?!</h2>
                <p className="text-sm text-center mb-2">
                  You insisted on vibe coding, now vibe code your agents too.
                </p>
                <p className="text-sm text-center">
                  Never open a documentation again ,cause why bother!
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Get Started */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">GET STARTED</h3>
              
              <Card className="bg-purple-200 border-none mb-4">
                <CardContent className="p-4">
                  <p className="text-sm text-purple-800 mb-3">
                    What do you want your agent to do that you couldn't bother doing yourself?
                  </p>
                  <Textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Describe what you want your AI agent to accomplish..."
                    className="min-h-[120px] border-purple-300 focus:border-purple-500 bg-white"
                  />
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  onClick={handleWalkMeThrough}
                  disabled={!userPrompt.trim()}
                  className="flex-1 bg-green-300 hover:bg-green-400 text-green-800 font-medium"
                >
                  WALK ME THROUGH
                </Button>
                <Button
                  onClick={handleIKnowWhatImDoing}
                  disabled={!userPrompt.trim()}
                  className="flex-1 bg-green-200 hover:bg-green-300 text-green-800 font-medium"
                >
                  I KNOW WHAT IM DOING
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="bg-purple-300 rounded-lg p-8 mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Motivation : Meet Phil</h3>
              <p className="text-gray-700 leading-relaxed">
                Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum 
                ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum 
                ipsum Lorem ipsum Lorem ipsum Lorem ipsum ipsum
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-400 rounded-full flex items-center justify-center">
                  <Brain className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-4 -right-4 bg-green-300 rounded-lg p-3 max-w-[200px]">
                  <p className="text-sm font-medium text-green-800">
                    As a language model, I couldn't care less that your dog died
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Me Section */}
        <div className="bg-purple-400 rounded-lg p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">About Me</h3>
              <p className="text-purple-100 leading-relaxed">
                Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum 
                ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum 
                ipsum Lorem ipsum Lorem ipsum Lorem ipsum ipsum
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-48 h-32 bg-gradient-to-br from-cyan-300 to-purple-300 rounded-lg flex items-center justify-center">
                <FileText className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}