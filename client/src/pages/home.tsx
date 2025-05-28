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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5E6A3' }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Main Hero Section - Enlarged */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - PHIL Circle - Enlarged */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-96 h-96 rounded-full bg-pink-500 flex flex-col items-center justify-center text-white p-12">
                  <div className="absolute top-12 w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-pink-500" />
                  </div>
                  <h1 className="text-5xl font-bold mb-3">PHIL:</h1>
                  <h2 className="text-3xl font-bold mb-6">Cause Why bother?!</h2>
                  <p className="text-base text-center mb-3">
                    You insisted on vibe coding, now vibe code your agents too.
                  </p>
                  <p className="text-base text-center">
                    Never open a documentation again ,cause why bother!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Get Started - Enlarged */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg p-8">
                <h3 className="text-2xl font-semibold mb-6">GET STARTED</h3>
                
                <Card className="bg-purple-200 border-none mb-6">
                  <CardContent className="p-6">
                    <p className="text-base text-purple-800 mb-4">
                      What do you want your agent to do that you couldn't bother doing yourself?
                    </p>
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Describe what you want your AI agent to accomplish..."
                      className="min-h-[150px] border-purple-300 focus:border-purple-500 bg-white text-base"
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-6">
                  <Button
                    onClick={handleWalkMeThrough}
                    disabled={!userPrompt.trim()}
                    className="flex-1 bg-green-300 hover:bg-green-400 text-green-800 font-medium py-4 text-base"
                  >
                    WALK ME THROUGH
                  </Button>
                  <Button
                    onClick={handleIKnowWhatImDoing}
                    disabled={!userPrompt.trim()}
                    className="flex-1 bg-green-200 hover:bg-green-300 text-green-800 font-medium py-4 text-base"
                  >
                    I KNOW WHAT IM DOING
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Motivation Section */}
      <footer className="bg-purple-300 p-8">
        <div className="max-w-7xl mx-auto">
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
      </footer>

      {/* About Me Footer */}
      <footer className="bg-purple-400 p-8">
        <div className="max-w-7xl mx-auto">
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
      </footer>
    </div>
  );
}