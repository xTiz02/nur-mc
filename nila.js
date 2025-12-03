import {Movements} from 'mineflayer-pathfinder';
import config from './util/constants.js';
import {inject as injectObservations} from './src/mc/observation/inject.js';
import {inject as injectPatches} from './util/bot-patches.js';
import Inventory from './src/mc/observation/inventory.js';
import {BlockRecords, Voxels} from './src/mc/observation/voxels.js';
import Chests from './src/mc/observation/chests.js';
import onChat from './src/mc/observation/onChat.js';
import onError from './src/mc/observation/onError.js';
import onSave from './src/mc/observation/onSave.js';
import {Vec3} from 'vec3';
//TEST
import primitiveActions from "./src/action/primitives.js";
import {initBot} from "./util/mcData.js";
import bloodhound from "./src/mc/plugin/bloodhound.js"

class MinecraftBot {
  constructor() {
    this.bot = null;
    this.isReady = false;
    this.agent = null;
  }

  setAgent(agent) {
    this.agent = agent;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(
        ` Conectando al servidor ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}...`);

      this.bot = initBot();
      // Configurar pathfinder cuando el bot se conecte

      this.bot.once('spawn', () => {
        console.log(' Bot spawneado en el mundo');
        if (!this.bot.bloodhound) this.bot.bloodhound = {}
        this.bot.bloodhound.yaw_correlation_enabled = true
        // mineflayerViewer(this.bot, { firstPerson: true,port: 3000 }) // Start the viewing server on port 3000
        // const path = [this.bot.entity.position.clone()]
        //   this.bot.on('move', () => {
        //     if (path[path.length - 1].distanceTo(this.bot.entity.position) > 1) {
        //       path.push(this.bot.entity.position.clone())
        //       this.bot.viewer.drawLine('path', path)
        //     }
        //   })
        this.bot.armorManager.equipAll()
        this.bot.autoEat.enableAuto()


        // const movements = new Movements(this.bot);
        // this.bot.pathfinder.setMovements(movements);
        // this.bot.collectBlock.findFromVein();
        // Inyectar sistema de observaciones
        const observationsList = [
          Inventory,
          Voxels,
          BlockRecords,
          Chests,
          onChat,
          onError,
          onSave
        ];

        injectObservations(this.bot, observationsList);

        // Inyectar parches
        injectPatches(this.bot);

        // Añadir Vec3 al bot para facilitar acceso
        this.bot.Vec3 = Vec3;

        this.isReady = true;
        console.log(` Bot "${this.bot.username}" listo para recibir comandos`);
        console.log(` Posición: ${this.bot.entity.position}`);
        console.log(` Vida: ${this.bot.health}/20`);

        resolve(this.bot);

        const movements = new Movements(this.bot);
        this.bot.pathfinder.setMovements(movements);
        //TEST ACTIONS
        setTimeout(async () => {
          // const randomActiond = primitiveActions.hitPlayerWhitBowForLoop;
          // try {
          //   console.log('Iniciando randomAction de atacar jugador con arco en bucle...');
          //   const result = await randomActiond.execute(  this.bot,{
          //       playerName: 'Piero',
          //       secondsTime: 10,
          //     });
          //   console.log('Resultado de randomAction:', result);
          // } catch (error) {
          //   console.error('Error en randomAction:', error);
          // }
          // const randomAction = randomActions.exploreUntil;
          // try {
          //   const result = await randomAction.execute(  this.bot,{
          //       direction: new Vec3(1,0,1),
          //       maxTime: 60,
          //     });
          //   console.log('Resultado de randomAction:', result);
          // } catch (error) {
          //   console.error('Error en randomAction:', error);
          // }
          //
          //
          const randomAction0 = primitiveActions.hitOnceWithBow
          try {
            console.log('Iniciando randomAction de atacar con arco...');
            const result = await randomAction0.execute(this.bot, {
              mobNameOrPlayerName: 'Piero',
            });
            console.log('Resultado de randomAction:', result);
          } catch (error) {
            console.error('Error en randomAction:', error);
          }

          const randomAction8 = primitiveActions.throwSnowballs
          try {
            console.log('Iniciando randomAction de lanzar bolas de nieve...');
            const result = await randomAction8.execute(this.bot, {
              mobNameOrPlayerName: 'Piero',
              count: 5,
            });
            console.log('Resultado de randomAction:', result);
          } catch (error) {
            console.error('Error en randomAction:', error);
          }
          //
          //
          // const randomAction = primitiveActions.mineBlock
          // try {
          //   console.log('Iniciando randomAction de minar bloques...');
          //   const result = await randomAction.execute(this.bot, {
          //     blockType: 'dirt',
          //     count: 1,
          //   });
          //   console.log('Resultado de randomAction:', result);
          // } catch (error) {
          //   console.error('Error en randomAction:', error);
          // }
          //
          const randomAction = primitiveActions.mineBlock;
          try {
            console.log('Iniciando randomAction de minar bloques...');
            const result = await randomAction.execute(this.bot, {
              blockType: 'cobblestone',
              count: 2,
            });
            console.log('Resultado de randomAction:', result);
          } catch (error) {
            console.error('Error en randomAction:', error);
          }

          // const attack = primitiveActions.killMob;
          // try {
          //   console.log('Iniciando randomAction de atacar mob...');
          //   const result = await attack.execute(this.bot, {
          //     mobName: 'zombie',
          //   });
          //   console.log('Resultado de randomAction:', result);
          //
          // } catch (error) {
          //   console.error('Error en randomAction:', error);
          // }
          //
          // const follow = primitiveActions.followPlayer;
          //
          // try {
          //   console.log('Iniciando randomAction de seguir jugador...');
          //   const result = await follow.execute(this.bot, {
          //     playerName: 'Piero',
          //   });
          //   console.log('Resultado de randomAction:', result);
          // } catch (error) {
          //   console.error('Error en randomAction:', error);
          // }
          // while (true) {
          //   if (!this.bot.pvp.target) {
          //     const follow = primitiveActions.followPlayer;
          //
          //     try {
          //       console.log('Iniciando randomAction de seguir jugador...');
          //       const result = await follow.execute(this.bot, {
          //         playerName: 'Piero',
          //       });
          //       console.log('Resultado de randomAction:', result);
          //     } catch (error) {
          //       console.error('Error en randomAction:', error);
          //     }
          //     break;
          //   }
          // }


        }, 3000);

      });
      this.bot.on('onCorrelateAttack', function (attacker, victim, weapon) {
        if (weapon) {
          console.log("Entity: " + (victim.displayName || victim.username) + " attacked by: " + (attacker.displayName || attacker.username) + " with: " + weapon.displayName);
        } else {
          console.log("Entity: " + (victim.displayName || victim.username) + " attacked by: " + (attacker.displayName || attacker.username));
        }

        // Solo Registrar ataque hacia el bot
        if(victim.displayName === config.BOT_USERNAME) {
          this.agent.executeRegisteredAttack(attacker.username, victim.username, weapon.displayName);
        }

      });

      this.bot.on('stoppedAttacking', () => {
        console.log(' El bot ha dejado de atacar');
      })

      this.bot.on('error', (err) => {
        console.error(' Error del bot:', err);
        if (!this.isReady) {
          reject(err);
        }
      });

      this.bot.on('kicked', (reason) => {
        console.log(' Bot expulsado:', reason);
      });

      // this.bot.on('end', () => {
      //   console.log(' Conexión terminada');
      //   this.isReady = false;
      // });

      this.bot.on('death', () => {
        console.log(' Bot murió');
        this.bot.chat('Me morí ...');
      });

      // this.bot.on('health', () => {
      //   console.log(`  Vida crítica: ${this.bot.health}`);
      //
      // });

      // Timeout de conexión
      setTimeout(() => {
        if (!this.isReady) {
          reject(new Error('Timeout al conectar con el servidor'));
        }
      }, 30000);
    });
  }

  getBot() {
    return this.bot;
  }

  isConnected() {
    return this.isReady && this.bot !== null;
  }

  disconnect() {
    if (this.bot) {
      this.bot.quit();
    }
  }
}

export default MinecraftBot;
