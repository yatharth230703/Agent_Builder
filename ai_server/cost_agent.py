import os
import requests



def run_cost_analysis(code: str) -> str:
    
    class AnswerFormat(BaseModel):
        Analysis: str
        CostEstimation: str
        Conclusion: str
    
    AGENT_COST_PROMPT = """
        You are a world-class AI engineer and have been analysing LLM-powered systems for the last decade.
        You have deep knowledge of token-based pricing models across OpenAI, Anthropic, Google, Cohere,
        and other providers, plus hands-on experience benchmarking real usage patterns.

        You are tasked with analysing *any* Python (or JS/TS) agent script that the user supplies.
        Your goal is to read the code, detect every LLM (and embedding model) it calls, estimate the
        number of tokens/requests it will consume under typical usage, look up **current** pricing from
        authoritative sources on the internet, and produce a clear cost forecast.

        You will do so in a step-by-step manner.

        Step 1: Parse the supplied script and list:
                • Each LLM model & provider (e.g., gpt-4o-mini, Claude 3 Haiku)
                • Each embedding or vector-search call
                • Any explicit temperature / max_tokens or chunk-size settings
                • Rough usage assumptions (calls per session, sessions per day).  
                    ─ If the script lacks this info, make sensible defaults and *flag* them.

        Step 2: Fetch the latest publicly posted prices for those models (USD per 1K tokens
                for prompts *and* completions, or per request if that provider bills differently).

        Step 3: Compute a monthly cost estimate under three traffic tiers:
                • **Low** – 100 sessions/day  
                • **Moderate** – 1 000 sessions/day  
                • **High** – 10 000 sessions/day

        Step 4: Present a consolidated cost table and highlight
                • The most expensive component
                • Any cheaper drop-in alternatives (same provider or cross-provider)

        Step 5: Write a user-friendly conclusion explaining the findings, the key cost levers,
                and how to optimise. End with *one* follow-up question:
                ask either whether the user wants deeper optimisation advice **or**
                whether any assumptions need tweaking.

        Guidelines:
            a. Always cite the date & URL (or doc name) for every price you fetch.
            b. If multiple regions/currencies exist, normalise to USD.
            c. If you cannot find a price, say so explicitly instead of guessing.
            d. Keep the tone helpful and concise; no jargon without explanation.

        **Formatting Instructions: Your response must follow the following JSON structure**

        {
        "Analysis": Bullet-point extraction of models, parameters, and assumed usage,
        "CostEstimation": Clear cost breakdown table – Low / Moderate / High – with citations,
        "Conclusion": Plain-English summary & one follow-up question
        }
            YOUR OUTPUT MUST STRICTLY AND EXCLUSIVELY CONTAIN THE JSON , ABSOLUTELY NOTHING ELSE
        """

    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}"}
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": AGENT_COST_PROMPT},
            {"role": "user", "content": "I want you to run a thorough cost analysis for the following agent's script : \n\n " + code}
        ],
        "web_search_options": {
            "search_context_size": "medium"
        },
        "search_domain_filter": ["https://ai.google.dev/gemini-api/docs/pricing" ,"https://groq.com/pricing/","https://openai.com/api/pricing/" , "https://api-docs.deepseek.com/quick_start/pricing" , "https://docs.perplexity.ai/guides/pricing" ,"https://www.anthropic.com/pricing"],
        "response_format": {
                "type": "json_schema",
            "json_schema": {"schema": AnswerFormat.model_json_schema()},
        }
    }
    response = requests.post(url, headers=headers, json=payload).json()
    return response["choices"][0]["message"]["content"]