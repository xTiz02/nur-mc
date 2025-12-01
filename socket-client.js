import {io} from 'socket.io-client';
import config from './util/constants.js';
import {getEnvironmentData} from "./src/action/parse_observation.js";

class SocketIOClient {
  constructor(bot, agent) {
    this.bot = bot;
    this.agent = agent;
    this.socket = null;
    this.isConnected = false;
    this.environmentUpdateInterval = null;
  }

  connect() {
    const socketUrl = `http://${config.PYTHON_AGENT_HOST}:${config.PYTHON_AGENT_PORT}`;
    console.log(` Conectando al agente Python en ${socketUrl}...`);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 10000,
      reconnectionAttempts: 10
    });

    // ==================== EVENTOS DE CONEXIÓN ====================

    this.socket.on('connect', () => {
      console.log(' Conectado al agente Python via Socket.IO');
      this.isConnected = true;

      // Enviar estado inicial del bot
      this.emitBotReady();

      // Iniciar envío periódico del entorno
        this.handleEnvironmentRequest()
        this.startEnvironmentUpdates();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(` Desconectado del agente Python: ${reason}`);
      this.isConnected = false;

      if (this.environmentUpdateInterval) {
        clearInterval(this.environmentUpdateInterval);
        this.environmentUpdateInterval = null;
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error(' Error de conexión:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(` Reconectado después de ${attemptNumber} intentos`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(` Intentando reconectar... (intento ${attemptNumber})`);
    });

    // ==================== EVENTOS PERSONALIZADOS ====================

    // Evento para solicitar acción al bot
    this.socket.on('minecraft_action_request', async (data) => {
      console.log(" Evento recibido: minecraft_action_request");
      await this.handleActionRequest(data);
    });

    this.socket.on('minecraft_view_user_face', async (data) => {
      console.log(" Evento recibido: minecraft_view_user_face");
      await this.handleViewPlayerRequest(data);
    });

    // Evento para solicitar estado del entorno
    this.socket.on('minecraft_request_environment', async () => {
      await this.handleEnvironmentRequest();
    });

    // Evento para detener ejecución
    this.socket.on('minecraft_stop_execution', () => {
      this.handleStopExecution();
    });

    // Evento de prueba
    this.socket.on('ping', () => {
      console.log(' Ping recibido del servidor');
      this.socket.emit('pong');
    });
  }

  // ==================== ENVIAR EVENTOS ====================

  emitBotReady() {
    const data = {
      botName: this.bot.username,
      position: {
        x: Math.floor(this.bot.entity.position.x),
        y: Math.floor(this.bot.entity.position.y),
        z: Math.floor(this.bot.entity.position.z)
      },
      health: this.bot.health,
      food: this.bot.food,
      gameMode: this.bot.game.gameMode
    };

    this.socket.emit('minecraft_bot_ready', data);
    console.log(' Enviado: bot_ready');
  }

  emitEnvironmentUpdate(data) {
    if (this.isConnected) {
      this.socket.emit('environment_update', data);
    }
  }

  emitActionCompleted(data) {
    this.socket.emit('minecraft_action_completed', data);
    console.log(` Enviado: action_completed [${data}]`);
  }

  emitActionFailed(data) {
    this.socket.emit('minecraft_action_failed', data);
    console.log(` Enviado: action_failed [${data}]`);
  }

  emitExecutionStopped() {
    this.socket.emit('minecraft_execution_stopped', {
      message: 'Ejecución detenida'
    });
    console.log(' Enviado: execution_stopped');
  }

  // ==================== MANEJAR EVENTOS RECIBIDOS ====================

  async handleActionRequest(payload) {
    const {prompt, requestId} = payload;

    if (!prompt || !requestId) {
      console.error(' Petición inválida: falta prompt o requestId');
      return;
    }

    console.log(`\n Nueva petición [${requestId}]: "${prompt}"`);

    try {
      const results = await this.agent.executeActionPrompt(prompt, requestId);
      this.emitActionCompleted(results);

    } catch (error) {
      console.error(`Error en petición [${requestId}]:`, error);

      this.emitActionFailed({
        requestId,
        error: error.message,
        stack: error.stack,
        environment: getEnvironmentData(this.bot)
      });
    }
  }
  async handleViewPlayerRequest(payload) {
    const {name, requestId, speak_time} = payload;

    if (!name || !requestId) {
      console.error(' Petición inválida: falta playerName o requestId');
      return;
    }

    console.log(`\n Nueva petición [${requestId}]: "Ver cara de ${name}"`);

    try {
      const results = await this.agent.executeViewPlayerFace(name, requestId);
      this.emitActionCompleted(results);

    } catch (error) {
      console.error(`Error en petición [${requestId}]:`, error);

      this.emitActionFailed({
        requestId,
        error: error.message,
        stack: error.stack,
        environment: getEnvironmentData(this.bot)
      });
    }
  }

  handleEnvironmentRequest() {
    const environmentData = getEnvironmentData(this.bot);
    this.emitEnvironmentUpdate(environmentData);
  }

  handleStopExecution() {
    this.agent.stopExecution();
    this.emitExecutionStopped();
  }

  // ==================== ACTUALIZACIONES PERIÓDICAS ====================

  startEnvironmentUpdates() {
    // Enviar actualización cada 5 segundos si no está ejecutando acciones
    this.environmentUpdateInterval = setInterval(() => {
      if (this.isConnected && !this.agent.isExecuting) {
        const environmentData = getEnvironmentData(this.bot);
        this.emitEnvironmentUpdate(environmentData);
      }
    }, config.ENVIRONMENT_UPDATE_INTERVAL);

    console.log(
        `Actualizaciones automáticas del entorno iniciadas (cada ${config.ENVIRONMENT_UPDATE_INTERVAL
        / 1000}s)`);
  }

  // ==================== DESCONEXIÓN ====================

  disconnect() {
    if (this.environmentUpdateInterval) {
      clearInterval(this.environmentUpdateInterval);
      this.environmentUpdateInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      console.log(' Desconectado del servidor Socket.IO');
    }
  }
}

export default SocketIOClient;