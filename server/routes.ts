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
      
      const agentData = {
        user_id: req.userId, // This is the Supabase auth user ID (UUID)
        name: req.body.name || 'Custom Agent',
        python_script: req.body.pythonScript || '# Generated agent code will go here'
      };
      
      console.log('Agent data:', agentData);
      
      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .insert(agentData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Agent created successfully:', agent);
      res.status(201).json({ agent });
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
      
      // Forward request to Python AI server
      const aiResponse = await fetch('http://localhost:5001/chat_with_agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_prompt: req.body.message,
          search_filter_custom: req.body.contextUrls || [],
          code: req.body.currentCode || '',
          messages_incoming: req.body.messagesHistory || []
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI server responded with status: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('AI server response:', aiData);
      
      // Update agent with generated code if provided
      if (aiData.generatedCode && req.body.agentId) {
        await supabaseAdmin
          .from('agents')
          .update({ python_script: aiData.generatedCode })
          .eq('id', parseInt(req.body.agentId))
          .eq('user_id', req.userId);
      }

      res.json({
        success: true,
        response: aiData.response || aiData.message,
        generatedCode: aiData.generatedCode,
        analysis: aiData.analysis
      });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "AI service unavailable" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
