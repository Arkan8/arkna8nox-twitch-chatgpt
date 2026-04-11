import dotenv from 'dotenv';
import tmi from 'tmi.js';
import OpenAIOperations from './openai_operations.js';

dotenv.config();

const openaiOps = new OpenAIOperations();

// 🔹 HISTORIAL DEL CHAT
let chatHistory = [];
const CHAT_HISTORY_LIMIT = 30;

// 🔹 PROCESAR CANALES (soporta uno o múltiples separados por coma)
let channels = [];
if (process.env.CHANNELS.includes(',')) {
    // Múltiples canales: "canal1,canal2,canal3"
    channels = process.env.CHANNELS.split(',').map(ch => {
        const cleanChannel = ch.trim();
        return cleanChannel.startsWith('#') ? cleanChannel : `#${cleanChannel}`;
    });
} else {
    // Un solo canal
    const channelName = process.env.CHANNELS.startsWith('#') 
        ? process.env.CHANNELS 
        : `#${process.env.CHANNELS}`;
    channels = [channelName];
}

// Configuración del bot
const bot = new tmi.Client({
    options: { debug: true },
    identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.OAUTH_TOKEN
    },
    channels: channels
});

bot.connect();

bot.on('message', async (channel, user, message, self) => {
    if (self) return;

    console.log(`${user.username}: ${message}`);

    // Guardar mensaje en historial
    const isCommand = message.startsWith('!');
    chatHistory.push({
        username: user.username,
        message: message,
        timestamp: Date.now(),
        isCommand: isCommand
    });

    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.shift();
    }

    // Comando !benito
    if (message.startsWith('!benito')) {
        const text = message.replace('!benito', '').trim();

        if (!text) {
            bot.say(channel, `@${user.username} dime algo después de !benito`);
            return;
        }

        try {
            const recentMessages = chatHistory
                .slice(-15)
                .filter(msg => !msg.isCommand)
                .map(msg => `${msg.username}: ${msg.message}`)
                .join('\n');

            const contextoCompleto = `
Historial del chat:
${recentMessages || "(No hay mensajes recientes)"}

Usuario ${user.username} pregunta: "${text}"

Responde basándote en el historial. Si pregunta sobre algo dicho antes, búscalo y responde con precisión.
`;

            const response = await openaiOps.make_openai_call(contextoCompleto);
            bot.say(channel, response);

        } catch (error) {
            console.error(error);
            bot.say(channel, 'Error hablando con la IA 😢');
        }
    }
});