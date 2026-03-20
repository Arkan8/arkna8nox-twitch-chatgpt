require('dotenv').config();
const tmi = require('tmi.js');
const OpenAIOperations = require('./openai_operations');

const openaiOps = new OpenAIOperations();

// 🔹 HISTORIAL DEL CHAT
let chatHistory = [];
const CHAT_HISTORY_LIMIT = 20;

// Configuración del bot
const bot = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.OAUTH_TOKEN
    },
    channels: [process.env.CHANNEL_NAME]
});

bot.connect();

// Evento cuando llega un mensaje
bot.on('message', async (channel, user, message, self) => {
    if (self) return;

    console.log(`${user.username}: ${message}`);

    // 🔹 GUARDAR MENSAJES NORMALES (NO COMANDOS)
    if (!message.startsWith('!')) {
        chatHistory.push(`${user.username}: ${message}`);

        if (chatHistory.length > CHAT_HISTORY_LIMIT) {
            chatHistory.shift();
        }
    }

    // 🔹 COMANDO !benito
    if (message.startsWith('!benito')) {
        const text = message.replace('!benito', '').trim();

        if (!text) {
            bot.say(channel, `@${user.username} dime algo después de !benito`);
            return;
        }

        try {
            // 🔹 AÑADIR CONTEXTO DEL CHAT
            const context = chatHistory.slice(-10).join('\n');

            const enrichedText = `
Contexto del chat:
${context}

Usuario actual (${user.username}):
${text}
            `;

            const response = await openaiOps.make_openai_call(enrichedText);

            bot.say(channel, response);

        } catch (error) {
            console.error(error);
            bot.say(channel, 'Error hablando con la IA 😢');
        }
    }
});