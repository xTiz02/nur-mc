class Observation {
    constructor(bot) {
        if (new.target === Observation) {
            throw new TypeError("Cannot instantiate abstract class Observation");
        }
        this.bot = bot;
        this.name = "Observation";
    }

    observe() {
        throw new TypeError("Method 'observe()' must be implemented.");
    }

    reset() {}
}

export { Observation };
