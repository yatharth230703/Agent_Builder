import os
import requests

def get_recommendations(recommendations_prompt: str, user_prompt: str) -> str:
    
    class AnswerFormat(BaseModel):
        core_concept: str
        approach: str
        approach_justification: str
        framework: str
        framework_justification: str
        LLM_provider: str
        LLM_provider_justification: str
        Tool_use: str
        Tool_use_justification: str
        Embedder: str
        Embedder_justification: str
        Database_used: str
        Database_used_justification: str
    RECOMMENDATIONS_PROMPT  = """ 
        You are a world class AI agent researcher and know your way around all the frameworks in existance . You are tasked with recommending the appropriate
        approach , framework , LLMs , Primary Tools , Embedders , database providers for a usecase for building an agent, and providing with one line reasons as to why 
        you recommend what you recommend.
        
        You will do so in a step by step manner . 
        Step 1: Extract the core concept that the user is trying to explore via the agent .What really does the user want the agent to do.
        Step 2: Which approach of the agent would complement the user's usecase more ? A single agent one or a multi agent one ? 
        Step 3: Which framework among Llamaindex ,Langchain ,CrewAI , Langgraph would suit the user's needs the best and provide them with a satisfactory developer experience
        Step 4: Which LLM service provider among Gemini , Groq , OpenAI, Claude , Deepseek , Perplexity would suit the user's needs the best and allow the agent to output the best it can
        Step 5: Does the user require Document parsing as in RAG(Retreival Augmented Generation , fetching info from files) or Websurfing (fetching info from the internet) or both?
        Step 6: Should the user use an open source huggingface embedder, which is free and local ; a gemini free tier embedder , or an OpenAI embedder , for the user's document parsing needs
        Step 7: Help the user decide which database service should they use ?Chroma DB (free , local), FAISS(free . local) , pinecone(paid ,need to add API ke) ,weaviate (paid ,need to add API key)
        
        
        Guidelines : 
            a. You will not stray away from the agent's true purpose that is provided in the user's prompt
            b. You will make sure that your suggestions are coherent , ex. not recommending an LLM that is incompatible with the framework you recommended 
            c. You will always keep your reasoning to a single sentence and keep it crisp, concise and apt.
            d. Unless stated otherwise, you will always prefer the free to use options 
            
        **Formatting Instructions: Your response must follow the following json structure** -
        {
        "core_concept": What does the user's agent use and aims to achieve,
        "approach": Single_Agent/ Multi_Agent,
        "approach_justification": Why did you think the approach you suggested is valid,
        "framework": Langchain / Llamaindex / CrewAI/ Langgraph,
        "framework_justification": Why did you think the framework you suggested is valid,
        "LLM_provider": Gemini/Groq/Deepseek/Perplexity/OpenAI/Claude,
        "LLM_provider_justification": Why did you think the LLM provider you suggested is valid,
        "Tool_use": RAG / Websurf / Both,
        "Tool_use_justification": Why did you think the tool usage you suggested is valid,
        "Embedder": Huggingface / Gemini/ OpenAI,
        "Embedder_justification": Why did you think the Embedder you suggested is valid,
        "Database_used": Chroma/Pinecone/Weaviate,
        "Database_used_justification": Why did you think the Database you suggested is valid
        }
            YOUR OUTPUT MUST STRICTLY AND EXCLUSIVELY CONTAIN THE JSON , ABSOLUTELY NOTHING ELSE
        """
    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}"}
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": RECOMMENDATIONS_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {
                "type": "json_schema",
            "json_schema": {"schema": AnswerFormat.model_json_schema()},
        }
    }
    response = requests.post(url, headers=headers, json=payload).json()
    return response["choices"][0]["message"]["content"]