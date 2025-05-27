import requests
from typing import List
import sseclient
import json
from chat_agent import query_perplexity
from recommendations_agent import get_recommendations
from tech_review_agent import run_tech_review
from walk_me_through_code_agent import walk_me_through_code_agent
from cost_agent import run_cost_analysis
from custom_code_agent import call_custom_code_agent
from personality_agent import stream_personality_response
import xml.etree.ElementTree as ET
import html
import re

user_prompt = "I want to build an agent that can chat with me about my documents"

search_contxt=[]
def xml_to_json(xml_string: str) -> dict:
    def escape_text_content(xml_str: str) -> str:
        return re.sub(
            r'>([^<]+)<',
            lambda m: f">{html.escape(m.group(1))}<",
            xml_str
        )

    safe_xml = escape_text_content(xml_string)
    try:
        root = ET.fromstring(safe_xml)
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML: {e}")
    def element_to_dict(elem):
        return {
            child.tag: html.unescape((child.text or "").strip())
            for child in elem
        }

    return element_to_dict(root)

path=1

name={}
cli={}
python={}
conclusion={}

if (path==1):

    recommendations = get_recommendations(user_prompt)
    options_json = {}
    justifications_json ={}

    main_json = xml_to_json(recommendations)

    def split_json_by_justification(data: dict) -> tuple[dict, dict]:
        justification_json = {}
        others_json = {}
        
        for key, value in data.items():
            if 'justification' in key.lower():
                justification_json[key] = value
            else:
                others_json[key] = value

        return justification_json, others_json

    justifications_json , options_json  = split_json_by_justification(main_json)
    #### Justifications streamed to the frontend 
    options_json_string = json.dumps(options_json, indent=2)

    search_filter_context =[]
    def handle_agent_config(tag: str, value: str):
        match tag:
            case "approach":
                match value:
                    case "Single_Agent":
                        print("You selected a single-agent setup.")
                    case "Multi_Agent":
                        print("You selected a multi-agent setup.")
                    case _:
                        print("Unknown approach selected.")

            case "framework":
                match value:
                    case "Langchain":
                        print("Langchain selected.")
                        search_filter_context.append("https://python.langchain.com/docs/introduction/")
                        search_filter_context.append("https://python.langchain.com/api_reference/")
                        search_filter_context.append("https://github.com/langchain-ai/langchain/tree/master/cookbook")
                    case "LlamaIndex":
                        print("LlamaIndex selected.")
                        search_filter_context.append("https://docs.llamaindex.ai/en/stable/")
                        search_filter_context.append("https://docs.llamaindex.ai/en/stable/api_reference/")
                        search_filter_context.append("https://docs.llamaindex.ai/en/stable/examples/")
                    case "CrewAI":
                        print("CrewAI selected.")
                        search_filter_context.append("https://docs.crewai.com/api-reference/introduction")
                        search_filter_context.append("https://docs.crewai.com/introduction")
                        search_filter_context.append("https://github.com/crewAIInc/crewAI-examples")
                    case "Langgraph":
                        print("Langgraph selected.")
                        search_filter_context.append("https://langchain-ai.github.io/langgraph/")
                        search_filter_context.append("https://langchain-ai.github.io/langgraph/reference/")
                        search_filter_context.append("https://github.com/langchain-ai/langgraph/tree/main/docs/docs/tutorials")
                        
                    case _:
                        print("Unknown framework.")

            case "LLM_provider":
                match value:
                    case "Gemini":
                        print("Using Gemini as LLM provider.")
                        search_filter_context.append("https://firebase.google.com/docs/ai-logic/models")
                    case "Groq":
                        print("Using Groq as LLM provider.")
                        search_filter_context.append("https://console.groq.com/docs")

                    case "Deepseek":
                        print("Using Deepseek as LLM provider.")
                        search_filter_context.append("https://api-docs.deepseek.com/api/deepseek-api")
                    case "Perplexity":
                        print("Using Perplexity as LLM provider.")
                        search_filter_context.append("https://docs.perplexity.ai/home")
                    case "OpenAI":
                        print("Using OpenAI as LLM provider.")
                        search_filter_context.append("https://platform.openai.com/docs/api-reference/introduction")
                    case "Claude":
                        print("Using Claude as LLM provider.")
                        search_filter_context.append("https://docs.anthropic.com/en/api/overview")
                    case _:
                        print("Unknown LLM provider.")

            case "Tool_use":
                match value:
                    case "RAG":
                        print("Tool usage is RAG.")
                    case "Websurf":
                        print("Tool usage is Websurf.")
                    case "Both":
                        print("Using both RAG and Websurf.")
                    case _:
                        print("Unknown tool usage.")

            case "Embedder":
                match value:
                    case "Huggingface":
                        print("Using Huggingface for embeddings.")
                    case "Gemini":
                        print("Using Gemini for embeddings.")
                    case "OpenAI":
                        print("Using OpenAI for embeddings.")
                    case _:
                        print("Unknown embedder.")

            case "Database_used":
                match value:
                    case "Chroma":
                        print("Using Chroma as the vector database.")
                    case "Pinecone":
                        print("Using Pinecone as the vector database.")
                        search_filter_context.append("https://docs.pinecone.io/reference/api/introduction")
                    case "Weaviate":
                        print("Using Weaviate as the vector database.")
                        search_filter_context.append("https://weaviate.io/developers/weaviate/api")
                    case _:
                        print("Unknown vector DB selected.")

            case _:
                print(f"Tag '{tag}' is not handled.")

    for tag, value in options_json.items():
        handle_agent_config(tag, value)
        
    print(search_filter_context)

    walk_me_through_output = walk_me_through_code_agent(search_filter_context,options_json_string,user_prompt)

    walk_me_through_output_json = xml_to_json(walk_me_through_output)
    
    name = walk_me_through_output_json["Name"]
    cli = walk_me_through_output_json["CLI"]
    python = walk_me_through_output_json["python"]
    conclusion = walk_me_through_output_json["Conclusion"]
    search_contxt=search_filter_context

