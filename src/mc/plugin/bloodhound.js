import vec3 from 'vec3';
import { EventEmitter } from 'events';

const max_melee_dist = 6;
const max_delta_time = 10;
const max_delta_yaw_per = 10;
const max_age_cleanup = 20;
const max_events_size_cleanup = 10;

export default function init(mineflayer) {
  function inject(bot) {

    // 🔥 Asegurar que bot.bloodhound siempre exista
    if (!bot.bloodhound) bot.bloodhound = {};

    // 🔥 Evitar undefined en configuraciones
    if (bot.bloodhound.yaw_correlation_enabled === undefined)
      bot.bloodhound.yaw_correlation_enabled = false;

    let last_hurts = [];
    let last_attacks = [];

    function CalculateAttackYaw(attacker, victim) {
      let yaw = Math.atan2(
        victim.position.z - attacker.position.z,
        -(victim.position.x - attacker.position.x)
      );
      yaw += Math.PI / 2;
      if (yaw < 0) yaw += 2 * Math.PI;
      return yaw;
    }

    function TestAttackYaw(attacker, victim) {
      let delta_attack_yaw_per =
        Math.abs(CalculateAttackYaw(attacker, victim) - attacker.headYaw) /
        (2 * Math.PI) *
        100;
      return delta_attack_yaw_per < max_delta_yaw_per;
    }

    function CleanUpHurts() {
      const min_time = new Date() - max_age_cleanup;
      for (let i = last_hurts.length - 1; i >= 0; i--) {
        if (last_hurts[i].time < min_time) last_hurts.splice(i, 1);
      }
    }

    function CleanUpAttacks() {
      const min_time = new Date() - max_age_cleanup;
      for (let i = last_attacks.length - 1; i >= 0; i--) {
        if (last_attacks[i].time < min_time) last_attacks.splice(i, 1);
      }
    }

    function CleanUsedEvents() {
      for (let i = last_hurts.length - 1; i >= 0; i--) {
        if (last_hurts[i].used) last_hurts.splice(i, 1);
      }
      for (let i = last_attacks.length - 1; i >= 0; i--) {
        if (last_attacks[i].used) last_attacks.splice(i, 1);
      }
    }

    function CorrelateAttack(hurtIndex, attackIndex) {
      const hurt = last_hurts[hurtIndex];
      const attack = last_attacks[attackIndex];

      const delta_time = Math.abs(hurt.time - attack.time);
      if (delta_time > max_delta_time) return;

      const melee_dist = hurt.entity.position.distanceTo(attack.entity.position);
      if (melee_dist > max_melee_dist) return;

      const weapon = attack.entity.heldItem;

      if (bot.bloodhound.yaw_correlation_enabled) {
        if (!TestAttackYaw(attack.entity, hurt.entity)) return;
      }

      bot.emit("onCorrelateAttack", attack.entity, hurt.entity, weapon);

      last_hurts[hurtIndex].used = true;
      last_attacks[attackIndex].used = true;
    }

    function CorrelateAttacks() {
      if (last_hurts.length > max_events_size_cleanup) CleanUpHurts();
      if (last_attacks.length > max_events_size_cleanup) CleanUpAttacks();

      if (last_hurts.length === 0 || last_attacks.length === 0) return;

      for (let h = 0; h < last_hurts.length; h++) {
        if (last_hurts[h].used) continue;

        for (let a = 0; a < last_attacks.length; a++) {
          if (last_attacks[a].used) continue;
          CorrelateAttack(h, a);
        }
      }
      CleanUsedEvents();
    }

    function MakeEvent(entity, time) {
      return { entity, time, used: false };
    }

    bot.on("entityHurt", (entity) => {
      last_hurts.push(MakeEvent(entity, new Date()));
      CorrelateAttacks();
    });

    bot.on("entitySwingArm", (entity) => {
      last_attacks.push(MakeEvent(entity, new Date()));
      CorrelateAttacks();
    });
  }

  return inject;
}
