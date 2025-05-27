import { users, agents, type User, type InsertUser, type Agent, type InsertAgent } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Agent methods
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private currentUserId: number;
  private currentAgentId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.currentUserId = 1;
    this.currentAgentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      agentsCreated: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Agent methods
  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.userId === userId,
    );
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = { 
      ...insertAgent, 
      id,
      pythonScript: insertAgent.pythonScript || "",
      createdAt: new Date()
    };
    this.agents.set(id, agent);

    // Update user's agent count
    const user = this.users.get(insertAgent.userId);
    if (user) {
      user.agentsCreated = (user.agentsCreated ?? 0) + 1;
      this.users.set(user.id, user);
    }

    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const agent = this.agents.get(id);
    if (!agent) return false;

    this.agents.delete(id);

    // Update user's agent count
    const user = this.users.get(agent.userId);
    if (user && (user.agentsCreated ?? 0) > 0) {
      user.agentsCreated = (user.agentsCreated ?? 0) - 1;
      this.users.set(user.id, user);
    }

    return true;
  }
}

export const storage = new MemStorage();
