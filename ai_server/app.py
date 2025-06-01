from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import os
from typing import List, Dict, Any
import xml.etree.ElementTree as ET
import html
import re
from pydantic import BaseModel

# Import our AI agent modules
from chat_agent import query_perplexity
from recommendations_agent import get_recommendations
from tech_review_agent import run_tech_review
from walk_me_through_code_agent import walk_me_through_code_agent
from cost_agent import run_cost_analysis
from custom_code_agent import call_custom_code_agent
from personality_agent import stream_personality_response

app = Flask(__name__)
CORS(app)

import xml.etree.ElementTree as ET
import html
from typing import Dict, Any

def xml_to_json(input_str: str) -> dict:
    try:
        # Remove <think>...</think> block if present
        cleaned_str = re.sub(r"<think>.*?</think>", "", input_str, flags=re.DOTALL).strip()

        # Attempt to load remaining content as JSON
        return json.loads(cleaned_str)
    
    except json.JSONDecodeError as e:
        print("❌ Failed to parse JSON. Error:", e)
        raise ValueError("Input is not valid JSON after removing <think> block.")


@app.route('/api/ai/recommendations', methods=['POST'])
def get_agent_recommendations():
    """Get AI recommendations for agent configuration"""
    try:
        data = request.get_json()
        user_prompt = data.get('prompt', '')
        config = data.get('config', {})
        
        # Convert config to search filters if needed
        search_filters = []
        
        recommendations = get_recommendations(search_filters, user_prompt)
        recommendations_json = xml_to_json(recommendations)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations_json
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/walkthrough', methods=['POST'])
def walkthrough_code():
    """Walk through and generate agent code"""
    try:
        data = request.get_json()
        user_prompt = data.get('prompt', '')
        options = data.get('options', {})
        tech_stack = data.get('techStack', '')
        
        search_filters = []  # Could be populated from options
        
        code_output = walk_me_through_code_agent(search_filters, tech_stack, user_prompt)
        code_json = xml_to_json(code_output)
        
        return jsonify({
            "success": True,
            "name": code_json.get("Name", ""),
            "cli": code_json.get("CLI", ""),
            "python": code_json.get("python", ""),
            "conclusion": code_json.get("conclusion", "")
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/custom', methods=['POST'])
def generate_custom_code():
    """Generate custom agent code based on user requirements"""
    try:
        data = request.get_json()
        user_prompt = data.get('prompt', '')
        search_filters = data.get('searchFilters', [])
        print("search_filters : " , search_filters )
        
        custom_output = call_custom_code_agent(search_filters, user_prompt)
        print(f"Raw output from call_custom_code_agent: {custom_output}")
        print ("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        custom_json = xml_to_json(custom_output)
        
        print(jsonify({
            "success": True,
            "name": custom_json.get("Name", ""),
            "cli": custom_json.get("CLI", ""),
            "python": custom_json.get("python", ""),
            "conclusion": custom_json.get("conclusion", "")
        }))
        return jsonify({
            "success": True,
            "name": custom_json.get("Name", ""),
            "cli": custom_json.get("CLI", ""),
            "python": custom_json.get("python", ""),
            "conclusion": custom_json.get("conclusion", "")
        })
        
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/chat', methods=['POST'])
def chat_with_agent():
    """Handle chat interactions with the agent"""
    try:
        data = request.get_json()
        agent_id = data.get('agentId')
        message = data.get('message', '')
        context_urls = data.get('contextUrls', [])
        current_code = data.get('currentCode', '')
        messages_history = data.get('messagesHistory', [])
        
        # Query Perplexity for response
        response = query_perplexity(context_urls, current_code, message, messages_history)
        response_json = xml_to_json(response)
        
        return jsonify({
            "success": True,
            "response": response_json.get("Response", ""),
            "requestType": response_json.get("Request_type", ""),
            "updatedCode": {
                "cli": response_json.get("CLI", ""),
                "python": response_json.get("python", "")
            },
            "agentName": response_json.get("Name", "")
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/tech-review', methods=['POST'])
def tech_review():
    """Analyze agent code for technical improvements"""
    try:
        data = request.get_json()
        python_script = data.get('pythonScript', '')
        search_context = data.get('searchContext', [])
        
        review_output = run_tech_review(search_context, python_script)
        review_json = xml_to_json(review_output)
        
        return jsonify({
            "success": True,
            "scriptSummary": review_json.get("ScriptSummary", ""),
            "technicalImprovements": review_json.get("TechnicalImprovements", ""),
            "featureSuggestions": review_json.get("FeatureSuggestions", ""),
            "conclusion": review_json.get("conclusion", "")
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/cost-analysis', methods=['POST'])
def cost_analysis():
    """Analyze cost implications of the agent"""
    try:
        data = request.get_json()
        python_script = data.get('pythonScript', '')
        
        cost_output = run_cost_analysis(python_script)
        cost_json = xml_to_json(cost_output)
        
        return jsonify({
            "success": True,
            "analysis": cost_json.get("Analysis", ""),
            "costEstimation": cost_json.get("CostEstimation", ""),
            "conclusion": cost_json.get("conclusion", "")
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ai/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "AI orchestration server is running"
    })

if __name__ == '__main__':
    # Ensure PERPLEXITY_API_KEY is set
    if not os.getenv('PERPLEXITY_API_KEY'):
        print("Warning: PERPLEXITY_API_KEY environment variable not set")
    
    app.run(host='0.0.0.0', port=5001, debug=True)