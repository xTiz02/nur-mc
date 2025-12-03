import config from '../../util/constants.js';

class AttackManager {
  constructor(socket) {
    this.socket = socket;

    this.eventFirstHit = "bot_attacked"; //primer golpe
    this.eventSummary = "bot_attack_summary"; // muchos golpes consecutivos

    this.attackTrack = {};

    this.windowMs = config.ATTACKED_INTERVAL;
  }

  registerAttack(attackerName, victimName, weaponName = null) {
    if (!attackerName) {
      return;
    }

    // Si NO existe un ciclo activo → iniciamos uno nuevo
    if (!this.attackTrack[attackerName]) {
      this.attackTrack[attackerName] = {
        count: 1,
        timeout: null
      };

      // Evento inmediato del primer golpe
      // this.socket.emit(this.eventFirstHit, {
      //     attacker: attackerName,
      //     victim: victimName,
      //     weapon: weaponName,
      //     hits: 1,
      //     firstHit: true
      // });

      // Iniciar ciclo de 3 segundos
      this.startCycle(attackerName);
    } else {
      // Ya hay un ciclo activo → acumular golpe
      this.attackTrack[attackerName].count++;
    }
  }

  startCycle(attackerName) {
    this.attackTrack[attackerName].timeout = setTimeout(() => {
      const {count} = this.attackTrack[attackerName];

      // Si golpeó más de 1 vez → enviar resumen
      if (count > 1) {
        // this.socket.emit(this.eventSummary, {
        //     attacker: attackerName,
        //     hits: count,
        //     firstHit: false
        // });

        // Reiniciar ciclo para seguir esperando golpes
        this.attackTrack[attackerName].count = 0;
        this.waitForNextAttack(attackerName);
      } else {
        // NO hubo mas golpes → fin total
        delete this.attackTrack[attackerName];
      }
    }, this.windowMs);
  }

  // Espera al siguiente golpe para iniciar otro ciclo
  waitForNextAttack(attackerName) {
    // Se da un tiempo para que llegue otro golpe
    // Si llega → count aumentará y el ciclo se reiniciará en registerAttack()
    this.attackTrack[attackerName].timeout = setTimeout(() => {
      // Si count sigue en 0 → no hubo golpes → fin total
      if (this.attackTrack[attackerName].count === 0) {
        delete this.attackTrack[attackerName];
      }
    }, this.windowMs);
  }
}

export default AttackManager;