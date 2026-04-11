import OpenAI from 'openai';

// IMPORTANTE: Esta variable debe estar definida ANTES de importar este archivo
// o debes pasar file_context como parámetro al constructor
// Voy a asumir que file_context está disponible globalmente o lo pasamos como parámetro

// Opción 1: Si file_context está en el ámbito global (definido en otro archivo)
// Puedes usarlo directamente, pero es mejor pasarlo como parámetro

class OpenAIOperations {
    constructor(file_context = null) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Usar file_context si se proporciona, si no, usar un contexto por defecto
        const systemContent = file_context

        this.messages = [
            {
                role: "system",
                content: systemContent
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

    // Método para actualizar el contexto del sistema si es necesario
    updateSystemContext(newContext) {
        if (this.messages.length > 0 && this.messages[0].role === "system") {
            this.messages[0].content = newContext;
        }
    }

    // Método para resetear el historial (manteniendo el contexto del sistema)
    resetHistory() {
        const systemMessage = this.messages[0];
        this.messages = [systemMessage];
    }
}

export default OpenAIOperations;