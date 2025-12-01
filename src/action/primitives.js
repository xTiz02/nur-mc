import pathfinder from 'mineflayer-pathfinder';
import {getBlockId} from "../../util/mcData.js";
import config from '../../util/constants.js';
import {utilActions} from "./util_action.js";
import {Weapons} from "minecrafthawkeye";

const {goals, Movements} = pathfinder;

// Acciones basicas que el bot tendra siempre en su contexto
const primitiveActions = {
  // ==================== MOVIMIENTO ====================
  walkTo: {
    name: "walkTo",
    description: "Camina hacia una posición específica de un player o hacia un tipo de bloque",
    params: ["target (puede ser player como 'Piero' o nombre de bloque como 'oak_log')"],
    execute: async (bot, params) => {
      const {target} = params;
      // Intentar encontrar jugador primero
      const player = bot.players[target];

      if (player && player.entity) {
        const goal = new goals.GoalFollow(player.entity, 2);
        await bot.pathfinder.goto(goal);
        return `Llegué cerca del jugador ${target} en ${player.entity.position}`;
      } else {
        // Intentar encontrar bloque
        const block = bot.findBlock({
          matching: (b) => b.name === target, maxDistance: 64
        });

        if (!block) {
          throw new Error(`No encontré ningún player ni bloque ${target} cercano`);
        }

        const goal = new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2);
        await bot.pathfinder.goto(goal);
        return `Llegué al bloque ${target} en ${block.position}`;
      }
    }
  },

  followPlayer: {
    name: "followPlayer",
    description: "Sigue a un jugador específico",
    params: ["playerName"], execute: async (bot, params) => {
      const {playerName} = params;
      const player = bot.players[playerName];

      if (!player || !player.entity) {
        throw new Error(`Jugador ${playerName} no encontrado`);
      }

      const goal = new goals.GoalFollow(player.entity, 2);
      bot.pathfinder.setGoal(goal, true);
      return `Siguiendo a ${playerName}`;
    }
  },

  stopMoving: {
    name: "stopMoving",
    description: "Detiene cualquier movimiento actual",
    params: [], execute: async (bot, params) => {
      bot.pathfinder.setGoal(null);
      return "Movimiento detenido";
    }
  },

  // ==================== INTERACCIÓN CON BLOQUES ====================
  hitPlayerWhitBowForLoop: {
    name: "hitWhitBowForLoop",
    description: "Dispara flechas con arco en un bucle durante un tiempo hacia un player",
    params: ["playerName", "secondsTime (opcional, default: 6)"],
    execute: async (bot, params) => {
      const {playerName, secondsTime = 6} = params;

      const playersAround = utilActions.getNearbyPlayers.execute(bot);

      if (!playersAround.includes(playerName)) {
        throw new Error(`No encontré al jugador ${playerName} cercano`);
      }

      const target = bot.hawkEye.getPlayer(playerName);
      if (!target) {
        throw new Error(`No encontré al jugador ${playerName}`);
      }

      console.log("Encontrado, atacando por tiempo limitado con arco a ", playerName);

      bot.hawkEye.autoAttack(target, Weapons.bow);

      // Esperar el tiempo solicitado o detener si hay error
      try {
        await utilActions.waitUntilAirHitsEnds.execute(bot, {secondsTime});
      } finally {
        // Pase lo que pase, detener el ataque
        console.log("Deteniendo ataque automático...");
        bot.hawkEye.stop();
      }
    }

  },
  throwSnowballs: {
    name: "throwSnowballs",
    description: "Lanza una cantidad de bolas de nieve hacia una entidad móvil cercana",
    params: ["mobNameOrPlayerName", "count (opcional, default: 1, maximo: 16)"],
    execute: async (bot, params) => {
      const {mobNameOrPlayerName, count = 1} = params;
      const playersAround = utilActions.getNearbyPlayers.execute(bot);
      let target = null;
      if (playersAround.includes(mobNameOrPlayerName)) {
        target = bot.hawkEye.getPlayer(mobNameOrPlayerName);
      } else {
        target = bot.nearestEntity(
          (entity) =>
            entity.name === mobNameOrPlayerName &&
            entity.position.distanceTo(bot.entity.position) < config.OBSERVATION_DISTANCE / 2
        );
      }

      if (!target) {
        throw new Error(`No encontré ninguna entidad ni jugador ${mobNameOrPlayerName} cercana`);
      }
      for (let i = 0; i < count; i++) {
        bot.hawkEye.oneShot(target, Weapons.snowball);
      }

      // Esperar el tiempo solicitado o detener si hay error
      try {
        let time = 3;
        if (count > 5) time = 4;
        if (count > 10) time = 6;
        await utilActions.waitUntilAirHitsEnds.execute(bot, {secondsTime: time});
      } catch (e) {
        // Pase lo que pase, detener el ataque
        console.log("Deteniendo ataque automático...");
        bot.hawkEye.stop();
      }
    }
  },
  hitOnceWithBow: {
    name: "hitOnceWithBow",
    description: "Dispara una flecha con arco solo una vez hacia una entidad móvil cercana de un tipo específico",
    params: ["mobNameOrPlayerName"],
    execute: async (bot, params) => {
      const {mobNameOrPlayerName} = params;
      const playersAround = utilActions.getNearbyPlayers.execute(bot);
      let target = null;
      if (playersAround.includes(mobNameOrPlayerName)) {
        target = bot.hawkEye.getPlayer(mobNameOrPlayerName);
      } else {
        target = bot.nearestEntity(
          (entity) =>
            entity.name === mobNameOrPlayerName &&
            entity.position.distanceTo(bot.entity.position) < config.OBSERVATION_DISTANCE / 2
        );
      }
      console.log("Target for bow attack:", target);
      if (!target) {
        throw new Error(`No encontré ninguna entidad ni jugador ${mobNameOrPlayerName} cercana`);
      }
      bot.hawkEye.oneShot(target, Weapons.bow)
      try {
        await utilActions.waitUntilAirHitsEnds.execute(bot, {secondsTime: 4});
      } catch (e) {
        // Pase lo que pase, detener el ataque
        console.log("Deteniendo ataque automático...");
        bot.hawkEye.stop();
      }

    }
  },
  killMob: {
    name: "killMob",
    description: "Mata una entidad móvil cercana de un tipo específico",
    params: ["mobName"],
    execute: async (bot, params) => {
      const {mobName} = params;
      const entity = bot.nearestEntity(
        (entity) =>
          entity.name === mobName &&
          entity.position.distanceTo(bot.entity.position) < config.OBSERVATION_DISTANCE / 2
      );
      if (!entity) {
        throw new Error(`No encontré ninguna entidad ${mobName} cercana`);
      }

      await bot.pathfinder.goto(
        new goals.GoalBlock(entity.position.x, entity.position.y, entity.position.z)
      );

      await bot.pvp.attack(entity);

      await utilActions.waitUntilAttackEnds.execute(bot);

      return `Maté al ${mobName} en ${entity.position}`;
    }
  },
  mineBlock: {
    name: "mineBlock",
    description: "Mina uno o varios bloques de un tipo específico cercano",
    params: ["blockType", "count (opcional default: 1)"],
    execute: async (bot, params) => {
      const {blockType, count = 1} = params;

      const blockTypeId = getBlockId(blockType);
      if (blockTypeId === null) {
        bot.chat(`Tipo de bloque desconocido: ${blockType}`);
        return;
      } else {
        console.log(`Buscando bloques de tipo ${blockType} (ID: ${blockTypeId})`);
      }
      const block = bot.findBlock({
        matching: blockTypeId,
        maxDistance: config.OBSERVATION_DISTANCE / 2
      })

      if (!block) {
        bot.chat("No encontré ningún bloque " + blockType + " cercano");
        return
      } else {
        console.log(`Encontré un bloque de ${blockType} en ${block.position}`);
      }

      const targets = bot.collectBlock.findFromVein(
        block, count
      )
      console.log(`Encontré un total de ${targets.length} bloques de ${blockType} en la vena`);
      try {
        await bot.collectBlock.collect(targets)
        bot.chat('Done')
      } catch (err) {
        bot.chat(err.message)
        console.log(err)
      }

      return `Miné ${Math.min(count, targets.length)} bloques de ${blockType}`;
      // const blockTypeId = getBlockId(blockType);
      // const blocks = bot.findBlocks({
      //   matching: blockTypeId,
      //   maxDistance: 32,
      //   count: count
      // })
      //
      // if (blocks.length === 0) {
      //   bot.chat("I don't see that block nearby.")
      //   return
      // }
      //
      // const targets = []
      // for (let i = 0; i < Math.min(blocks.length, count); i++) {
      //   targets.push(bot.blockAt(blocks[i]))
      // }
      //
      // bot.chat(`Found ${targets.length} ${blockType}(s)`)
      //
      // try {
      //   await bot.collectBlock.collect(targets, {ignoreNoPath : true})
      //   // All blocks have been collected.
      //   bot.chat('Done')
      // } catch (err) {
      //   // An error occurred, report it.
      //   bot.chat(err.message)
      //   console.log(err)
      // }
    }
  },
  placeBlock: {
    name: "placeBlock",
    description: "Coloca un bloque del inventario en una posición relativa",
    params: ["blockType", "position (opcional default: frente al bot)"],
    execute: async (bot, params) => {
      const {blockType, position} = params;
      const item = bot.inventory.items().find(i => i.name === blockType);

      if (!item) {
        throw new Error(`No tengo ${blockType} en mi inventario`);
      }

      await bot.equip(item, 'hand');

      let referenceBlock;
      if (position) {
        referenceBlock = bot.blockAt(position);
      } else {
        // Coloca frente al bot
        const frontPos = bot.entity.position.offset(0, -1, 1);
        referenceBlock = bot.blockAt(frontPos);
      }

      if (!referenceBlock) {
        throw new Error("No puedo encontrar un bloque de referencia para colocar");
      }

      await bot.placeBlock(referenceBlock, new bot.Vec3(0, 1, 0));
      return `Coloqué ${blockType}`;
    }
  }, // ==================== ITEMS ====================
  equipItem: {
    name: "equipItem",
    description: "Equipa un item del inventario",
    params: ["itemName", "destination ('hand', 'head', 'torso', 'legs', 'feet')"],
    execute: async (bot, params) => {
      const {itemName, destination = 'hand'} = params;
      const item = bot.inventory.items().find(i => i.name === itemName);

      if (!item) {
        throw new Error(`No tengo ${itemName} en mi inventario`);
      }

      await bot.equip(item, destination);
      return `Equipé ${itemName} en ${destination}`;
    }
  },

  dropItem: {
    name: "dropItem",
    description: "Suelta items del inventario",
    params: ["itemName", "quantity (opcional, default: todo)"],
    execute: async (bot, params) => {
      const {itemName, quantity} = params;
      const item = bot.inventory.items().find(i => i.name === itemName);

      if (!item) {
        throw new Error(`No tengo ${itemName} en mi inventario`);
      }

      const amountToDrop = quantity || item.count;
      await bot.toss(item.type, null, amountToDrop);
      return `Solté ${amountToDrop} de ${itemName}`;
    }
  },

  collectNearby: {
    name: "collectNearby",
    description: "Recoge items del suelo cercanos",
    params: ["itemType (opcional)"],
    execute: async (bot, params) => {
      const {itemType} = params;
      const items = Object.values(bot.entities).filter(e => {
        return e.objectType === 'Item' && e.position.distanceTo(bot.entity.position) < 16 && (!itemType || e.name === itemType);
      });

      if (items.length === 0) {
        return `No encontré items${itemType ? ` de tipo ${itemType}` : ''} cerca`;
      }

      for (const item of items.slice(0, 5)) {
        const goal = new goals.GoalNear(item.position.x, item.position.y, item.position.z, 1);
        await bot.pathfinder.goto(goal);
        await bot.waitForTicks(20);
      }

      return `Recogí ${items.length} items`;
    }
  },

  // ==================== COMUNICACIÓN ====================
  chat: {
    description: "Envía un mensaje al chat general", params: ["message"], execute: async (bot, params) => {
      const {message} = params;
      bot.chat(message);
      return `Mensaje enviado: ${message}`;
    }
  },

  whisper: {
    description: "Envía un mensaje privado a un jugador",
    params: ["playerName", "message"],
    execute: async (bot, params) => {
      const {playerName, message} = params;
      bot.whisper(playerName, message);
      return `Mensaje privado enviado a ${playerName}`;
    }
  },

  // ==================== INFORMACIÓN ====================
  getInventory: {
    description: "Obtiene el inventario actual (ya disponible en observations)",
    params: [],
    execute: async (bot, params) => {
      const items = bot.inventory.items().reduce((acc, item) => {
        if (acc[item.name]) {
          acc[item.name] += item.count;
        } else {
          acc[item.name] = item.count;
        }
        return acc;
      }, {});
      return JSON.stringify(items);
    }
  },

  getNearbyBlocks: {
    description: "Obtiene bloques cercanos de un tipo específico",
    params: ["blockType", "radius (opcional, default: 16)"],
    execute: async (bot, params) => {
      const {blockType, radius = 16} = params;
      const blocks = bot.findBlocks({
        matching: (b) => b.name === blockType, maxDistance: radius, count: 100
      });
      return `Encontré ${blocks.length} bloques de ${blockType} cerca`;
    }
  },

  getNearbyPlayers: {
    description: "Obtiene jugadores cercanos",
    params: ["radius (opcional, default: 32)"],
    execute: async (bot, params) => {
      const {radius = 32} = params;
      const players = Object.values(bot.players).filter(p => {
        return p.entity && p.entity.position.distanceTo(bot.entity.position) < radius;
      }).map(p => p.username);
      return `Jugadores cerca: ${players.join(', ')}`;
    }
  }
};

export default primitiveActions;
