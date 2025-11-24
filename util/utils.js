import config from './constants.js';
import actionRegistry from '../src/action/index.js';

function buildSystemPrompt() {
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

function createUserPrompt(prompt,environment) {
  return `PETICIÓN DEL USUARIO: ${prompt}
  
  ESTADO DEL ENTORNO:
  ${JSON.stringify(environment, null, 2)}
  
  Decide qué acciones ejecutar. Responde SOLO con JSON.`;
}

export {buildSystemPrompt, createUserPrompt};