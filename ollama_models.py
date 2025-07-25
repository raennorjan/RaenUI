import requests

def list_ollama_models():
    url = "http://localhost:11434/api/tags"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # La respuesta tiene la clave 'models', que es una lista de dicts con 'name'
        models = [m['name'] for m in data.get('models', [])]
        return models
    except Exception as e:
        return [f"Error: {str(e)}"]
