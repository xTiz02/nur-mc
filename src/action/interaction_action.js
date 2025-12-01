//Acciones para mejorar la interaccion del bot con los jugadores
import {utilActions as uc} from "./util_action.js";
const interactiveActions = {
   lookAtNearbyPlayer: {
    execute: async (bot, playerName) => {
      const player = bot.players[playerName];
      if (!player || !player.entity) {
        throw new Error(`Jugador ${playerName} no encontrado`);
      }
      const nearbyPlayers = uc.getNearbyPlayers.execute(bot);

      if (!nearbyPlayers.includes(playerName)) {
        throw new Error(`El jugador ${playerName} no está cerca`);
      }

      const position = player.entity.position;
      await bot.lookAt(new bot.Vec3(position.x, position.y + 1.6, position.z));
      return `Mirando hacia el jugador ${playerName}`;
    }
  }
}

export {interactiveActions};