import primitiveActions from './primitives.js';

class ActionRegistry {
    constructor() {
        this.actions = primitiveActions;
    }

    getAction(name) {
        return this.actions[name];
    }

    getAllActions() {
        return this.actions;
    }

    getActionsList() {
        return Object.keys(this.actions).map(name => ({
            name,
            description: this.actions[name].description,
            params: this.actions[name].params
        }));
    }

    hasAction(name) {
        return this.actions.hasOwnProperty(name);
    }
}

export default new ActionRegistry();
