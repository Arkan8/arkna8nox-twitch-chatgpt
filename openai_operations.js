const OpenAI = require("openai");

class OpenAIOperations {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.messages = [
            {
                role: "system",
                content: file_context
            }
        ];

        this.MAX_HISTORY = 20;
    }

    // 🔹 LIMPIAR HISTORIAL SI CRECE MUCHO
    check_history_length() {
        if (this.messages.length > this.MAX_HISTORY) {
            this.messages.splice(1, 1); // mantiene el system
        }
    }

    async make_openai_call(userMessage) {
        this.messages.push({
            role: "user",
            content: userMessage
        });

        this.check_history_length();

        const completion = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: this.messages,
        });

        const reply = completion.choices[0].message.content;

        this.messages.push({
            role: "assistant",
            content: reply
        });

        return reply;
    }
}

module.exports = OpenAIOperations;