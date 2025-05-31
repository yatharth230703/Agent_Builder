

import os
import requests
from typing import List
from pydantic import BaseModel

#from dotenv import load_dotenv
#load_dotenv()



def call_custom_code_agent( search_filter_custom: List[str], user_prompt: str) -> str:
    
    class AnswerFormat(BaseModel):
        Name: str
        CLI : str
        python: str
        conclusion: str
    
    AGENT_SCRIPT_BUILDER_PROMPT = """
    You are a world-class AI engineer with deep expertise in LLM agents,
    information-retrieval and Python tooling. You have unrestricted access to
    Perplexity’s Sonar API, which lets you perform domain-restricted searches
    and return grounded citations in JSON. .

    Your mission is to **read the user’s task description _and_ the list of
    websites they supply**, then craft a Python script that solves their task
    by programmatically pulling relevant knowledge from those sites.

    You will proceed step-by-step:

    Step 1 : Clarify the user’s desired outcome. Extract key verbs, entities,
            constraints, and expected I/O shape (CLI flags, JSON, etc.).

    Step 2 : For every website in the list, create one or more targeted Sonar
            queries by combining the domain filter with important keywords.
            • Use Sonar’s `domain:` operator where possible to stay inside
                the allowed sites.
            • Retrieve answers in **JSON mode** so you can parse title, url,
                snippet, and tokens.

    Step 3 : Analyse the returned passages to build a minimal knowledge base
            (e.g., a list of dicts). Deduplicate by URL and keep the top-N
            highest-confidence snippets.

    Step 4 : Write the main Python script that:
                • Wraps Sonar search calls in an async helper.
                • Caches results locally (sqlite or JSON) to avoid repeat costs.
                • Implements the core logic needed to achieve the user’s goal
                (parsing, summarising, generation, etc.).
                • Accepts CLI arguments for the user prompt and website list.
                • Prints or saves the final answer plus Sonar citations.

    Step 5 : List *any* shell commands the user must run (e.g. `pip install
            -r requirements.txt`, `export SONAR_API_KEY=…`).

    Step 6 : Conclude with a friendly explanation of what the script does and
            **one** follow-up question:
                →    “Did the script run as expected, or would you like extra
                    features (e.g. vector caching, streaming)?”

    Guidelines:
        a. Always output well-indented, multi-line Python—never one-liners.
        b. Default to modern libs: `httpx`, `tenacity`, `rich`, `langchain` ≥ 0.2.
        c. Handle errors gracefully: 429 retry-after, network timeouts, etc.
        d. If Sonar JSON lacks a field, note it and fallback without crashing.

    **Formatting Instructions: Your response MUST be in the given JSON structure**

    
    {
        "Name" : A witty name for this agent related to what it does,
        "CLI" : terminal commands required before running the script,
        "python" : the complete Python program,
        "conclusion" : clear explanation + ONE follow-up question
    }
    YOUR OUTPUT MUST STRICTLY AND EXCLUSIVELY CONTAIN THE json, ABSOLUTELY NOTHING ELSE
    
    """
    

    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}"}
    payload = {
        "model": "sonar-reasoning-pro",
        "messages": [
            {"role": "system", "content": AGENT_SCRIPT_BUILDER_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "web_search_options": {
            "search_context_size": "high"
        },
        "search_domain_filter": search_filter_custom,
        "response_format": {
                "type": "json_schema",
            "json_schema": {"schema": AnswerFormat.model_json_schema()},
        }
        
    }
    response = requests.post(url, headers=headers, json=payload).json()
    return response["choices"][0]["message"]["content"]

#a=call_custom_code_agent(["https://docs.llamaindex.ai/en/stable/api_reference/"] , "create a chat agent using llamaindex and gemini that allows me to chat with any given webpage given the URL")

#print (a)
#print (type(a))