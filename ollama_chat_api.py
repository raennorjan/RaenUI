import requests

def chat_with_ollama(messages, model="llama2", stream=False, options=None, format=None, images=None, system=None):
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": stream
    }
    if options:
        payload["options"] = options
    if format:
        payload["format"] = format
    if images:
        # Se agregan imágenes al último mensaje del usuario
        if payload["messages"]:
            payload["messages"][-1]["images"] = images
    if system:
        payload["system"] = system
    try:
        if stream:
            with requests.post(url, json=payload, stream=True) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        try:
                            import json
                            data = json.loads(line.decode('utf-8'))
                            chunk = data.get("message", {}).get("content", "")
                            yield chunk
                        except Exception as e:
                            yield f"[Error parsing chunk: {str(e)}]"
        else:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "Error: sin respuesta de Ollama")
    except Exception as e:
        if stream:
            yield f"[Error: {str(e)}]"
        else:
            return f"Error: {str(e)}"
