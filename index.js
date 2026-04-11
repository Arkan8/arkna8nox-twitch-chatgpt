import dotenv from 'dotenv';
import tmi from 'tmi.js';
import OpenAIOperations from './openai_operations.js'; // Asegúrate de la extensión .js

dotenv.config();

const openaiOps = new OpenAIOperations();

// 🔹 HISTORIAL DEL CHAT (guardamos objeto con usuario y mensaje)
let chatHistory = [];
const CHAT_HISTORY_LIMIT = 30; // Aumentado para mejor contexto

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

    // 🔹 GUARDAR TODOS LOS MENSAJES (incluyendo comandos, para contexto completo)
    const isCommand = message.startsWith('!');
    chatHistory.push({
        username: user.username,
        message: message,
        timestamp: Date.now(),
        isCommand: isCommand
    });

    // Limitar tamaño del historial
    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.shift();
    }

    // 🔹 COMANDO !benito
    if (message.startsWith('!benito')) {
        const text = message.replace('!benito', '').trim();

        if (!text) {
            bot.say(channel, `@${user.username} dime algo después de !benito`);
            return;
        }

        try {
            // 🔹 CONSTRUIR CONTEXTO MEJORADO
            const recentMessages = chatHistory
                .slice(-15)
                .filter(msg => !msg.isCommand)
                .map(msg => `${msg.username}: ${msg.message}`)
                .join('\n');

            const contextoCompleto = `
Este es el historial de la conversación en el chat de Twitch (los mensajes más recientes aparecen abajo):

${recentMessages || "(No hay mensajes recientes)"}

Ahora el usuario ${user.username} pregunta: "${text}"

INSTRUCCIÓN IMPORTANTE: Responde basándote en el historial del chat de arriba. Si el usuario pregunta sobre algo que se dijo antes, busca en el historial y responde con precisión. Si no encuentras la información, responde honestamente que no lo sabes.

Respuesta de Benito:
            `;

            const response = await openaiOps.make_openai_call(contextoCompleto);
            bot.say(channel, response);

        } catch (error) {
            console.error(error);
            bot.say(channel, 'Error hablando con la IA 😢');
        }
    }
});