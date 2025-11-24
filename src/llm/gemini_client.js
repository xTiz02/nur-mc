import 'dotenv/config';
import {GoogleGenAI} from '@google/genai';
import config from '../../util/constants.js';
import actionRegistry from '../action/index.js';
import {buildSystemPrompt, createUserPrompt} from "../../util/utils.js";

class LLMClient {
  constructor() {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.PROJECT_ID,
      location: process.env.REGION,
    });
    this.chat = ai.chats.create({
      model: process.env.MODEL_NAME, config: {
        temperature: 0.2,
        systemInstruction: buildSystemPrompt()
      }
    });
    this.conversationHistory = [];
  }

  async decideActions(prompt, environment) {
    try {
     const userPrompt = createUserPrompt(prompt,environment);

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
