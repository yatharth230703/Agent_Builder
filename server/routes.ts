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
      
      // Determine which AI agent to use based on the creation flow
      if (req.body.flow === 'custom' && req.body.prompt) {
        // Use custom_code_agent for "I KNOW WHAT I'M DOING" route
        console.log('Using custom_code_agent for custom flow');
        
        const aiResponse = await fetch('http://localhost:5001/generate_custom_code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search_filter_custom: req.body.contextUrls || [],
            user_prompt: req.body.prompt
          })
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          generatedCode = aiData.generated_code || generatedCode;
        }
        
      } else if (req.body.flow === 'walkthrough' && req.body.config) {
        // Use walk_me_through_code_agent for wizard route
        console.log('Using walk_me_through_code_agent for walkthrough flow');
        
        const aiResponse = await fetch('http://localhost:5001/walkthrough_code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            search_filter_context: req.body.contextUrls || [],
            tech_stack: req.body.config,
            user_prompt: req.body.prompt || req.body.name
          })
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          generatedCode = aiData.generated_code || generatedCode;
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
      
      // Generate analysis for the created agent
      if (generatedCode !== '# Generated agent code will go here') {
        try {
          // Get tech review
          const techReviewResponse = await fetch('http://localhost:5001/tech_review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              search_filter_context: [],
              code: generatedCode
            })
          });
          
          // Get cost analysis
          const costAnalysisResponse = await fetch('http://localhost:5001/cost_analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: generatedCode })
          });
          
          const techReview = techReviewResponse.ok ? await techReviewResponse.json() : null;
          const costAnalysis = costAnalysisResponse.ok ? await costAnalysisResponse.json() : null;
          
          analysisData = {
            techReview: techReview?.analysis || {},
            costAnalysis: costAnalysis?.analysis || {}
          };
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

  // AI Chat endpoint - connects to Python AI server
  app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
    try {
      console.log('AI Chat request received:', req.body);
      
      // Step 1: Get response from chat_agent
      const chatResponse = await fetch('http://localhost:5001/chat_with_agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_filter_custom: req.body.contextUrls || [],
          code: req.body.currentCode || '',
          query: req.body.message,
          messages_incoming: req.body.messagesHistory || []
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`AI server responded with status: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      console.log('Chat agent response:', chatData);
      
      // Step 2: Pass the response through personality_agent for streaming
      const personalityResponse = await fetch('http://localhost:5001/get_agent_recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendations_prompt: "You are a helpful AI assistant. Please provide a friendly and engaging response.",
          user_prompt: chatData.response || chatData.message || "I've processed your request."
        })
      });

      let finalResponse = chatData.response || chatData.message;
      if (personalityResponse.ok) {
        const personalityData = await personalityResponse.json();
        finalResponse = personalityData.response || finalResponse;
      }
      
      // Update agent with generated code if provided
      if (chatData.generatedCode && req.body.agentId) {
        await supabaseAdmin
          .from('agents')
          .update({ python_script: chatData.generatedCode })
          .eq('id', parseInt(req.body.agentId))
          .eq('user_id', req.userId);
      }

      res.json({
        success: true,
        response: finalResponse,
        generatedCode: chatData.generatedCode,
        analysis: chatData.analysis
      });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "AI service unavailable" 
      });
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
