/**
 * Simulation State Management
 */

import { EventEmitter } from './events.js';

export class SimulationState extends EventEmitter {
    constructor() {
        super();
        this.parameters = {
            diameter: 100,
            velocity: 20,
            angle: 45,
            composition: 'rock',
            density: 2700,
            latitude: 40.7128,
            longitude: -74.0060
        };
        
        this.results = null;
        this.isSimulating = false;
        this.currentPhase = 1;
    }

    updateParameters(newParameters) {
        this.parameters = { ...this.parameters, ...newParameters };
        this.emit('parametersChanged', this.parameters);
    }

    setResults(results) {
        this.results = results;
        this.emit('resultsUpdated', results);
    }

    getParameters() {
        return { ...this.parameters };
    }

    getResults() {
        return this.results ? { ...this.results } : null;
    }

    setSimulating(isSimulating) {
        this.isSimulating = isSimulating;
        this.emit('simulationStateChanged', isSimulating);
    }

    isCurrentlySimulating() {
        return this.isSimulating;
    }

    getCurrentPhase() {
        return this.currentPhase;
    }

    setPhase(phase) {
        if (phase >= 1 && phase <= 3) {
            this.currentPhase = phase;
            this.emit('phaseChanged', phase);
        }
    }

    reset() {
        this.results = null;
        this.isSimulating = false;
        this.emit('stateReset');
    }
}