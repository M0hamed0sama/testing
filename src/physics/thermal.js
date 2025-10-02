/**
 * Thermal Radiation Calculator     calculateBurnRadius(fireball, threshold) {
        // Calculate radius where thermal fluence equals burn threshold
        const { totalRadiantEnergy, radius: fireballRadius } = fireball;
        
        // Thermal fluence decreases as 1/r^2 from fireball surface
        const fireballSurfaceArea = 4 * Math.PI * Math.pow(fireballRadius, 2);
        const fireballFluence = totalRadiantEnergy / fireballSurfaceArea;
        
        // Convert threshold from J/cm² to J/m²
        const thresholdJm2 = threshold * 10000;
        
        // Calculate radius where fluence equals threshold
        const burnRadius = fireballRadius * Math.sqrt(fireballFluence / thresholdJm2);
        
        // Ensure radius is at least fireball radius and is a reasonable value
        const finalRadius = Math.max(burnRadius, fireballRadius);
        
        // Debug output
        console.log(`Burn calculation - Threshold: ${threshold} J/cm², Radius: ${finalRadius.toFixed(0)}m`);
        
        return finalRadius;
    }rmal effects and burn radii
 */

import { PHYSICS_CONSTANTS, DAMAGE_THRESHOLDS } from '../utils/constants.js';

export class ThermalCalculator {
    calculateThermalRadiation(parameters) {
        const { energy, diameter } = parameters;
        
        // Calculate fireball parameters
        const fireball = this.calculateFireball(energy);
        
        console.log('Fireball parameters:', fireball);
        
        // Calculate thermal radiation zones
        const radius1deg = this.calculateBurnRadius(fireball, DAMAGE_THRESHOLDS.THERMAL.FIRST_DEGREE_BURN);
        const radius2deg = this.calculateBurnRadius(fireball, DAMAGE_THRESHOLDS.THERMAL.SECOND_DEGREE_BURN);
        const radius3deg = this.calculateBurnRadius(fireball, DAMAGE_THRESHOLDS.THERMAL.THIRD_DEGREE_BURN);
        
        // Validate that radii are in correct order (1st > 2nd > 3rd degree)
        if (radius1deg <= radius2deg || radius2deg <= radius3deg) {
            console.warn('Invalid thermal radius ordering:', {
                '1st degree': radius1deg,
                '2nd degree': radius2deg,
                '3rd degree': radius3deg
            });
        }
        
        return {
            radius1deg,
            radius2deg, 
            radius3deg,
            duration: fireball.duration,
            fireball: fireball
        };
    }

    calculateFireball(energy) {
        // Empirical scaling laws for fireball
        const radius = Math.pow(energy / 4.184e9, 0.4) * 180; // meters
        const duration = Math.pow(energy / 4.184e9, 0.25) * 0.4; // seconds
        const temperature = 6000; // Kelvin (approximate)
        
        return {
            radius,
            duration,
            temperature,
            totalRadiantEnergy: energy * 0.35 // ~35% of energy as thermal radiation
        };
    }

    calculateBurnRadius(fireball, threshold) {
        // Calculate radius where thermal fluence equals burn threshold
        const { totalRadiantEnergy, radius: fireballRadius } = fireball;
        
        // Thermal fluence decreases as 1/r^2 from fireball surface
        const fireballSurfaceArea = 4 * Math.PI * Math.pow(fireballRadius, 2);
        const fireballFluence = totalRadiantEnergy / fireballSurfaceArea;
        
        // Convert threshold from J/cm² to J/m²
        const thresholdJm2 = threshold * 10000;
        
        // Calculate radius where fluence equals threshold
        const burnRadius = fireballRadius * Math.sqrt(fireballFluence / thresholdJm2);
        
        return Math.max(burnRadius, fireballRadius);
    }
}