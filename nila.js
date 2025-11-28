import mineflayer from 'mineflayer';
import {pathfinder, Movements} from 'mineflayer-pathfinder';
import armorManager from 'mineflayer-armor-manager';
import { loader as autoEat } from 'mineflayer-auto-eat'
import config from './util/constants.js';
import {inject as injectObservations} from './src/mc/observation/inject.js';
import {inject as injectPatches} from './util/bot-patches.js';
import Inventory from './src/mc/observation/inventory.js';
import {Voxels, BlockRecords} from './src/mc/observation/voxels.js';
import Chests from './src/mc/observation/chests.js';
import onChat from './src/mc/observation/onChat.js';
import onError from './src/mc/observation/onError.js';
import onSave from './src/mc/observation/onSave.js';
import mcData from 'minecraft-data';
import {Vec3} from 'vec3';

class MinecraftBot {
  constructor() {
    this.bot = null;
    this.isReady = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(
          ` Conectando al servidor ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}...`);

      this.bot = mineflayer.createBot({
        host: config.MINECRAFT_HOST,
        port: config.MINECRAFT_PORT,
        username: config.BOT_USERNAME,
        auth: 'offline',
        version: false, // Auto-detect
      });

      // Cargar plugins
      this.bot.loadPlugin(pathfinder);
      this.bot.loadPlugin(armorManager);
      this.bot.loadPlugin(autoEat)

      // Configurar pathfinder cuando el bot se conecte
      this.bot.once('spawn', () => {
        // console.log(' Bot spawneado en el mundo');
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
        // const mcData = minecraftData(this.bot.version);

        const movements = new Movements(this.bot);
        this.bot.pathfinder.setMovements(movements);

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
      });

      this.bot.on('error', (err) => {
        console.error(' Error del bot:', err);
        if (!this.isReady) {
          reject(err);
        }
      });

      this.bot.on('kicked', (reason) => {
        console.log(' Bot expulsado:', reason);
      });

      this.bot.on('end', () => {
        console.log(' Conexión terminada');
        this.isReady = false;
      });

      this.bot.on('death', () => {
        console.log(' Bot murió');
        this.bot.chat('¡Auch! Morí :(');
      });

      this.bot.on('health', () => {
        if (this.bot.health <= 5) {
          console.log(`  Vida crítica: ${this.bot.health}/20`);
        }
      });

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
