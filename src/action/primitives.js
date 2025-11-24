import pathfinder  from 'mineflayer-pathfinder';
const { goals, Movements } = pathfinder;
const primitiveActions = {
    // ==================== MOVIMIENTO ====================
    walkTo: {
        description: "Camina hacia una posición específica o hacia un tipo de bloque",
        params: ["target (puede ser {x, y, z} o nombre de bloque como 'oak_log')"],
        execute: async (bot, params) => {
            const { target } = params;

            if (typeof target === 'object' && target.x !== undefined) {
                // Es una posición específica
                const goal = new goals.GoalNear(target.x, target.y, target.z, 1);
                await bot.pathfinder.goto(goal);
                return `Llegué a la posición ${target.x}, ${target.y}, ${target.z}`;
            } else if (typeof target === 'string') {
                // Es un tipo de bloque
                const block = bot.findBlock({
                    matching: (b) => b.name === target,
                    maxDistance: 64
                });

                if (!block) {
                    throw new Error(`No encontré ningún bloque de tipo ${target} cercano`);
                }

                const goal = new goals.GoalNear(block.position.x, block.position.y, block.position.z, 2);
                await bot.pathfinder.goto(goal);
                return `Llegué al bloque ${target} en ${block.position}`;
            }

            throw new Error("Parámetro target inválido");
        }
    },

    followPlayer: {
        description: "Sigue a un jugador específico",
        params: ["playerName"],
        execute: async (bot, params) => {
            const { playerName } = params;
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
        description: "Detiene cualquier movimiento actual",
        params: [],
        execute: async (bot, params) => {
            bot.pathfinder.setGoal(null);
            return "Movimiento detenido";
        }
    },

    // ==================== INTERACCIÓN CON BLOQUES ====================
    breakBlock: {
        description: "Rompe un bloque del tipo especificado que esté cerca",
        params: ["blockType"],
        execute: async (bot, params) => {
            const { blockType } = params;
            const block = bot.findBlock({
                matching: (b) => b.name === blockType,
                maxDistance: 6
            });

            if (!block) {
                throw new Error(`No encontré ningún bloque de tipo ${blockType} cerca`);
            }

            await bot.dig(block);
            return `Rompí el bloque ${blockType}`;
        }
    },

    placeBlock: {
        description: "Coloca un bloque del inventario en una posición relativa",
        params: ["blockType", "position (opcional, default: frente al bot)"],
        execute: async (bot, params) => {
            const { blockType, position } = params;
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
    },
    lookAt: {
        description: "Mira hacia un bloque específico o posición",
        params: ["target (nombre de bloque o {x, y, z})"],
        execute: async (bot, params) => {
            const { target } = params;

            if (typeof target === 'object' && target.x !== undefined) {
                await bot.lookAt(new bot.Vec3(target.x, target.y, target.z));
                return `Mirando hacia ${target.x}, ${target.y}, ${target.z}`;
            } else if (typeof target === 'string') {
                const block = bot.findBlock({
                    matching: (b) => b.name === target,
                    maxDistance: 32
                });

                if (!block) {
                    throw new Error(`No encontré ningún bloque de tipo ${target}`);
                }

                await bot.lookAt(block.position);
                return `Mirando hacia ${target}`;
            }

            throw new Error("Parámetro target inválido");
        }
    },

    // ==================== ITEMS ====================
    equipItem: {
        description: "Equipa un item del inventario",
        params: ["itemName", "destination ('hand', 'head', 'torso', 'legs', 'feet')"],
        execute: async (bot, params) => {
            const { itemName, destination = 'hand' } = params;
            const item = bot.inventory.items().find(i => i.name === itemName);

            if (!item) {
                throw new Error(`No tengo ${itemName} en mi inventario`);
            }

            await bot.equip(item, destination);
            return `Equipé ${itemName} en ${destination}`;
        }
    },

    dropItem: {
        description: "Suelta items del inventario",
        params: ["itemName", "quantity (opcional, default: todo)"],
        execute: async (bot, params) => {
            const { itemName, quantity } = params;
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
        description: "Recoge items del suelo cercanos",
        params: ["itemType (opcional)"],
        execute: async (bot, params) => {
            const { itemType } = params;
            const items = Object.values(bot.entities).filter(e => {
                return e.objectType === 'Item' &&
                       e.position.distanceTo(bot.entity.position) < 16 &&
                       (!itemType || e.name === itemType);
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
        description: "Envía un mensaje al chat",
        params: ["message"],
        execute: async (bot, params) => {
            const { message } = params;
            bot.chat(message);
            return `Mensaje enviado: ${message}`;
        }
    },

    whisper: {
        description: "Envía un mensaje privado a un jugador",
        params: ["playerName", "message"],
        execute: async (bot, params) => {
            const { playerName, message } = params;
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
            const { blockType, radius = 16 } = params;
            const blocks = bot.findBlocks({
                matching: (b) => b.name === blockType,
                maxDistance: radius,
                count: 100
            });
            return `Encontré ${blocks.length} bloques de ${blockType} cerca`;
        }
    },

    getNearbyPlayers: {
        description: "Obtiene jugadores cercanos",
        params: ["radius (opcional, default: 32)"],
        execute: async (bot, params) => {
            const { radius = 32 } = params;
            const players = Object.values(bot.players).filter(p => {
                return p.entity &&
                       p.entity.position.distanceTo(bot.entity.position) < radius;
            }).map(p => p.username);
            return `Jugadores cerca: ${players.join(', ')}`;
        }
    }
};

export default primitiveActions;
