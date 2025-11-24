import actionRegistry from '../action/index.js';
import config from '../../util/constants.js';

class ActionExecutor {
  constructor(bot) {
    this.bot = bot;
    this.isExecuting = false;
    this.currentRequestId = null;
  }

  async executeActions(actions, requestId) {
    if (this.isExecuting) {
      throw new Error("Ya hay una ejecución en progreso");
    }

    this.isExecuting = true;
    this.currentRequestId = requestId;

    const results = [];
    let allSuccessful = true;

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        console.log(`[${requestId}] Ejecutando acción ${i
        + 1}/${actions.length}: ${action.name}`);

        try {
          const actionDef = actionRegistry.getAction(action.name);

          if (!actionDef) {
            throw new Error(`Acción no encontrada: ${action.name}`);
          }

          // Timeout para cada acción
          const result = await Promise.race([
            actionDef.execute(this.bot, action.params || {}),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')),
                    config.ACTION_TIMEOUT)
            )
          ]);

          results.push({
            action: action.name,
            success: true,
            result: result
          });

          console.log(`[${requestId}] ✓ ${action.name}: ${result}`);

          // Pequeña pausa entre acciones
          await this.bot.waitForTicks(10);

        } catch (error) {
          allSuccessful = false;
          results.push({
            action: action.name,
            success: false,
            error: error.message
          });

          console.error(`[${requestId}] ✗ ${action.name}: ${error.message}`);

          // Decidir si continuar o detener
          if (this.shouldStopOnError(action.name, error)) {
            console.log(
                `[${requestId}] Deteniendo ejecución por error crítico`);
            break;
          }
        }
      }

      return {
        success: allSuccessful,
        results: results,
        totalActions: actions.length,
        completedActions: results.filter(r => r.success).length
      };

    } finally {
      this.isExecuting = false;
      this.currentRequestId = null;
    }
  }

  shouldStopOnError(actionName, error) {
    // Errores que deberían detener la ejecución
    const criticalErrors = [
      'Timeout',
      'pathfinding failed',
      'No encontré'
    ];

    return criticalErrors.some(e => error.message.includes(e));
  }

  stopExecution() {
    if (this.isExecuting) {
      this.bot.pathfinder.setGoal(null);
      this.isExecuting = false;
      console.log(`[${this.currentRequestId}] Ejecución detenida manualmente`);
    }
  }
}

export default ActionExecutor;
