import config from '../../util/constants.js';

// Acciones complementarias
const utilActions = {
  getNearbyPlayers: {
    execute: (bot) => {
      const radius = config.OBSERVATION_DISTANCE / 2;
      return Object.values(bot.players).filter(p => {
        return p.entity &&
          p.entity.position.distanceTo(bot.entity.position) < radius;
      }).map(p => p.username);
    }
  },
  waitUntilAttackEnds: {
    execute: (bot) => {
      return new Promise(resolve => {
        bot.once('stoppedAttacking', resolve);
      });
    }
  },
  waitUntilAirHitsEnds: {
    execute: (bot, params) => {
      return new Promise((resolve, reject) => {
        const {secondsTime} = params;
        // Timeout normal
        const timer = setTimeout(() => {
          console.log("Tiempo cumplido");
          resolve("timeout");
        }, secondsTime * 1000);

        const onAutoShotStopped = () => {
          console.log("HawkEye detuvo el auto-ataque");
          clearTimeout(timer);
          resolve("stopped");
        };

        const onError = (err) => {
          console.log("Error del bot durante ataque", err);
          clearTimeout(timer);
          reject(err);
        };

        bot.once("auto_shot_stopped", onAutoShotStopped);
        bot.once("error", onError);
      });
    }
  }
}

export {utilActions};