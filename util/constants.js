export default {
  // Minecraft
  MINECRAFT_HOST: 'localhost',
  MINECRAFT_PORT: 5050,
  BOT_USERNAME: 'Nila',
  OBSERVATION_DISTANCE: 64,
  // WebSocket
  PYTHON_AGENT_PORT: 8081,
  PYTHON_AGENT_HOST: 'localhost',

  // Configuraciones
  ENVIRONMENT_UPDATE_INTERVAL: 5000, // 5 segundos
  MAX_ACTIONS_PER_REQUEST: 10,
  OBSERVATION_RADIUS: {
    x: 8,
    y: 2,
    z: 8
  },
  NEARBY_BLOCKS_RADIUS: 16,
  MAX_RETRIES: 3,
  ACTION_TIMEOUT: 30000 // 30 segundos
};