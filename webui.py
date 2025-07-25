
# Ollama WebUI - Backend principal
# Autor: [Tu nombre o equipo]
# Descripción: Servidor Flask para interfaz web de chat con Ollama

from flask import Flask, render_template, request, jsonify, Response
from ollama_chat_api import chat_with_ollama
from ollama_models import list_ollama_models

app = Flask(__name__)

# Ruta principal: Renderiza la interfaz web
@app.route('/')
def index():
    return render_template('index.html')

# Endpoint de generación de texto/chat
@app.route('/generate', methods=['POST'])
def generate_text():
    """
    Recibe mensajes y parámetros desde el frontend, llama a Ollama y retorna la respuesta.
    Soporta streaming y opciones avanzadas.
    """
    try:
        # Extraer parámetros del request
        messages = request.json.get('messages', [])
        model = request.json.get('model', None)
        # Si no se especifica modelo, usar el primero disponible o fallback
        if not model:
            modelos = list_ollama_models()
            if modelos and not modelos[0].startswith('Error'):
                model = modelos[0]
            else:
                model = 'llama2'
        stream = request.json.get('stream', False)
        options = request.json.get('options', None)
        format = request.json.get('format', None)
        images = request.json.get('images', None)
        system = request.json.get('system', None)

        # Generación normal (no streaming)
        if not stream:
            result = chat_with_ollama(messages, model, False, options, format, images, system)
            # Si el resultado es un generador, convertir a string
            if hasattr(result, '__iter__') and not isinstance(result, str):
                result = ''.join(list(result))
            return jsonify({'generated_text': result})
        # Generación en streaming
        else:
            def generate_stream():
                for chunk in chat_with_ollama(messages, model, True, options, format, images, system):
                    yield chunk
            return Response(generate_stream(), mimetype='text/plain')
    except Exception as e:
        # Error en la generación o parámetros
        return jsonify({'error': str(e)}), 500

# Endpoint para consultar modelos disponibles en Ollama
@app.route('/models', methods=['GET'])
def get_models():
    """
    Retorna la lista de modelos disponibles en Ollama.
    """
    models = list_ollama_models()
    return jsonify({'models': models})

# Ejecución directa del servidor Flask
if __name__ == '__main__':
    app.run(debug=True)
