import {InspectorProxy} from "mineflayer-proxy-inspector";
import {Movements, pathfinder} from "mineflayer-pathfinder";
import config from "./util/constants.js";
import {inject as injectObservations} from "./src/mc/observation/inject.js";
import {inject as injectPatches} from "./util/bot-patches.js";
import Inventory from "./src/mc/observation/inventory.js";
import {BlockRecords, Voxels} from "./src/mc/observation/voxels.js";
import Chests from "./src/mc/observation/chests.js";
import onChat from "./src/mc/observation/onChat.js";
import onError from "./src/mc/observation/onError.js";
import onSave from "./src/mc/observation/onSave.js";
import {Vec3} from "vec3";
import {initBot} from "./util/mcData.js";
import minecraftHawkEye from "minecrafthawkeye";
import armorManager from "mineflayer-armor-manager";
import {loader as autoEat} from "mineflayer-auto-eat";
import {plugin as collectBlock} from "mineflayer-collectblock";
import {plugin as pvp} from "mineflayer-pvp";
import bloodhound from "./src/mc/plugin/bloodhound.js";
import mineflayer from "mineflayer";

class MinecraftBot {
  constructor() {
    this.bot = null;
    this.proxy = null;
    this.isReady = false;
  }

  async connect() {
    console.log(
      ` Conectando al servidor ${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}...`
    );

    return new Promise((resolve, reject) => {
      // Crear el proxy
      this.proxy = new InspectorProxy(
        {
          host: config.MINECRAFT_HOST,
          port: config.MINECRAFT_PORT,
          username: config.BOT_USERNAME,
          auth: "offline",
          version: "1.20.1"
        },
        {
          port: 25566,
          botAutoStart: true,
          serverAutoStart: true,
          botStopOnLogoff: true,
          serverStopOnBotStop: false,
          logPlayerJoinLeave: true,
          security: {
            onlineMode: false,   // ESTA ES LA CLAVE
            allowList: null
          }
        }
      );

      // Iniciar bot via proxy
      this.proxy.on("botStart", (conn) => {
        console.log("🤖 Bot iniciado mediante proxy");
        this.bot = initBot(conn.bot)

        // PLUGINS NECESARIOS
        this.bot.loadPlugin(pvp);
        this.bot.loadPlugin(pathfinder);
        this.bot.loadPlugin(armorManager);
        this.bot.loadPlugin(autoEat);
        this.bot.loadPlugin(collectBlock);
        this.bot.loadPlugin(minecraftHawkEye.default);
        bloodhound(mineflayer)(this.bot);

        this.bot.once("spawn", () => {
          console.log(" Bot spawneado en el mundo");

          if (!this.bot.bloodhound) this.bot.bloodhound = {};
          this.bot.bloodhound.yaw_correlation_enabled = true;

          this.bot.armorManager.equipAll();
          this.bot.autoEat.enableAuto();

          // Inyectar observadores
          const observationsList = [
            Inventory,
            Voxels,
            BlockRecords,
            Chests,
            onChat,
            onError,
            onSave,
          ];

          injectObservations(this.bot, observationsList);
          injectPatches(this.bot);

          this.bot.Vec3 = Vec3;

          // Pathfinder
          const movements = new Movements(this.bot);
          this.bot.pathfinder.setMovements(movements);

          this.isReady = true;
          console.log(` Bot "${this.bot.username}" listo para recibir comandos`);
          console.log(` Posición: ${this.bot.entity.position}`);
          console.log(` Vida: ${this.bot.health}/20`);

          resolve(this.bot);
        });

        // EVENTOS COMPLETOS
        this.bot.on("onCorrelateAttack", function (attacker, victim, weapon) {
          if (weapon) {
            console.log(
              "Entity: " +
              (victim.displayName || victim.username) +
              " attacked by: " +
              (attacker.displayName || attacker.username) +
              " with: " +
              weapon.displayName
            );
          } else {
            console.log(
              "Entity: " +
              (victim.displayName || victim.username) +
              " attacked by: " +
              (attacker.displayName || attacker.username)
            );
          }
        });

        this.bot.on("stoppedAttacking", () => {
          console.log(" El bot ha dejado de atacar");
        });

        this.bot.on("error", (err) => {
          console.error(" Error del bot:", err);
          if (!this.isReady) reject(err);
        });

        this.bot.on("kicked", (reason) => {
          console.log(" Bot expulsado:", reason);
        });

        this.bot.on("death", () => {
          console.log(" Bot murió");
          this.bot.chat("¡Auch! Morí :(");
        });

        this.bot.on("health", () => {
          console.log(`  Vida crítica: ${this.bot.health}`);
        });
      });

      // Si tarda demasiado en iniciar
      setTimeout(() => {
        if (!this.isReady) reject(new Error("Timeout al conectar con el servidor"));
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
    if (this.proxy) {
      console.log("Apagando proxy y bot…");
      this.proxy.stopBot();
      this.proxy.stopServer();
    }
  }
}

export default MinecraftBot;
