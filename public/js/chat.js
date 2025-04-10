class ChatInterface {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
        if (!this.chatContainer) {
            console.error('Chat container element not found in the DOM.');
            return;
        }

        this.currentChannel = null;
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.chatURL = 'http://127.0.0.1:8787/chat'; // Ensure this matches your backend URL
        this.menuVisible = false;
        this.chatListVisible = false;
    }

    openChat(context = {}) {
        const { channel, messageId, message } = context;
        this.currentChannel = channel || 'default';

        this.chatContainer.style.display = 'block';
        this.chatContainer.innerHTML = '';

        const header = this.createHeader(channel);
        this.chatContainer.appendChild(header);

        const messagesArea = this.createMessagesArea(message);
        this.chatContainer.appendChild(messagesArea);

        const inputArea = this.createInputArea(messageId);
        this.chatContainer.appendChild(inputArea);
    }

    createHeader(channel) {
        const header = document.createElement('div');
        header.className = 'chat-header';

        const listButton = document.createElement('button');
        listButton.textContent = '📋';
        listButton.className = 'chat-list-button';
        listButton.onclick = () => this.toggleChatList();
        header.appendChild(listButton);

        const title = document.createElement('span');
        title.textContent = channel ? `Chat with Channel: #${channel}` : 'New Chat';
        header.appendChild(title);

        const menuButton = document.createElement('button');
        menuButton.textContent = '☰';
        menuButton.className = 'chat-menu-button';
        menuButton.onclick = () => this.toggleMenu();
        header.appendChild(menuButton);

        return header;
    }

    toggleMenu() {
        let menu = this.chatContainer.querySelector('.chat-menu');
        if (menu) {
            menu.remove();
            this.menuVisible = false;
        } else {
            menu = document.createElement('div');
            menu.className = 'chat-menu';

            const setChatURL = document.createElement('button');
            setChatURL.textContent = 'Set Chat URL';
            setChatURL.onclick = () => {
                const newURL = prompt('Enter new chat URL:', this.chatURL);
                if (newURL) {
                    this.chatURL = newURL;
                    alert(`Chat URL updated to: ${this.chatURL}`);
                }
            };
            menu.appendChild(setChatURL);

            const resetChatURL = document.createElement('button');
            resetChatURL.textContent = 'Reset to Default Chatbot';
            resetChatURL.onclick = () => {
                this.chatURL = 'http://127.0.0.1:8787/chat'; // Reset to default backend URL
                alert('Chat URL reset to default: http://127.0.0.1:8787/chat');
            };
            menu.appendChild(resetChatURL);

            const deleteChat = document.createElement('button');
            deleteChat.textContent = 'Delete Chat';
            deleteChat.onclick = () => {
                this.chatHistory = [];
                localStorage.removeItem('chatHistory');
                this.chatContainer.querySelector('.chat-messages').innerHTML = '';
                alert('Chat history deleted.');
            };
            menu.appendChild(deleteChat);

            this.chatContainer.appendChild(menu);
            this.menuVisible = true;
        }
    }

    toggleChatList() {
        let chatList = this.chatContainer.querySelector('.chat-list');
        if (chatList) {
            chatList.remove();
            this.chatListVisible = false;
        } else {
            chatList = document.createElement('div');
            chatList.className = 'chat-list';

            this.chatHistory.forEach((chat, index) => {
                const chatItem = document.createElement('div');
                chatItem.className = 'chat-list-item';
                chatItem.textContent = `Chat ${index + 1}: ${chat}`;
                chatList.appendChild(chatItem);
            });

            this.chatContainer.appendChild(chatList);
            this.chatListVisible = true;
        }
    }

    createMessagesArea(message) {
        const messagesArea = document.createElement('div');
        messagesArea.className = 'chat-messages';

        if (message) {
            const contextMessage = document.createElement('div');
            contextMessage.className = 'chat-context';
            contextMessage.textContent = `Context: ${message}`;
            messagesArea.appendChild(contextMessage);
        }

        this.chatHistory.forEach((chat) => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.textContent = chat;
            messagesArea.appendChild(messageElement);
        });

        return messagesArea;
    }

    createInputArea(messageId) {
        const inputArea = document.createElement('div');
        inputArea.className = 'chat-input-area';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your message...';
        input.className = 'chat-input';
        inputArea.appendChild(input);

        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.className = 'chat-send-button';
        sendButton.onclick = async () => {
            const userMessage = input.value.trim();
            if (userMessage) {
                this.addMessage(userMessage, 'You');
                const response = await this.sendMessage({
                    channel: this.currentChannel,
                    message: userMessage, // Ensure the message is sent correctly
                });
                this.addMessage(response.reply, 'AI');
                this.displaySuggestedContent(response.suggestedContent);
                input.value = '';
            }
        };
        inputArea.appendChild(sendButton);

        return inputArea;
    }

    addMessage(message, sender) {
        const messagesArea = this.chatContainer.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender.toLowerCase()}`;
        messageElement.textContent = `${sender}: ${message}`;
        messagesArea.appendChild(messageElement);

        this.chatHistory.push(`${sender}: ${message}`);
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    async sendMessage(context) {
        const messagesArea = this.chatContainer.querySelector('.chat-messages');
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.textContent = 'Thinking...';
        messagesArea.appendChild(loadingIndicator);

        try {
            console.log('Sending request to:', this.chatURL);
            console.log('Request payload:', context);

            const response = await fetch(`${this.chatURL}?channel=${context.channel}&message=${encodeURIComponent(context.message)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json();
            loadingIndicator.remove();
            return jsonResponse;
        } catch (error) {
            console.error('Error sending message:', error);
            loadingIndicator.textContent = 'Error fetching response.';
            throw error;
        }
    }

    displaySuggestedContent(suggestedContent) {
        if (!suggestedContent || suggestedContent.length === 0) {
            return;
        }

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestions-container';

        const header = document.createElement('div');
        header.className = 'suggestions-header';
        header.textContent = 'Suggested Replies:';
        suggestionsContainer.appendChild(header);

        suggestedContent.forEach((suggestion) => {
            const suggestionElement = document.createElement('button');
            suggestionElement.className = 'suggestion-button';
            suggestionElement.textContent = suggestion;
            suggestionElement.onclick = () => {
                this.addMessage(suggestion, 'You');
                this.sendMessage({ channel: this.currentChannel, message: suggestion });
            };
            suggestionsContainer.appendChild(suggestionElement);
        });

        this.chatContainer.appendChild(suggestionsContainer);
    }

    addChatButtonsToChannels() {
        const channels = document.querySelectorAll('.channel:not(.has-chat-button)');
        channels.forEach(channel => {
            channel.classList.add('has-chat-button');
            const chatButton = document.createElement('button');
            chatButton.className = 'chat-button';
            chatButton.innerHTML = '🗨️ Chat';
            chatButton.onclick = (e) => {
                e.stopPropagation();
                this.currentChannel = channel.dataset.channel;
                this.openChat({ channel: this.currentChannel });
            };
            channel.appendChild(chatButton);
        });
    }

    addChatButtonsToMessages() {
        const messages = document.querySelectorAll('.message:not(.has-chat-button)');
        messages.forEach(message => {
            message.classList.add('has-chat-button');
            const chatButton = document.createElement('button');
            chatButton.className = 'chat-button';
            chatButton.innerHTML = '🗨️ Chat';
            chatButton.onclick = (e) => {
                e.stopPropagation();
                this.currentChannel = message.dataset.channel;
                this.currentMessage = message.dataset.messageId;
                this.openChat({ channel: this.currentChannel, messageId: this.currentMessage, message: message.textContent });
            };
            message.appendChild(chatButton);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatInterface = new ChatInterface();

    const fullscreenButton = document.querySelector('.fullscreen-icon');
    if (fullscreenButton) {
        const chatButton = document.createElement('button');
        chatButton.textContent = '🗨️';
        chatButton.className = 'btn-chat-global';
        chatButton.onclick = () => {
            window.chatInterface.openChat({ channel: 'default' });
        };
        fullscreenButton.parentNode.insertBefore(chatButton, fullscreenButton);
    }
});
