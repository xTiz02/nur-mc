import { Observation } from './base.js';

class onError extends Observation {
    constructor(bot) {
        super(bot);
        this.name = "onError";
        this.obs = null;
        bot.on("error", (err) => {
            this.obs = err;
            this.bot.event(this.name);
        });
    }

    observe() {
        const result = this.obs;
        this.obs = null;
        return result;
    }
}

export default onError;
