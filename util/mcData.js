import minecraftData from 'minecraft-data';
import mineflayer from "mineflayer";
import minecraftHawkEye from "minecrafthawkeye";
import config from "./constants.js";
import {pathfinder} from "mineflayer-pathfinder";
import armorManager from "mineflayer-armor-manager";
import {loader as autoEat} from "mineflayer-auto-eat";
import {plugin as collectBlock} from "mineflayer-collectblock";
import {plugin as pvp} from 'mineflayer-pvp';
import bloodhound from "../src/mc/plugin/bloodhound.js";

export const WOOD_TYPES = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry'];
export const MATCHING_WOOD_BLOCKS = [
  'log',
  'planks',
  'sign',
  'boat',
  'fence_gate',
  'door',
  'fence',
  'slab',
  'stairs',
  'button',
  'pressure_plate',
  'trapdoor'
]
export const WOOL_COLORS = [
  'white',
  'orange',
  'magenta',
  'light_blue',
  'yellow',
  'lime',
  'pink',
  'gray',
  'light_gray',
  'cyan',
  'purple',
  'blue',
  'brown',
  'green',
  'red',
  'black'
]
let mc_version = '1.20';
let mcdata = null;

export function initBot() {

  const bot = mineflayer.createBot({
    host: config.MINECRAFT_HOST,
    port: config.MINECRAFT_PORT,
    username: config.BOT_USERNAME,
    auth: 'offline',
    // version: false, // Auto-detect
  });

  bot.loadPlugin(pvp);
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(autoEat)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(minecraftHawkEye.default)
  // bot.loadPlugin(bloodhound)
  bloodhound(mineflayer)(bot)
  // bot.once('resourcePack', () => {
  //   bot.acceptResourcePack();
  // });


  bot.once('login', () => {
    mc_version = bot.version;
    mcdata = minecraftData(mc_version);

  });

  return bot;
}

// Función para verificar si un mob es cazable
export function isHuntable(mob) {
  if (!mob || !mob.name) return false;
  const animals = ['chicken', 'cow', 'llama', 'mooshroom', 'pig', 'rabbit', 'sheep'];
  return animals.includes(mob.name.toLowerCase()) && !mob.metadata[16]; // metadata 16 is not baby
}

// Función para verificar si un mob es hostil
export function isHostile(mob) {
  if (!mob || !mob.name) return false;
  return (mob.type === 'mob' || mob.type === 'hostile') && mob.name !== 'iron_golem' && mob.name !== 'snow_golem';
}

// Bloques que no funcionan con collectBlock, necesitan ser recolectados manualmente
export function mustCollectManually(blockName) {
  // Todo los cultivos (que no son bloques normales), antorchas, botones, palancas, redstone,
  const full_names = ['wheat', 'carrots', 'potatoes', 'beetroots', 'nether_wart', 'cocoa', 'sugar_cane', 'kelp', 'short_grass', 'fern', 'tall_grass', 'bamboo',
    'poppy', 'dandelion', 'blue_orchid', 'allium', 'azure_bluet', 'oxeye_daisy', 'cornflower', 'lilac', 'wither_rose', 'lily_of_the_valley', 'wither_rose',
    'lever', 'redstone_wire', 'lantern']
  const partial_names = ['sapling', 'torch', 'button', 'carpet', 'pressure_plate', 'mushroom', 'tulip', 'bush', 'vines', 'fern']
  return full_names.includes(blockName.toLowerCase()) || partial_names.some(partial => blockName.toLowerCase().includes(partial));
}


//Esta función busca todas las recetas de crafteo de un ítem específico usando
// los datos de mcdata (los datos oficiales de Minecraft que usa Mineflayer).
// Luego procesa las recetas, cuenta los ingredientes, y ordena las recetas
// para que primero aparezcan las que usan ingredientes más “comunes”.
export function getItemCraftingRecipes(itemName) {
  let itemId = getItemId(itemName);
  if (!mcdata.recipes[itemId]) {
    return null;
  }

  let recipes = [];
  for (let r of mcdata.recipes[itemId]) {
    let recipe = {};
    let ingredients = [];
    if (r.ingredients) {
      ingredients = r.ingredients;
    } else if (r.inShape) {
      ingredients = r.inShape.flat();
    }
    for (let ingredient of ingredients) {
      let ingredientName = getItemName(ingredient);
      if (ingredientName === null) continue;
      if (!recipe[ingredientName])
        recipe[ingredientName] = 0;
      recipe[ingredientName]++;
    }
    recipes.push([
      recipe,
      {craftedCount: r.result.count}
    ]);
  }
  // sort recipes by if their ingredients include common items
  const commonItems = ['oak_planks', 'oak_log', 'coal', 'cobblestone'];
  recipes.sort((a, b) => {
    let commonCountA = Object.keys(a[0]).filter(key => commonItems.includes(key)).reduce((acc, key) => acc + a[0][key], 0);
    let commonCountB = Object.keys(b[0]).filter(key => commonItems.includes(key)).reduce((acc, key) => acc + b[0][key], 0);
    return commonCountB - commonCountA;
  });

  return recipes;
}

// Si llamas:
// getItemCraftingRecipes("stick");
// Podrías obtener:
//
// [
//   [
//     { oak_planks: 2 },
//     { craftedCount: 4 }
//   ]
// ]


export function getItemId(itemName) {
  let item = mcdata.itemsByName[itemName];
  if (item) {
    return item.id;
  }
  return null;
}

export function getItemName(itemId) {
  let item = mcdata.items[itemId]
  if (item) {
    return item.name;
  }
  return null;
}

export function getBlockId(blockName) {
  let block = mcdata.blocksByName[blockName];
  if (block) {
    return block.id;
  }
  return null;
}

export function getBlockName(blockId) {
  let block = mcdata.blocks[blockId]
  if (block) {
    return block.name;
  }
  return null;
}

export function getEntityId(entityName) {
  let entity = mcdata.entitiesByName[entityName];
  if (entity) {
    return entity.id;
  }
  return null;
}

export function getAllItems(ignore) {
  if (!ignore) {
    ignore = [];
  }
  let items = []
  for (const itemId in mcdata.items) {
    const item = mcdata.items[itemId];
    if (!ignore.includes(item.name)) {
      items.push(item);
    }
  }
  return items;
}
