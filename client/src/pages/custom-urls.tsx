import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";


export default function CustomUrls() {
  const [userPrompt, setUserPrompt] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get user prompt from localStorage
    const prompt = localStorage.getItem("userPrompt");
    if (prompt) {
      setUserPrompt(prompt);
    } else {
      // Redirect back to home if no prompt
      setLocation("/");
    }
  }, [setLocation]);

  const addUrlField = () => {
    if (urls.length < 10) {
      setUrls([...urls, ""]);
    }
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleProceed = async () => {
    const validUrls = urls.filter((url) => url.trim() !== "");

    if (validUrls.length === 0) {
      toast({
        title: "No URLs provided",
        description: "Please add at least one URL to support your agent",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    // 1) Get Supabase session (includes the JWT)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setIsCreating(false);
      return toast({
        title: "Not logged in",
        description: "Please log in before creating an agent",
        variant: "destructive",
      });
    }

    // 2) Send the POST with Authorization header
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: "Custom Agent",
          prompt: userPrompt,
          flow: "custom",
          config: {
            approach: "custom",
            framework: "vanilla",
            llmProvider: "perplexity",
            toolUse: "enabled",
            embedder: "default",
            vectorDb: "memory",
            customUrls: validUrls,
          },
          contextUrls: validUrls,
        }),
      });

      if (!response.ok) throw new Error();

      const { agent } = await response.json();
      toast({
        title: "Agent created!",
        description: "Your agent is ready to chat",
      });
      setLocation(`/agents/${agent.id}/chat`);
    } catch {
      toast({
        title: "Error creating agent",
        description: "Please try again or use the wizard flow",
        variant: "destructive",
      });
    }
  };


  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5E6A3' }}>
      {/* Header */}
      <header className="bg-purple-400 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex space-x-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-white hover:text-purple-200 hover:bg-purple-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
            <span className="font-bold text-white text-lg">Custom URLs</span>
          </div>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Custom Knowledge Sources</CardTitle>
            <p className="text-gray-600 text-center">
              Add up to 10 URLs that contain information relevant to your agent's task
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display User Prompt */}
            <div className="bg-purple-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Your Agent Description:</h3>
              <p className="text-gray-700">{userPrompt}</p>
            </div>

            {/* URL Input Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Supporting URLs</h3>
              <p className="text-sm text-gray-600">
                Provide URLs to documentation, articles, datasets, or any other sources that should inform your agent's knowledge
              </p>
              
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    placeholder={`https://example.com/relevant-info-${index + 1}`}
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    className={`flex-1 ${url && !isValidUrl(url) ? 'border-red-300' : ''}`}
                  />
                  {urls.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeUrlField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {urls.length < 10 && (
                <Button
                  variant="outline"
                  onClick={addUrlField}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another URL ({urls.length}/10)
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button
                onClick={handleProceed}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                Create Agent & Start Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}