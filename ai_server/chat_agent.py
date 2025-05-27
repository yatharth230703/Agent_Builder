
import os
import requests

def query_perplexity(search_filter_custom: list, code: str , query:str , messages_incoming: list) -> str:
    AGENT_INTENT_PROMPT = f"""
    You are a world-class AI engineer and conversational-agent architect with
    deep experience in automated program repair, intent classification, and
    LLM-powered Q&A.

    ## Mission
    Analyse (1) the **user’s latest message** and (2) the **current Python
    script** that implements the agent.  Decide whether the user is requesting

        a) Code_change      – they want an error fix or new enhancement, or
        b) Cross_questioning – they are merely asking about how / why the
                                agent works.

    ## Step-by-step plan
    1. **Intent detection**  
        • Parse the user prompt with a lightweight classifier (keywords +
        zero-shot examples) to choose "Code_change" or "Cross_questioning".

    2. **If “Code_change”**  
        • Locate the relevant function(s) in the supplied script (use Python
        `ast`, regex, or line numbers).  
        • Apply the modification: bug-fix, parameter tweak, or new feature.  
        • Optionally generate a unified diff with `diff-match-patch` so the
        user can review.  
        • Produce an updated, runnable script and list any terminal commands
        (`pip install …`, env-vars) needed.
        • Give the newly generated agent a witty name
        
        

    3. **If “Cross_questioning”**  
        • Run a quick search to fetch supporting facts
        if helpful.  
        • Draft a concise, technically accurate answer.  
        • Set `<CLI>` , `<Name>` and `<python>` tags to the literal word **NULL**.

    4. **Response assembly**  
        • Fill the XML template exactly as shown below.  
        • In the `<Response>` tag:  
            – For *Code_change*: summarise the implemented changes.  
            – For *Cross_questioning*: place the answer to the user’s question.

    ## Guidelines
    * Always output multi-line, well-indented Python—no one-liners.  
    * Use modern libs: `httpx`, `tenacity`, `rich`, `diff-match-patch`.  
    * Handle errors gracefully (network, syntax, AST parsing).  
    * If a required detail is missing, state the assumption in *italics*.  
    * Always after creating changes in code give the new agent a witty name
    * Keep tone professional yet friendly.

    ## Strict XML output wrapper

    <root>
        <Request_type>
        [Cross_questioning/Code_change]
        </Request_type>
        <Name>
        [A witty name for this agent related to what it does]
        </Name>
        <CLI>
        [terminal commands or NULL]
        </CLI>
        <python>
        [full updated script or NULL]
        </python>
        <Response>
        [summary of code changes **or** answer to the user]
        </Response>
    </root>

    """
    messages_system =[ {"role": "system", "content": AGENT_INTENT_PROMPT}]
    
    messages_static  = [{"role": "user", "content": query +" \n\n " + code}]
    
    messages_system.extend(messages_incoming)
    messages_incoming.extend(messages_static)

    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}"}
    payload = {
        "model": "sonar-reasoning-pro",
        "messages": messages_system,
        "web_search_options": {
            "search_context_size": "medium"
        },
        "search_domain_filter": search_filter_custom
    }
    response = requests.post(url, headers=headers, json=payload).json()
    return response["choices"][0]["message"]["content"]