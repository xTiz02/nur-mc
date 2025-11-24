
function getEnvironmentData(
    bot,
) {
  try {
    const observationsRaw = bot.observe();
    const observations = JSON.parse(observationsRaw);
    const latestObs = observations.length > 0 ? observations[observations.length
    - 1][1] : {};

    return {
      timestamp: Date.now(),
      position: {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
      },
      health: bot.health,
      food: bot.food,
      gameMode: bot.game.gameMode,
      timeOfDay: bot.time.timeOfDay,
      isRaining: bot.isRaining,
      observations: latestObs,
      nearbyPlayers: Object.keys(bot.players).filter(
          p => p !== bot.username),
      heldItem: bot.heldItem ? bot.heldItem.name : null,
      experience: {
        level: bot.experience.level,
        points: bot.experience.points
      }
    };
  } catch (error) {
    console.error('Error obteniendo datos del entorno:', error);
    return {
      error: 'No se pudo obtener el entorno completo',
      position: {
        x: Math.floor(bot.entity.position.x),
        y: Math.floor(bot.entity.position.y),
        z: Math.floor(bot.entity.position.z)
      },
      health: bot.health,
      timestamp: Date.now()
    };
  }
}

export {getEnvironmentData};