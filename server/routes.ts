import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, insertAgentSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.status(201).json({ 
        user: { id: user.id, email: user.email, agentsCreated: user.agentsCreated },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({ 
        user: { id: user.id, email: user.email, agentsCreated: user.agentsCreated },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        user: { id: user.id, email: user.email, agentsCreated: user.agentsCreated }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get user" });
    }
  });

  // Agent routes
  app.get("/api/agents", authenticateToken, async (req: any, res) => {
    try {
      const agents = await storage.getAgentsByUserId(req.userId);
      res.json({ agents });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get agents" });
    }
  });

  app.get("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent || agent.userId !== req.userId) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json({ agent });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get agent" });
    }
  });

  app.post("/api/agents", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertAgentSchema.parse({
        ...req.body,
        userId: req.userId
      });
      
      const agent = await storage.createAgent(validatedData);
      res.status(201).json({ agent });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent || agent.userId !== req.userId) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const updatedAgent = await storage.updateAgent(agentId, req.body);
      res.json({ agent: updatedAgent });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", authenticateToken, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent || agent.userId !== req.userId) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const deleted = await storage.deleteAgent(agentId);
      if (deleted) {
        res.json({ message: "Agent deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete agent" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete agent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
