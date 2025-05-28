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
      const agentData = {
        user_id: req.userId,
        name: req.body.name || 'Custom Agent',
        python_script: req.body.pythonScript || '# Generated agent code will go here'
      };
      
      const { data: agent, error } = await supabaseAdmin
        .from('agents')
        .insert(agentData)
        .select()
        .single();

      if (error) throw error;
      
      res.status(201).json({ agent });
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
