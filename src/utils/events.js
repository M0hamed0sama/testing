/**
 * Simple EventEmitter implementation for inter-module communication
 */

export class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
        return this;
    }

    off(eventName, callback) {
        if (!this.events.has(eventName)) return this;
        
        const callbacks = this.events.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
        return this;
    }

    emit(eventName, ...args) {
        if (!this.events.has(eventName)) return this;
        
        const callbacks = this.events.get(eventName);
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for ${eventName}:`, error);
            }
        });
        return this;
    }

    once(eventName, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
        return this;
    }

    removeAllListeners(eventName) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
        return this;
    }
}