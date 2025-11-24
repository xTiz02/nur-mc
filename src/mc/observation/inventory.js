import { Observation } from './base.js';

class Inventory extends Observation {
    constructor(bot) {
        super(bot);
        this.name = "inventory";
    }

    observe() {
        return listItems(this.bot);
    }
}

function listItems(bot) {
    const items = getInventoryItems(bot);
    return items.reduce(itemToDict, {});
}

function getInventoryItems(bot) {
    const inventory = bot.currentWindow || bot.inventory;
    return inventory.items();
}

function itemToDict(acc, cur) {
    if (cur.name && cur.count) {
        if (acc[cur.name]) {
            acc[cur.name] += cur.count;
        } else {
            acc[cur.name] = cur.count;
        }
    }
    return acc;
}

export default Inventory;
