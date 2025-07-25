import requests

def generate_with_ollama(prompt, model="llama2"):
    url = "http://localhost:11434/api/generate"
    payload = {"model": model, "prompt": prompt}
    try:
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        result = ""
        for line in response.iter_lines():
            if line:
                try:
                    data = requests.utils.json.loads(line.decode('utf-8'))
                    result += data.get("response", "")
                except Exception:
                    continue
        return result if result else "Error: sin respuesta de Ollama"
    except Exception as e:
        return f"Error: {str(e)}"