else : 
    ### idhar custom wala jaega
    search_filter_custom = [] #### filled by user 
    i=1
    while(i!=10):
        url_inp = input("Enter the URL")
        search_filter_custom.append(url_inp)
        i+=1
    
    custom_code_output = call_custom_code_agent(search_filter_custom,user_prompt)
    custom_code_output_json = xml_to_json(custom_code_output)
    name = custom_code_output_json["Name"]
    cli = custom_code_output_json["CLI"]
    python = custom_code_output_json["python"]
    conclusion = custom_code_output_json["Conclusion"]
    search_contxt=search_filter_custom


#### entering the chat page in frontend 

stop = 0

search_filter_custom_chat=[]
messages_incoming=[]
while (stop==0):
    append_to_filter=input(int("Enter 0 if not anything to add ,1 if want to add"))
    if(append_to_filter==1):
        stop_urls = -1 
        while (stop_urls == -1): 
            search_filter_custom_chat_element= input("Enter URL here")
            search_filter_custom_chat.append(search_filter_custom_chat_element)
        #### the list changes shown in frontend 
    if (len(search_filter_custom_chat)>10):
        search_filter_custom_chat.pop(0)
    query = input("Enter user query")
    query_perplexity_output =query_perplexity(search_filter_custom_chat , python["python"] , query, messages_incoming)
    query_perplexity_output_json= xml_to_json(query_perplexity_output)
    if (query_perplexity_output_json["Request_type"]!="Cross_questioning"):
        if (cli["CLI"]!=query_perplexity_output_json["CLI"]):
            ## matlab change hua h
            cli["CLI"] = query_perplexity_output_json["CLI"]
            #### add trigger to re-send new code to frontend 
        if(python["python"]!=query_perplexity_output_json["python"]):
            ## matlab change hua h
            cli["python"] = query_perplexity_output_json["python"] 
            #### add trigger to re-send new code to frontend 
    
    stream_personality_response(query_perplexity_output_json["Response"])
    #### stream to frontend 
    temp_stop= input(int("Stop chat session?: yes->1 , no->0"))
    messages_incoming.append({"role": "user" , "content" : query + "\n\n\n" + python["python"]  } ,{"role":"assistant" , "content": query_perplexity_output})
    
    if(temp_stop==1):
        name["Name"]=query_perplexity_output_json["Name"]
        
### loop se bahar matlab chat khatam
#### save the agent coode for python to be viewed in dashboard 

#################call the cost cutters and rest 

tech_review_output = run_tech_review(search_contxt , python["python"])
tech_review_output_json = xml_to_json(tech_review_output)
#### stream ScriptSummary , TechnicalImprovements , FeatureSuggestions , Conclusion on frontend 


cost_review_output = run_cost_analysis(python["python"])
cost_review_output_json = xml_to_json(cost_review_output)
#### stream Analysis , CostEstimation , Conclusion on frontend
