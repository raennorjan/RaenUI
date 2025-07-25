# Raen UI

Interfaz web moderna para chatear con modelos Ollama usando Flask.

## Autor
Raen Norjan ([GitHub](https://github.com/raennorjan))

## Características
- Chat con modelos Ollama
- Selección de modelo y opciones avanzadas
- Historial de conversaciones persistente
- Streaming de respuestas
- Interfaz responsiva y moderna

## Requisitos
- Python 3.8+
- Ollama instalado y corriendo localmente

## Instalación
1. Clona el repositorio:
   ```sh
   git clone https://github.com/raennorjan/RaenUI.git
   cd RaenUI
   ```
2. Instala dependencias:
   ```sh
   pip install -r requirements.txt
   ```
3. Ejecuta Ollama y luego la app:
   ```sh
   python webui.py
   ```
4. Abre [http://localhost:5000](http://localhost:5000) en tu navegador.

## Estructura
- `webui.py`: Backend principal Flask
- `ollama_chat_api.py`: Lógica de chat con Ollama
- `ollama_models.py`: Listado de modelos
- `/templates/`: HTML
- `/static/`: JS y CSS

## Licencia
Unliscence
