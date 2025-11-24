import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import config from '../../util/constants.js';
import actionRegistry from '../action/index.js';

class LLMClient {
    constructor() {
        const ai = new GoogleGenAI({
            vertexai: true,
            project: process.env.PROJECT_ID,
            location: process.env.REGION,
        });
        this.chat = ai.chats.create({model: process.env.MODEL_NAME, config: {
            temperature: 0.2,
            systemInstruction: this.buildSystemPrompt()
            }});
        this.conversationHistory = [];
    }

    buildSystemPrompt() {
        const actionsList = actionRegistry.getActionsList();

        return `Eres un agente de Minecraft que controla un bot llamado Nila. Tu trabajo es interpretar las intenciones del usuario y decidir qué acciones ejecutar.

IMPORTANTE: Debes responder SOLO con un JSON válido, sin texto adicional ni markdown.

ACCIONES DISPONIBLES:
${actionsList.map(action => `- ${action.name}: ${action.description}
  Parámetros: ${action.params.join(', ')}`).join('\n')}

FORMATO DE RESPUESTA (JSON puro):
{
  "actions": [
    {"name": "nombre_accion", "params": {"param1": "valor1"}},
    {"name": "otra_accion", "params": {"param1": "valor1"}}
  ],
  "reasoning": "Breve explicación de tu plan"
}

REGLAS:
1. Siempre responde con JSON válido
2. No incluyas \`\`\`json ni markdown
3. Máximo ${config.MAX_ACTIONS_PER_REQUEST} acciones por request
4. Si necesitas mirar algo antes de interactuar, usa "lookAt" primero
5. Si necesitas moverte cerca de algo, usa "walkTo" primero
6. Analiza el entorno antes de decidir
7. Si no puedes cumplir la petición, devuelve actions vacío y explica en reasoning`;
    }

    async decideActions(prompt, environment) {
        try {
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = `PETICIÓN DEL USUARIO: ${prompt}

ESTADO DEL ENTORNO:
${JSON.stringify(environment, null, 2)}

Decide qué acciones ejecutar. Responde SOLO con JSON.`;

            const result = await this.chat.sendMessage({
                message: userPrompt
            });

            const text = result.text;

            console.log("Respuesta cruda:", text);

            // Limpiar posible markdown
            let cleanText = text.trim();
            cleanText = cleanText.replace(/```json\n?/g, '');
            cleanText = cleanText.replace(/```\n?/g, '');
            cleanText = cleanText.trim();

            const parsed = JSON.parse(cleanText);

            // Validar estructura
            if (!parsed.actions || !Array.isArray(parsed.actions)) {
                throw new Error("Respuesta del LLM no tiene formato válido");
            }

            // Validar acciones
            for (const action of parsed.actions) {
                if (!actionRegistry.hasAction(action.name)) {
                    throw new Error(`Acción desconocida: ${action.name}`);
                }
            }

            return parsed;
        } catch (error) {
            console.error('Error en LLM:', error);
            throw new Error(`Error al procesar con Gemini: ${error.message}`);
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }
}

export default LLMClient;
