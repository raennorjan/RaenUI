
// --- Estructura y configuración ---
let conversations = [];
let activeConversationIdx = null;
let userConfig = {
    model: '',
    stream: false,
    temperature: 1,
    top_k: 40,
    top_p: 0.9,
    num_predict: 8192, // Límite predeterminado de tokens según Ollama
    format: ''
};

// --- Utilidades de almacenamiento local ---
function loadLocalData() {
    const conv = localStorage.getItem('ollama_conversations');
    const idx = localStorage.getItem('ollama_activeConversationIdx');
    const config = localStorage.getItem('ollama_userConfig');
    if (conv) conversations = JSON.parse(conv);
    if (idx !== null) activeConversationIdx = JSON.parse(idx);
    if (config) userConfig = JSON.parse(config);
}
function saveLocalData() {
    localStorage.setItem('ollama_conversations', JSON.stringify(conversations));
    localStorage.setItem('ollama_activeConversationIdx', JSON.stringify(activeConversationIdx));
    localStorage.setItem('ollama_userConfig', JSON.stringify(userConfig));
}

// --- Acciones de UI ---
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const showSidebarBtn = document.getElementById('showSidebarBtn');
toggleSidebarBtn.onclick = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.add('sidebar-hidden');
    showSidebarBtn.style.display = 'block';
    // Unifica tamaño y estilo del botón de mostrar
    showSidebarBtn.style.padding = toggleSidebarBtn.style.padding;
    showSidebarBtn.style.fontSize = toggleSidebarBtn.style.fontSize;
};
showSidebarBtn.onclick = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('sidebar-hidden');
    showSidebarBtn.style.display = 'none';
};
document.getElementById('newConversation').onclick = function() {
    conversations.push({ messages: [] });
    activeConversationIdx = conversations.length - 1;
    saveLocalData();
    renderChat();
};
document.getElementById('clearHistory').onclick = function() {
    conversations = [];
    activeConversationIdx = null;
    saveLocalData();
    renderChat();
};

// --- Inicialización y carga de modelos ---
window.addEventListener('DOMContentLoaded', async () => {
    loadLocalData();
    const modelSelect = document.getElementById('model');
    try {
        const res = await fetch('/models');
        const data = await res.json();
        modelSelect.innerHTML = '';
        data.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });
        if (userConfig.model && data.models.includes(userConfig.model)) {
            modelSelect.value = userConfig.model;
        }
    } catch (err) {
        modelSelect.innerHTML = '<option>Error al cargar modelos</option>';
    }
    document.getElementById('stream').checked = userConfig.stream;
    document.getElementById('temperature').value = userConfig.temperature;
    document.getElementById('top_k').value = userConfig.top_k;
    document.getElementById('top_p').value = userConfig.top_p;
    document.getElementById('num_predict').value = userConfig.num_predict;
    document.getElementById('format').value = userConfig.format;
    renderSidebarHistory();
    renderChat();
});

// --- Renderizado de chat y sidebar ---
const chatHistoryDiv = document.getElementById('chat-history');
const spinner = document.getElementById('spinner');

function renderChat() {
    chatHistoryDiv.innerHTML = '';
    if (activeConversationIdx === null || !conversations[activeConversationIdx]) return;
    const chatHistory = conversations[activeConversationIdx].messages;
    chatHistory.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + (msg.role === 'user' ? 'user' : 'assistant');
        bubble.innerHTML = `<span>${msg.content}</span>`;
        chatHistoryDiv.appendChild(bubble);
    });
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    renderSidebarHistory();
}
function renderSidebarHistory() {
    const sidebar = document.getElementById('sidebar-history');
    sidebar.innerHTML = '';
    if (conversations.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Sin conversaciones';
        emptyItem.style.color = '#888';
        sidebar.appendChild(emptyItem);
        return;
    }
    conversations.forEach((conv, idx) => {
        const firstMsg = conv.messages.find(m => m.role === 'user');
        const title = firstMsg ? firstMsg.content.slice(0, 40) : 'Conversación vacía';
        const item = document.createElement('li');
        // Botón borrar conversación al inicio
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.style.marginRight = '8px';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = function(e) {
            e.stopPropagation();
            conversations.splice(idx, 1);
            if (activeConversationIdx === idx) {
                activeConversationIdx = conversations.length ? 0 : null;
            } else if (activeConversationIdx > idx) {
                activeConversationIdx--;
            }
            renderChat();
        };
        item.appendChild(delBtn);
        item.appendChild(document.createTextNode('💬 ' + title));
        item.title = title;
        item.style.cursor = 'pointer';
        item.onclick = function() {
            activeConversationIdx = idx;
            renderChat();
        };
        sidebar.appendChild(item);
    });
}

// --- Envío de mensajes y generación ---
document.getElementById('chatForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const userInput = document.getElementById('userInput').value;
    const model = document.getElementById('model').value;
    const stream = document.getElementById('stream').checked;
    let temperature = parseFloat(document.getElementById('temperature').value);
    let top_k = parseInt(document.getElementById('top_k').value);
    let top_p = parseFloat(document.getElementById('top_p').value);
    let num_predict = parseInt(document.getElementById('num_predict').value);
    const format = document.getElementById('format').value;

    // Guardar configuración actual
    userConfig = { model, stream, temperature, top_k, top_p, num_predict, format };
    saveLocalData();

    // Limitar valores según documentación Ollama
    if (isNaN(temperature) || temperature < 0) temperature = 0;
    if (temperature > 2) temperature = 2;
    if (isNaN(top_k) || top_k < 1) top_k = 1;
    if (top_k > 100) top_k = 100;
    if (isNaN(top_p) || top_p < 0) top_p = 0;
    if (top_p > 1) top_p = 1;
    if (isNaN(num_predict) || num_predict < 1) num_predict = 1;
    if (num_predict > 8192) num_predict = 8192;

    const options = { temperature, top_k, top_p, num_predict };

    // Nueva conversación si no hay activa
    if (activeConversationIdx === null) {
        conversations.push({ messages: [] });
        activeConversationIdx = conversations.length - 1;
    }
    const chatHistory = conversations[activeConversationIdx].messages;
    chatHistory.push({ role: 'user', content: userInput });
    saveLocalData();
    renderChat();
    document.getElementById('userInput').value = '';
    spinner.style.display = 'block';

    const messages = chatHistory.map(m => ({ role: m.role, content: m.content }));

    if (!stream) {
        try {
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, model, stream, options, format })
            });
            const data = await response.json();
            if (data.generated_text) {
                chatHistory.push({ role: 'assistant', content: data.generated_text });
            } else if (data.error) {
                chatHistory.push({ role: 'assistant', content: '[Error] ' + data.error });
            } else {
                chatHistory.push({ role: 'assistant', content: '[Sin respuesta]' });
            }
        } catch (err) {
            chatHistory.push({ role: 'assistant', content: '[Error al generar texto]' });
        }
        saveLocalData();
        renderChat();
        spinner.style.display = 'none';
    } else {
        try {
            let assistantMsg = '';
            const response = await fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, model, stream, options, format })
            });
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    assistantMsg += decoder.decode(value);
                    renderChat();
                    if (!chatHistory[chatHistory.length-1] || chatHistory[chatHistory.length-1].role !== 'assistant') {
                        chatHistory.push({ role: 'assistant', content: assistantMsg });
                    } else {
                        chatHistory[chatHistory.length-1].content = assistantMsg;
                    }
                }
            }
        } catch (err) {
            chatHistory.push({ role: 'assistant', content: '[Error al generar texto]' });
        }
        saveLocalData();
        renderChat();
        spinner.style.display = 'none';
    }
});
