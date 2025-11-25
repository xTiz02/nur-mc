import {getEnvironmentData} from "../action/parse_observation.js";
import ActionExecutor from '../action/executor.js';

class AgentManager {
  constructor(bot, llmClient) {
    this.bot = bot;
    this.llmClient = llmClient;
    this.executor = new ActionExecutor(bot);
  }

  async executeActionPrompt(prompt, requestId) {
    // 1. Obtener estado del entorno
    const environmentData = getEnvironmentData(this.bot);
    console.log("Datos del Mundo: ", environmentData)
    // 2. Consultar a Gemini
    console.log(' Consultando a Gemini...');
    const llmResponse = await this.llmClient.decideActions(prompt,
        environmentData);

    console.log(` Gemini decidió: ${llmResponse.reasoning}`);

    if (llmResponse.actions.length > 0) {
      console.log(
          ` Acciones a ejecutar: ${llmResponse.actions.map(a => a.name).join(
              ', ')}`);
    }

    // 3. Ejecutar acciones
    if (llmResponse.actions.length === 0) {
      return {
        requestId,
        success: true,
        actions: [],
        reasoning: llmResponse.reasoning,
        results: [],
        environment: environmentData
      };
    }

    const executionResult = await this.executor.executeActions(
        llmResponse.actions,
        requestId
    );

    console.log(
        ` Petición [${requestId}] completada: ${executionResult.completedActions}/${executionResult.totalActions} acciones exitosas\n`);

    // 4. Enviar resultado
    return {
      requestId,
      success: executionResult.success,
      actions: llmResponse.actions.map(a => a.name),
      reasoning: llmResponse.reasoning,
      results: executionResult.results,
      completedActions: executionResult.completedActions,
      totalActions: executionResult.totalActions,
      environment: getEnvironmentData(this.bot)
    };
  }

  async stopExecution() {
    this.executor.stopExecution();
  }

  isExecuting() {
    return this.executor.isExecuting;
  }
}

export default AgentManager;