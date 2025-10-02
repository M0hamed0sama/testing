/**
 * Crater Calculator - Calculates crater formation based on Collins et al. (2005) scaling laws
 */

import { PHYSICS_CONSTANTS } from '../utils/constants.js';

class CraterCalculator {
    constructor() {
        this.targetDensity = PHYSICS_CONSTANTS.EARTH_CRUST_DENSITY; // kg/m³
        this.gravity = PHYSICS_CONSTANTS.EARTH_GRAVITY; // m/s²
    }

    /**
     * Calculate crater dimensions using scaling laws
     * Based on Collins et al. (2005) and Melosh (1989)
     */
    calculateCrater(parameters) {
        const { diameter, velocity, angle, density, energy } = parameters;

        // Impact efficiency based on angle
        const angleRad = (angle * Math.PI) / 180;
        const efficiency = Math.sin(angleRad);
        const effectiveEnergy = energy * efficiency;

        // Projectile parameters
        const projectileRadius = diameter / 2;
        const projectileMass = (4/3) * Math.PI * Math.pow(projectileRadius, 3) * density;

        // Calculate crater diameter using scaling laws
        const craterDiameter = this.calculateCraterDiameter(effectiveEnergy, velocity, projectileMass);
        
        // Calculate other crater dimensions
        const craterDepth = this.calculateCraterDepth(craterDiameter);
        const craterVolume = this.calculateCraterVolume(craterDiameter, craterDepth);
        const rimHeight = this.calculateRimHeight(craterDiameter);
        const ejectaRange = this.calculateEjectaRange(craterDiameter, velocity);

        return {
            diameter: craterDiameter,
            depth: craterDepth,
            volume: craterVolume,
            rimHeight: rimHeight,
            ejectaRange: ejectaRange,
            efficiency: efficiency,
            shape: this.determineCraterShape(angle)
        };
    }

    calculateCraterDiameter(energy, velocity, mass) {
        // Scaling law: D = K * (E/ρg)^(1/4) * L^(-1/4)
        // Where K is scaling constant, E is energy, ρ is target density, g is gravity, L is projectile size
        
        const K = 1.161; // Scaling constant for competent rock
        const L = Math.pow(mass / this.targetDensity, 1/3); // Characteristic projectile dimension
        
        const scalingFactor = Math.pow(energy / (this.targetDensity * this.gravity), 0.25);
        const sizeFactor = Math.pow(L, -0.25);
        
        return K * scalingFactor * sizeFactor;
    }

    calculateCraterDepth(diameter) {
        // Depth-to-diameter ratio varies with crater size
        // Simple craters: D/d ≈ 0.2
        // Complex craters: D/d ≈ 0.1
        
        const transitionDiameter = 2000; // meters, transition from simple to complex
        
        if (diameter < transitionDiameter) {
            // Simple crater
            return diameter * 0.2;
        } else {
            // Complex crater
            return diameter * 0.1;
        }
    }

    calculateCraterVolume(diameter, depth) {
        // Approximate crater as spherical cap
        const radius = diameter / 2;
        const height = depth;
        
        // Volume = (π * h²) * (3r - h) / 3
        return (Math.PI * Math.pow(height, 2) * (3 * radius - height)) / 3;
    }

    calculateRimHeight(diameter) {
        // Rim height is typically 5-10% of crater diameter for simple craters
        const heightRatio = diameter < 2000 ? 0.07 : 0.03; // Lower for complex craters
        return diameter * heightRatio;
    }

    calculateEjectaRange(diameter, velocity) {
        // Maximum ejecta range approximation
        // R_max ≈ 2.5 * D for competent rock
        const baseRange = 2.5 * diameter;
        
        // Velocity factor (higher velocity = further ejecta)
        const velocityFactor = Math.min(velocity / 20, 2); // Normalized to 20 km/s
        
        return baseRange * velocityFactor;
    }

    determineCraterShape(angle) {
        if (angle >= 60) {
            return 'circular';
        } else if (angle >= 30) {
            return 'elliptical';
        } else {
            return 'elongated';
        }
    }

    // Calculate ejecta distribution pattern
    calculateEjectaDistribution(craterDiameter, angle, velocity) {
        const ejectaZones = [];
        const maxRange = this.calculateEjectaRange(craterDiameter, velocity);
        
        // Create concentric zones with different ejecta thickness
        const zones = [
            { range: craterDiameter, thickness: 100, description: 'Continuous ejecta' },
            { range: craterDiameter * 2, thickness: 10, description: 'Discontinuous ejecta' },
            { range: maxRange, thickness: 1, description: 'Secondary cratering' }
        ];

        return zones.map(zone => ({
            ...zone,
            angle: angle < 45 ? 'asymmetric' : 'symmetric'
        }));
    }

    // Calculate impact melt volume
    calculateMeltVolume(energy) {
        // Rough approximation: 1% of crater volume becomes melt
        // More accurate calculation would need temperature modeling
        const meltFactor = 0.01;
        return energy * meltFactor / (this.targetDensity * PHYSICS_CONSTANTS.ROCK_MELTING_ENERGY);
    }
}

export { CraterCalculator };