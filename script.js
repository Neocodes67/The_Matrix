// ===================== CONFIGURATION =====================
const CONFIG = {
    MATRIX_CHARS: '01',
    MESSAGE_HISTORY_LIMIT: 100,
    USER_UPDATE_INTERVAL: 1000,
};

// ===================== STATE MANAGEMENT =====================
let appState = {
    currentUser: null,
    users: new Map(),
    messages: [],
    socket: null,
    isConnected: false,
};

// ===================== MATRIX CANVAS ANIMATION =====================
class MatrixRain {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.columns = [];
        this.fontSize = 14;
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const columnCount = Math.ceil(this.canvas.width / this.fontSize);
        
        if (this.columns.length === 0) {
            for (let i = 0; i < columnCount; i++) {
                this.columns.push({
                    x: i * this.fontSize,
                    y: Math.random() * this.canvas.height,
                    speed: Math.random() * 2 + 1,
                    direction: i % 2 === 0 ? 1 : -1,
                });
            }
        }
    }

    animate() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#0f0';
        this.ctx.font = `${this.fontSize}px 'Courier New'`;
        this.ctx.globalAlpha = 0.5;

        this.columns.forEach(col => {
            const char = CONFIG.MATRIX_CHARS[Math.floor(Math.random() * CONFIG.MATRIX_CHARS.length)];
            this.ctx.fillText(char, col.x, col.y);

            col.y += col.speed * col.direction;

            if (col.direction === 1 && col.y > this.canvas.height) {
                col.y = 0;
            } else if (col.direction === -1 && col.y < 0) {
                col.y = this.canvas.height;
            }
        });

        this.ctx.globalAlpha = 1;
        requestAnimationFrame(() => this.animate());
    }
}

// ===================== CHAT APPLICATION =====================
class ChatApp {
    constructor() {
        this.matrixRain = new MatrixRain(document.getElementById('matrixCanvas'));
        this.setupEventListeners();
        this.initializeFakeWebSocket();
    }

    setupEventListeners() {
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinChat();
            }
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        document.getElementById('joinBtn').addEventListener('click', () => this.joinChat());
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
    }

    // ===================== FAKE WEBSOCKET SIMULATION =====================
    initializeFakeWebSocket() {
        appState.socket = {
            send: (data) => {
                const message = JSON.parse(data);
                
                if (message.type === 'join') {
                    this.handleUserJoin(message);
                } else if (message.type === 'message') {
                    this.handleNewMessage(message);
                }
            },
        };
    }

    handleUserJoin(data) {
        const { username, userId } = data;
        appState.users.set(userId, {
            id: userId,
            name: username,
            joinedAt: new Date(),
        });
        
        this.broadcastUsersList();
        this.addSystemMessage(`${username} joined the matrix`);
        this.updateUserCount();
    }

    handleNewMessage(data) {
        const message = {
            id: data.messageId,
            username: data.username,
            userId: data.userId,
            text: data.text,
            timestamp: new Date(),
        };
        
        appState.messages.push(message);
        
        if (appState.messages.length > CONFIG.MESSAGE_HISTORY_LIMIT) {
            appState.messages.shift();
        }
        
        this.displayMessage(message);
    }

    joinChat() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput.value.trim();

        if (!username) {
            this.glitchElement(usernameInput);
            return;
        }

        if (username.length < 2) {
            alert('Username must be at least 2 characters');
            return;
        }

        const userId = this.generateUserId();
        appState.currentUser = {
            id: userId,
            name: username,
        };

        const joinMessage = JSON.stringify({
            type: 'join',
            username: username,
            userId: userId,
        });

        appState.socket.send(joinMessage);

        // Hide modal and show main container
        document.getElementById('usernameModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');

        // Focus message input
        setTimeout(() => {
            document.getElementById('messageInput').focus();
        }, 100);
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();

        if (!text) {
            this.glitchElement(messageInput);
            return;
        }

        const messageId = this.generateMessageId();
        const sendMessage = JSON.stringify({
            type: 'message',
            messageId: messageId,
            username: appState.currentUser.name,
            userId: appState.currentUser.id,
            text: text,
        });

        appState.socket.send(sendMessage);
        messageInput.value = '';
        messageInput.focus();
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';

        const timestamp = message.timestamp.toLocaleTimeString();

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-username">[ ${message.username} ]</div>
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addSystemMessage(text) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageElement = document.createElement('div');
        messageElement.className = 'message';

        messageElement.innerHTML = `
            <div class="message-content" style="opacity: 0.7; border-left-color: #0a0;">
                <div class="message-text" style="color: #0a0; font-style: italic;">>>> ${text}</div>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    broadcastUsersList() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        appState.users.forEach((user) => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <span class="user-status"></span>
                ${user.name}
            `;
            usersList.appendChild(userElement);
        });
    }

    updateUserCount() {
        const userCount = appState.users.size;
        document.getElementById('userCount').textContent = `Users: ${userCount}`;
    }

    glitchElement(element) {
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'glitch-text 0.1s 3';
        }, 10);
    }

    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    escapeHtml(text) {
        const map = {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": ''',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', () => {
    const app = new ChatApp();

    // Simulate initial user joining for demo purposes
    setTimeout(() => {
        const demoUser = {
            type: 'join',
            username: 'SYSTEM',
            userId: 'system_1',
        };
        app.handleUserJoin(demoUser);
    }, 500);

    // Add demo message
    setTimeout(() => {
        app.addSystemMessage('Welcome to GLITCH - The Matrix Chat');
        app.addSystemMessage('Enter the username to begin');
    }, 1000);
});
