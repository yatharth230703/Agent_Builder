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

      // Generate real agent code for custom flow
      if (req.body.prompt && req.body.flow === 'custom') {
        console.log('Generating custom agent code for:', req.body.prompt);
        
        try {
          console.log('Using integrated Perplexity API for code generation');
          
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "sonar-reasoning-pro",
              messages: [
                {
                  role: "system",
                  content: `You are a world-class AI engineer with deep expertise in LLM agents, information-retrieval and Python tooling. Generate complete Python scripts that solve the user's task by programmatically pulling relevant knowledge from the provided websites.

**Formatting Instructions: Your response MUST use this XML wrapper**

<root>
    <Name>
    [A witty name for this agent related to what it does]
    </Name>
    <CLI>
    [terminal commands required before running the script]
    </CLI>
    <python>
    [the complete Python program]
    </python>
    <Conclusion>
    [clear explanation + ONE follow-up question]
    </Conclusion>
</root>`
                },
                {
                  role: "user",
                  content: req.body.prompt
                }
              ],
              search_domain_filter: req.body.contextUrls || [],
              max_tokens: 3000,
              temperature: 0.2
            })
          });

          if (perplexityResponse.ok) {
            const perplexityData = await perplexityResponse.json();
            const responseText = perplexityData.choices?.[0]?.message?.content;
            
            if (responseText) {
              console.log('Perplexity API Response:', responseText.substring(0, 500) + '...');
              // Extract Python code from XML response
              const pythonMatch = responseText.match(/<python>([\s\S]*?)<\/python>/);
              if (pythonMatch) {
                generatedCode = pythonMatch[1].trim();
                console.log('Successfully extracted Python code:', generatedCode.substring(0, 200) + '...');
              } else {
                console.log('No Python code found in response, checking for code blocks');
                // Fallback: look for code blocks
                const codeBlockMatch = responseText.match(/```python([\s\S]*?)```/);
                if (codeBlockMatch) {
                  generatedCode = codeBlockMatch[1].trim();
                  console.log('Found code in markdown blocks');
                }
              }
            }
          }
        } catch (perplexityError) {
          console.error('Perplexity generation failed:', perplexityError);
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

  // AI Chat endpoint - uses Perplexity API directly
  app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
    try {
      console.log('AI Chat request received:', req.body);

      const { message, agentId } = req.body;

      // Get agent context
      const { data: agent } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', req.userId)
        .single();

      // Generate chat response using Perplexity API
      const chatResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `You are an AI assistant helping with: ${agent?.name || 'general tasks'}. Be helpful and conversational. Context: This agent was created for "${agent?.python_script ? 'Python development' : 'general assistance'}".`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        const finalResponse = chatData.choices?.[0]?.message?.content || "I'm here to help! What would you like to know?";

        res.json({
          success: true,
          response: finalResponse
        });
      } else {
        throw new Error('Chat API request failed');
      }
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.json({ 
        success: true,
        response: "I'm here to help! What would you like to work on today?"
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

  // Helper function to parse XML response to JSON
  function xmlToJson(xmlString: string): Record<string, string> {
    try {
      const result: Record<string, string> = {};
      const globalRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
      let match;
      while ((match = globalRegex.exec(xmlString)) !== null) {
        const [, tag, content] = match;
        result[tag] = content.trim();
      }
      return result;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return { error: `Failed to parse XML: ${error}` };
    }
  }

  // AI Recommendations endpoint (migrated from Python)
  app.post("/api/ai/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const { prompt, config } = req.body;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: "You are an AI agent configuration expert. Provide recommendations for building AI agents based on user requirements. Format your response in XML with <recommendations> tags."
            },
            {
              role: "user",
              content: `Provide agent configuration recommendations for: ${prompt}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const recommendations = xmlToJson(content);
        
        res.json({
          success: true,
          recommendations
        });
      } else {
        throw new Error('Recommendations API request failed');
      }
    } catch (error: any) {
      console.error('AI recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // AI Walkthrough endpoint (migrated from Python)
  app.post("/api/ai/walkthrough", authenticateToken, async (req: any, res) => {
    try {
      const { prompt, options, techStack } = req.body;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `You are a code walkthrough expert. Generate detailed code explanations and implementations using ${techStack}. Format your response in XML with <Name>, <CLI>, <python>, and <Conclusion> tags.`
            },
            {
              role: "user",
              content: `Walk me through implementing: ${prompt}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = xmlToJson(content);
        
        res.json({
          success: true,
          name: parsed.Name || "",
          cli: parsed.CLI || "",
          python: parsed.python || "",
          conclusion: parsed.Conclusion || ""
        });
      } else {
        throw new Error('Walkthrough API request failed');
      }
    } catch (error: any) {
      console.error('AI walkthrough error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // AI Tech Review endpoint (migrated from Python)
  app.post("/api/ai/tech-review", authenticateToken, async (req: any, res) => {
    try {
      const { pythonScript, searchContext } = req.body;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: "You are a senior code reviewer. Analyze Python code and provide technical feedback. Format your response in XML with <ScriptSummary>, <TechnicalImprovements>, <FeatureSuggestions>, and <Conclusion> tags."
            },
            {
              role: "user",
              content: `Review this Python code:\n\`\`\`python\n${pythonScript}\n\`\`\``
            }
          ],
          max_tokens: 1500,
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = xmlToJson(content);
        
        res.json({
          success: true,
          scriptSummary: parsed.ScriptSummary || "",
          technicalImprovements: parsed.TechnicalImprovements || "",
          featureSuggestions: parsed.FeatureSuggestions || "",
          conclusion: parsed.Conclusion || ""
        });
      } else {
        throw new Error('Tech review API request failed');
      }
    } catch (error: any) {
      console.error('AI tech review error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // AI Cost Analysis endpoint (migrated from Python)
  app.post("/api/ai/cost-analysis", authenticateToken, async (req: any, res) => {
    try {
      const { pythonScript } = req.body;
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: "You are a cost analysis expert for AI applications. Analyze Python code for resource usage and cost implications. Format your response in XML with <CostBreakdown>, <OptimizationSuggestions>, and <TotalEstimate> tags."
            },
            {
              role: "user",
              content: `Analyze the cost implications of this Python script:\n\`\`\`python\n${pythonScript}\n\`\`\``
            }
          ],
          max_tokens: 1000,
          temperature: 0.2
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = xmlToJson(content);
        
        res.json({
          success: true,
          costBreakdown: parsed.CostBreakdown || "",
          optimizationSuggestions: parsed.OptimizationSuggestions || "",
          totalEstimate: parsed.TotalEstimate || ""
        });
      } else {
        throw new Error('Cost analysis API request failed');
      }
    } catch (error: any) {
      console.error('AI cost analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
