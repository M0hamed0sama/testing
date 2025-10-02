/**
 * Blast Wave Calculator - Calculates blast wave propagation and overpressure
 */

import { PHYSICS_CONSTANTS, DAMAGE_THRESHOLDS } from '../utils/constants.js';

export class BlastWaveCalculator {
    constructor() {
        this.airDensity = PHYSICS_CONSTANTS.AIR_DENSITY_SEA_LEVEL;
        this.soundSpeed = PHYSICS_CONSTANTS.SOUND_SPEED;
    }

    calculateBlastWave(parameters) {
        const { energy, angle } = parameters;
        
        // Sedov-Taylor blast wave solution
        const effectiveEnergy = this.calculateEffectiveEnergy(energy, angle);
        
        return {
            radius1psi: this.calculateOverpressureRadius(effectiveEnergy, DAMAGE_THRESHOLDS.OVERPRESSURE.LIGHT_DAMAGE),
            radius5psi: this.calculateOverpressureRadius(effectiveEnergy, DAMAGE_THRESHOLDS.OVERPRESSURE.MODERATE_DAMAGE),
            radius10psi: this.calculateOverpressureRadius(effectiveEnergy, DAMAGE_THRESHOLDS.OVERPRESSURE.HEAVY_DAMAGE),
            overpressureRadii: this.calculateMultipleRadii(effectiveEnergy)
        };
    }

    calculateEffectiveEnergy(energy, angle) {
        // Account for impact angle - oblique impacts are less efficient
        const angleRad = (angle * Math.PI) / 180;
        const efficiency = Math.sin(angleRad);
        return energy * efficiency;
    }

    calculateOverpressureRadius(energy, targetPressure) {
        // Sedov-Taylor blast wave: R = K * (E*t^2 / ρ)^(1/5)
        // For peak overpressure: ΔP = K2 * ρ * v^2
        // Simplified scaling law for peak overpressure
        
        const K = 1.033; // Dimensionless constant
        const gamma = 1.4; // Heat capacity ratio for air
        
        // Approximate radius for given overpressure
        const radius = Math.pow(energy / (4 * Math.PI * targetPressure), 1/3);
        
        return Math.max(radius, 0);
    }

    calculateMultipleRadii(energy) {
        const pressures = [1000, 5000, 10000, 20000, 50000]; // Pa
        return pressures.map(pressure => ({
            pressure,
            radius: this.calculateOverpressureRadius(energy, pressure)
        }));
    }
}