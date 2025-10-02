/**
 * Atmosphere Calculator - Handles atmospheric entry and survival calculations
 */

import { PHYSICS_CONSTANTS } from '../utils/constants.js';

export class AtmosphereCalculator {
    calculateAtmosphericEntry(parameters) {
        const { diameter, velocity, angle, density, mass } = parameters;
        
        // Simple atmospheric entry model
        const dragCoefficient = 1.3; // Typical for rocky bodies
        const scaleHeight = PHYSICS_CONSTANTS.ATMOSPHERE_SCALE_HEIGHT;
        
        // Calculate if asteroid survives to ground
        const survivalDiameter = this.calculateSurvivalDiameter(velocity, density);
        const survivesAtmosphere = diameter >= survivalDiameter;
        
        if (!survivesAtmosphere) {
            // Calculate airburst parameters
            const airburstAltitude = this.calculateAirburstAltitude(diameter, velocity, density);
            const airburstEnergy = mass * Math.pow(velocity * 1000, 2) * 0.5;
            
            return {
                survivesAtmosphere: false,
                airburstAltitude,
                airburstEnergy,
                finalVelocity: 0,
                finalMass: 0,
                finalDiameter: 0
            };
        }
        
        // Calculate final parameters after atmospheric passage
        const finalVelocity = this.calculateFinalVelocity(velocity, diameter, density);
        const finalMass = this.calculateFinalMass(mass, diameter, velocity, density);
        const finalDiameter = Math.pow(finalMass / density * 6 / Math.PI, 1/3);
        
        return {
            survivesAtmosphere: true,
            finalVelocity,
            finalMass,
            finalDiameter,
            airburstAltitude: 0,
            airburstEnergy: 0
        };
    }

    calculateSurvivalDiameter(velocity, density) {
        // Empirical formula for minimum diameter to survive atmosphere
        // Based on Chyba et al. (1993) and similar studies
        const strengthFactor = Math.sqrt(density / 3000); // Normalized to typical rock
        const velocityFactor = Math.pow(velocity / 20, 0.5); // Normalized to typical impact velocity
        
        return 50 * strengthFactor / velocityFactor; // meters
    }

    calculateAirburstAltitude(diameter, velocity, density) {
        // Altitude where fragmentation occurs
        const dynamicPressure = 0.5 * PHYSICS_CONSTANTS.AIR_DENSITY_SEA_LEVEL * Math.pow(velocity * 1000, 2);
        const strength = this.getMaterialStrength(density);
        
        // Altitude where dynamic pressure equals material strength
        const altitudeFactor = Math.log(dynamicPressure / strength);
        const altitude = PHYSICS_CONSTANTS.ATMOSPHERE_SCALE_HEIGHT * altitudeFactor;
        
        return Math.max(altitude, 10000); // Minimum 10km altitude
    }

    calculateFinalVelocity(velocity, diameter, density) {
        // Simplified deceleration model
        const massLossRatio = this.calculateMassLossRatio(diameter, velocity, density);
        const velocityRetention = 1 - massLossRatio * 0.3; // Approximate coupling
        
        return velocity * Math.max(velocityRetention, 0.5); // Minimum 50% velocity retention
    }

    calculateFinalMass(mass, diameter, velocity, density) {
        const massLossRatio = this.calculateMassLossRatio(diameter, velocity, density);
        return mass * (1 - massLossRatio);
    }

    calculateMassLossRatio(diameter, velocity, density) {
        // Estimate mass loss due to ablation and fragmentation
        const surfaceAreaToVolume = 6 / diameter; // For sphere
        const velocityFactor = Math.pow(velocity / 20, 2);
        const strengthFactor = 3000 / density; // Weaker materials lose more mass
        
        const massLoss = 0.1 * surfaceAreaToVolume * velocityFactor * strengthFactor;
        return Math.min(massLoss, 0.9); // Maximum 90% mass loss
    }

    getMaterialStrength(density) {
        // Approximate material strength based on density
        const strengths = {
            ice: 1e6,      // 1 MPa
            rock: 1e8,     // 100 MPa  
            iron: 1e9      // 1 GPa
        };
        
        if (density < 1000) return strengths.ice;
        if (density < 5000) return strengths.rock;
        return strengths.iron;
    }
}