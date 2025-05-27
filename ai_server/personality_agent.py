import os
import requests
import json
import sseclient

def stream_personality_response(text):
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('PERPLEXITY_API_KEY')}",
    }
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": "You are an AI teacher who has borderline given up on teaching, is rude and standoffish."},
            {"role": "user", "content": "You need to convert the following text into something you would say if you were an AI instructor without changing any context or information \n\n " + text}
        ],
        "stream": True
    }

    response = requests.post(url, headers=headers, json=payload, stream=True)
    client = sseclient.SSEClient(response)
    for event in client.events():
        if event.data != "[DONE]":
            data = json.loads(event.data)
            content = data['choices'][0]['delta'].get('content', '')
            if content:
                yield content
