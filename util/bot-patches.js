/* Esta funcion inyecta parches personalizados en el bot de mineflayer para agregar funcionalidades adicionales.
 como emitir eventos de chat, contar items en el inventario y emitir eventos de guardado. */

function inject(bot) {
  bot._chat = bot.chat;
  bot.chat = (message) => {
    bot.emit("chatEvent", "bot", message);
    bot._chat(message);
  };

  bot.inventoryUsed = () => {
    return bot.inventory.slots.slice(9, 45).filter(
        (item) => item !== null).length;
  };

  bot.save = function (eventName) {
    bot.emit("save", eventName);
  };
}

export {inject};
