Last login: Sun Dec 21 16:06:58 on ttys000
david@Mac ~ % vim






















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

-- INSERT --
