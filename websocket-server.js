import { io } from 'socket.io-client';
import config from './util/constants.js';

class SocketIOClient {
    constructor(bot, llmClient, executor) {
        this.bot = bot;
        this.llmClient = llmClient;
        this.executor = executor;
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
            reconnectionDelay: 5000,
            reconnectionAttempts: Infinity
        });

        // ==================== EVENTOS DE CONEXIÓN ====================

        this.socket.on('connect', () => {
            console.log(' Conectado al agente Python via Socket.IO');
            this.isConnected = true;

            // Enviar estado inicial del bot
            this.emitBotReady();

            // Iniciar envío periódico del entorno
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
            console.log(" Evento recibido: action_request");
            await this.handleActionRequest(data);
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
            console.log(' Enviado: environment_update');
        }
    }

    emitActionCompleted(data) {
        this.socket.emit('minecraft_action_completed', data);
        console.log(` Enviado: action_completed [${data.requestId}]`);
    }

    emitActionFailed(data) {
        this.socket.emit('minecraft_action_failed', data);
        console.log(` Enviado: action_failed [${data.requestId}]`);
    }

    emitExecutionStopped() {
        this.socket.emit('minecraft_execution_stopped', {
            message: 'Ejecución detenida'
        });
        console.log(' Enviado: execution_stopped');
    }

    // ==================== MANEJAR EVENTOS RECIBIDOS ====================

    async handleActionRequest(payload) {
        const { prompt, requestId } = payload;

        if (!prompt || !requestId) {
            console.error(' Petición inválida: falta prompt o requestId');
            return;
        }

        console.log(`\n Nueva petición [${requestId}]: "${prompt}"`);

        try {
            // 1. Obtener estado del entorno
            const environmentData = this.getEnvironmentData();

            // 2. Consultar a Gemini
            console.log(' Consultando a Gemini...');
            const llmResponse = await this.llmClient.decideActions(prompt, environmentData);

            console.log(` Gemini decidió: ${llmResponse.reasoning}`);

            if (llmResponse.actions.length > 0) {
                console.log(`📋 Acciones a ejecutar: ${llmResponse.actions.map(a => a.name).join(', ')}`);
            }

            // 3. Ejecutar acciones
            if (llmResponse.actions.length === 0) {
                this.emitActionCompleted({
                    requestId,
                    success: true,
                    actions: [],
                    reasoning: llmResponse.reasoning,
                    results: [],
                    environment: environmentData
                });
                return;
            }

            const executionResult = await this.executor.executeActions(
                llmResponse.actions,
                requestId
            );

            // 4. Enviar resultado
            this.emitActionCompleted({
                requestId,
                success: executionResult.success,
                actions: llmResponse.actions.map(a => a.name),
                reasoning: llmResponse.reasoning,
                results: executionResult.results,
                completedActions: executionResult.completedActions,
                totalActions: executionResult.totalActions,
                environment: this.getEnvironmentData()
            });

            console.log(` Petición [${requestId}] completada: ${executionResult.completedActions}/${executionResult.totalActions} acciones exitosas\n`);

        } catch (error) {
            console.error(`Error en petición [${requestId}]:`, error);

            this.emitActionFailed({
                requestId,
                error: error.message,
                stack: error.stack,
                environment: this.getEnvironmentData()
            });
        }
    }

    handleEnvironmentRequest() {
        const environmentData = this.getEnvironmentData();
        this.emitEnvironmentUpdate(environmentData);
        console.log(' Enviado entorno por solicitud');
    }

    handleStopExecution() {
        this.executor.stopExecution();
        this.emitExecutionStopped();
    }

    // ==================== DATOS DEL ENTORNO ====================

    getEnvironmentData() {
        try {
            const observationsRaw = this.bot.observe();
            const observations = JSON.parse(observationsRaw);
            const latestObs = observations.length > 0 ? observations[observations.length - 1][1] : {};

            return {
                timestamp: Date.now(),
                position: {
                    x: Math.floor(this.bot.entity.position.x),
                    y: Math.floor(this.bot.entity.position.y),
                    z: Math.floor(this.bot.entity.position.z)
                },
                health: this.bot.health,
                food: this.bot.food,
                gameMode: this.bot.game.gameMode,
                timeOfDay: this.bot.time.timeOfDay,
                isRaining: this.bot.isRaining,
                observations: latestObs,
                nearbyPlayers: Object.keys(this.bot.players).filter(p => p !== this.bot.username),
                heldItem: this.bot.heldItem ? this.bot.heldItem.name : null,
                experience: {
                    level: this.bot.experience.level,
                    points: this.bot.experience.points
                }
            };
        } catch (error) {
            console.error('Error obteniendo datos del entorno:', error);
            return {
                error: 'No se pudo obtener el entorno completo',
                position: {
                    x: Math.floor(this.bot.entity.position.x),
                    y: Math.floor(this.bot.entity.position.y),
                    z: Math.floor(this.bot.entity.position.z)
                },
                health: this.bot.health,
                timestamp: Date.now()
            };
        }
    }

    // ==================== ACTUALIZACIONES PERIÓDICAS ====================

    startEnvironmentUpdates() {
        // Enviar actualización cada 5 segundos si no está ejecutando acciones
        this.environmentUpdateInterval = setInterval(() => {
            if (this.isConnected && !this.executor.isExecuting) {
                const environmentData = this.getEnvironmentData();
                this.emitEnvironmentUpdate(environmentData);
            }
        }, config.ENVIRONMENT_UPDATE_INTERVAL);

        console.log(`Actualizaciones automáticas del entorno iniciadas (cada ${config.ENVIRONMENT_UPDATE_INTERVAL/1000}s)`);
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