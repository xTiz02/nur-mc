import 'dotenv/config';
import MinecraftBot from './nila.js';
import LLMClient from './src/llm/gemini_client.js';
import ActionExecutor from './src/action/executor.js';
import SocketIOClient from './socket-client.js';
import AgentManager from "./src/agent/agent.js";

async function main() {
  console.log('MINECRAFT BOT');

  try {
    // 1. Conectar bot de Minecraft
    const minecraftBot = new MinecraftBot();
    await minecraftBot.connect();
    const bot = minecraftBot.getBot();

    // 2. Inicializar LLM Client
    console.log('\n Inicializando cliente Gemini...');
    const llmClient = new LLMClient();

    // 3. Inicializar Action Executor
    console.log('️ Inicializando ejecutor de acciones...');
    const executor = new ActionExecutor(bot);

    // 4. Iniciar servidor WebSocket
    console.log(' Iniciando servidor WebSocket...');
    const agent = new AgentManager(bot, llmClient);
    const socketClient = new SocketIOClient(bot, agent);
    socketClient.connect();

    console.log('\n Sistema completamente inicializado');
    console.log(' Esperando conexión del Agente Python...\n');

    // Manejo de señales para cerrar limpiamente
    process.on('SIGINT', () => {
      console.log('\n\n Cerrando sistema...');
      socketClient.disconnect();
      minecraftBot.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('\n Error fatal:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error(' Promesa rechazada no manejada:', error);
});

process.on('uncaughtException', (error) => {
  console.error(' Excepción no capturada:', error);
  process.exit(1);
});

main();

// const mineflayer = require('mineflayer')
//
// const bot = mineflayer.createBot({
//   host: 'localhost', // minecraft server ip
//   username: 'Bot', // username to join as if auth is `offline`, else a unique identifier for this account. Switch if you want to change accounts
//   auth: 'offline', // for offline mode servers, you can set this to 'offline'
//   port: 61251,              // set if you need a port that isn't 25565
//   // version: false,           // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
//   // password: '12345678'      // set if you want to use password-based auth (may be unreliable). If specified, the `username` must be an email
// })
//
// bot.on('chat', (username, message) => {
//   if (username === bot.username) return
//   bot.chat(message)
// })
//
// // Log errors and kick reasons:
// bot.on('kicked', console.log)
// bot.on('error', console.log)