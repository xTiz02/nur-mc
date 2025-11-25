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
   }
}