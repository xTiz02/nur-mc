import pathfinder from "mineflayer-pathfinder";

const {goals, Movements} = pathfinder;
// Acciones random para el bot
const randomActions = {
  breakBlock: {
    description: "Rompe un bloque del tipo especificado que esté cerca",
    params: ["blockType"],
    execute: async (bot, params) => {
      const {blockType} = params;
      const block = bot.findBlock({
        matching: (b) => b.name === blockType,
        maxDistance: 6
      });

      if (!block) {
        throw new Error(
            `No encontré ningún bloque de tipo ${blockType} cerca`);
      }

      await bot.dig(block);
      return `Rompí el bloque ${blockType}`;
    }
  },
  exploreUntil: {
    description: "Explora alrededor hasta que el callback retorne true o se acabe el tiempo limite de exploracion",
    params: ["direction", "maxTime", "callback (opcional)"],
    execute: async (bot, params) => {
      let {direction,maxTime,callback} = params;

      if (!callback){
        callback = () => false;
      }
      // const test = callback();
      // if (test) {
      //   bot.chat("Explore success.");
      //   return Promise.resolve(test);
      // }
      if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
        throw new Error("direction cannot be 0, 0, 0");
      }
      if (
          !(
              (direction.x === 0 || direction.x === 1 || direction.x === -1) &&
              (direction.y === 0 || direction.y === 1 || direction.y === -1) &&
              (direction.z === 0 || direction.z === 1 || direction.z === -1)
          )
      ) {
        throw new Error(
            "direction must be a Vec3 only with value of -1, 0 or 1"
        );
      }
      maxTime = Math.min(maxTime, 1200);
      return new Promise((resolve, reject) => {
        const dx = direction.x;
        const dy = direction.y;
        const dz = direction.z;

        let explorationInterval;
        let maxTimeTimeout;

        const cleanUp = () => {
          clearInterval(explorationInterval);
          clearTimeout(maxTimeTimeout);
          bot.pathfinder.setGoal(null);
        };

        const explore = () => {
          const x =
              bot.entity.position.x +
              Math.floor(Math.random() * 20 + 10) * dx;
          const y =
              bot.entity.position.y +
              Math.floor(Math.random() * 20 + 10) * dy;
          const z =
              bot.entity.position.z +
              Math.floor(Math.random() * 20 + 10) * dz;
          let goal = new goals.GoalNear(x, y, z);
          if (dy === 0) {
            goal = new goals.GoalNearXZ(x, z);
          }
          bot.pathfinder.setGoal(goal);

          try {
            const result = callback();
            if (result) {
              cleanUp();
              bot.chat("Explore success.");
              resolve(result);
            }
          } catch (err) {
            cleanUp();
            reject(err);
          }
        };

        explorationInterval = setInterval(explore, 2000);

        maxTimeTimeout = setTimeout(() => {
          cleanUp();
          bot.chat("Max exploration time reached");
          resolve(null);
        }, maxTime * 1000);
      });
    }
  }
}

export {randomActions};