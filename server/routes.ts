import 'dotenv/config'
import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabaseAdmin } from "./supabase";
import { insertAgentSchema } from "@shared/schema";

// Middleware to verify Supabase JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.log('Auth error:', error);
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Store user info for use in routes
    req.user = user;
    req.userId = user.id; // This is the Supabase user ID (UUID format)

    console.log('Authenticated user:', user.email, 'ID:', user.id);
    next();
  } catch (error) {
    console.log('Token validation error:', error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Agent routes - auth handled by Supabase directly
  app.get("/api/agents", authenticateToken, async (req: any, res) => {
    try {
      const { data: agents, error } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('user_id', req.userId);

      if (error) throw error;

      res.json({ agents });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get agents" });
    }
  });

  app.get("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);

      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', req.userId)
        .single();

      if (error || !agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json({ agent });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get agent" });
    }
  });

  app.post("/api/agents", authenticateToken, async (req: any, res) => {
    try {
      console.log('Creating agent for user:', req.userId);
      console.log('Agent creation request:', req.body);

      let generatedCode = '# Generated agent code will go here';
      let analysisData = null;

      // Generate real agent code for custom flow by calling AI server
      if (req.body.prompt && req.body.flow === 'custom') {
        console.log('Requesting custom agent code from AI server for:', req.body.prompt);

        try {
          const aiServerResponse = await fetch('http://127.0.0.1:5001/api/ai/custom', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: req.body.prompt,
              searchFilters: req.body.contextUrls || [] // Map contextUrls to searchFilters
            })
          });

          if (aiServerResponse.ok) {
            const aiServerData = await aiServerResponse.json();
            // Check if the AI server returned a successful response with python code
            if (aiServerData.success && aiServerData.python) {
              generatedCode = aiServerData.python;
              console.log('Successfully received Python code from AI server.');
            } else {
              console.log('AI server response did not contain generated code or was not successful:', aiServerData);
              // Optionally handle cases where AI server fails or returns no code
              // For now, generatedCode remains the default placeholder
            }
          } else {
            console.error('AI server request failed:', aiServerResponse.status, aiServerResponse.statusText);
            // Handle non-OK responses from AI server
            // For now, generatedCode remains the default placeholder
          }
        } catch (aiServerError) {
          console.error('Error calling AI server for custom code:', aiServerError);
          // Handle network errors or other exceptions during the fetch call
          // For now, generatedCode remains the default placeholder
        }
      }

      const agentData = {
        user_id: req.userId,
        name: req.body.name || 'Custom Agent',
        python_script: generatedCode
      };

      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .insert(agentData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Generate analysis for the created agent using Perplexity
      if (generatedCode !== '# Generated agent code will go here') {
        try {
          const analysisResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "llama-3.1-sonar-small-128k-online",
              messages: [
                {
                  role: "system",
                  content: "You are a technical code reviewer. Analyze Python code and provide technical review and cost analysis in JSON format."
                },
                {
                  role: "user",
                  content: `Analyze this Python code and provide:
                  1. Technical review (strengths, weaknesses, improvements)
                  2. Cost analysis (API usage, resource requirements)

                  Code:
                  \`\`\`python
                  ${generatedCode}
                  \`\`\`

                  Return analysis in JSON format with techReview and costAnalysis properties.`
                }
              ],
              temperature: 0.2,
              max_tokens: 1000
            })
          });

          if (analysisResponse.ok) {
            const analysisData_raw = await analysisResponse.json();
            const analysisText = analysisData_raw.choices?.[0]?.message?.content;

            if (analysisText) {
              try {
                // Try to parse JSON response
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  analysisData = JSON.parse(jsonMatch[0]);
                } else {
                  // Fallback to basic analysis
                  analysisData = {
                    techReview: { summary: analysisText.substring(0, 500) },
                    costAnalysis: { summary: "Analysis completed" }
                  };
                }
              } catch (jsonError) {
                analysisData = {
                  techReview: { summary: analysisText.substring(0, 500) },
                  costAnalysis: { summary: "Analysis completed" }
                };
              }
            }
          }
        } catch (analysisError) {
          console.error('Analysis generation failed:', analysisError);
        }
      }

      console.log('Agent created successfully:', agent);
      res.status(201).json({ 
        agent,
        analysis: analysisData
      });
    } catch (error: any) {
      console.error('Failed to create agent:', error);
      res.status(400).json({ message: error.message || "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);

      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .update(req.body)
        .eq('id', agentId)
        .eq('user_id', req.userId)
        .select()
        .single();

      if (error) throw error;

      res.json({ agent });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);

      const { error } = await supabaseAdmin
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', req.userId);

      if (error) throw error;

      res.json({ message: "Agent deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete agent" });
    }
  });

  // Endpoint to get initial analysis when loading a chat
  app.get("/api/agents/:id/analysis", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);

      // Get agent data
      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', req.userId)
        .single();

      if (error || !agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      // Generate fresh analysis
      const techReviewResponse = await fetch('http://localhost:5001/tech_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_filter_context: [],
          code: agent.python_script
        })
      });

      const costAnalysisResponse = await fetch('http://localhost:5001/cost_analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: agent.python_script })
      });

      const techReview = techReviewResponse.ok ? await techReviewResponse.json() : null;
      const costAnalysis = costAnalysisResponse.ok ? await costAnalysisResponse.json() : null;

      const analysisData = {
        techReview: techReview?.analysis || {},
        costAnalysis: costAnalysis?.analysis || {}
      };

      res.json({ analysis: analysisData });
    } catch (error: any) {
      console.error('Analysis error:', error);
      res.status(500).json({ message: error.message || "Failed to get analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
