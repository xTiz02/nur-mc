import config from '../../util/constants.js';

// Acciones complementarias
const utilActions = {
   getNearbyPlayers: {
     execute: async (bot) => {
      const radius = config.OBSERVATION_RADIUS
       return Object.values(bot.players).filter(p => {
        return p.entity &&
            p.entity.position.distanceTo(bot.entity.position) < radius;
      }).map(p => p.username);
     }
   }
}

export {utilActions};