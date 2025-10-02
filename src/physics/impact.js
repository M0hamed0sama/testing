/**
 * Impact Calculator - Main physics calculations for asteroid impacts
 * Based on scientific models and established scaling laws
 */

import { CraterCalculator } from './crater.js';
import { BlastWaveCalculator } from './waves.js';
import { ThermalCalculator } from './thermal.js';
import { SeismicCalculator } from './seismic.js';
import { TsunamiCalculator } from './tsunami.js';
import { AtmosphereCalculator } from './atmosphere.js';
import { PHYSICS_CONSTANTS } from '../utils/constants.js';

class ImpactCalculator {
    constructor() {
        this.craterCalc = new CraterCalculator();
        this.blastCalc = new BlastWaveCalculator();
        this.thermalCalc = new ThermalCalculator();
        this.seismicCalc = new SeismicCalculator();
        this.tsunamiCalc = new TsunamiCalculator();
        this.atmosphereCalc = new AtmosphereCalculator();
    }

    /**
     * Calculate complete impact effects
     * @param {Object} parameters - Impact parameters
     * @returns {Object} Complete impact results
     */
    async calculateImpact(parameters) {
        const {
            diameter,        // meters
            velocity,        // km/s
            angle,          // degrees
            composition,    // 'rock', 'iron', 'ice', or 'custom'
            density,        // kg/m³ (for custom composition)
            latitude,       // degrees
            longitude       // degrees
        } = parameters;

        // Get density based on composition
        const asteroidDensity = this.getAsteroidDensity(composition, density);

        // Calculate basic impact parameters
        const mass = this.calculateMass(diameter, asteroidDensity);
        const kineticEnergy = this.calculateKineticEnergy(mass, velocity);
        const momentum = this.calculateMomentum(mass, velocity);

        // Check atmospheric survival
        const atmosphereResults = this.atmosphereCalc.calculateAtmosphericEntry({
            diameter,
            velocity,
            angle,
            density: asteroidDensity,
            mass
        });

        const results = {
            // Basic parameters
            diameter,
            velocity,
            angle,
            density: asteroidDensity,
            mass,
            kineticEnergy,
            momentum,
            impactLocation: { latitude, longitude },
            
            // Atmospheric entry
            survivesAtmosphere: atmosphereResults.survivesAtmosphere,
            finalVelocity: atmosphereResults.finalVelocity,
            finalMass: atmosphereResults.finalMass,
            finalDiameter: atmosphereResults.finalDiameter
        };

        // If asteroid doesn't survive atmosphere, return early
        if (!atmosphereResults.survivesAtmosphere) {
            return {
                ...results,
                airburstAltitude: atmosphereResults.airburstAltitude,
                airburstEnergy: atmosphereResults.airburstEnergy
            };
        }

        // Use final parameters for ground impact calculations
        const finalEnergy = this.calculateKineticEnergy(atmosphereResults.finalMass, atmosphereResults.finalVelocity);

        // Phase 1 calculations (always available)
        const craterResults = this.craterCalc.calculateCrater({
            diameter: atmosphereResults.finalDiameter,
            velocity: atmosphereResults.finalVelocity,
            angle,
            density: asteroidDensity,
            energy: finalEnergy
        });

        const blastResults = this.blastCalc.calculateBlastWave({
            energy: finalEnergy,
            angle
        });

        const thermalResults = this.thermalCalc.calculateThermalRadiation({
            energy: finalEnergy,
            diameter: atmosphereResults.finalDiameter
        });

        // Add Phase 1 results
        Object.assign(results, {
            // Crater effects
            craterDiameter: craterResults.diameter,
            craterDepth: craterResults.depth,
            craterVolume: craterResults.volume,
            rimHeight: craterResults.rimHeight,
            ejectaRange: craterResults.ejectaRange,
            
            // Blast wave effects
            blastRadius1psi: blastResults.radius1psi,
            blastRadius5psi: blastResults.radius5psi,
            blastRadius10psi: blastResults.radius10psi,
            overpressureRadii: blastResults.overpressureRadii,
            
            // Thermal effects
            thermalRadius1deg: thermalResults.radius1deg,
            thermalRadius2deg: thermalResults.radius2deg,
            thermalRadius3deg: thermalResults.radius3deg,
            thermalDuration: thermalResults.duration,
            fireball: thermalResults.fireball
        });

        // Phase 2 calculations (seismic and tsunami)
        if (this.isPhase2Enabled()) {
            console.log('Phase 2 enabled - calculating seismic and tsunami effects');
            console.log('Final energy for Phase 2:', finalEnergy, 'J');
            
            const seismicResults = this.seismicCalc.calculateSeismicEffects({
                energy: finalEnergy,
                location: { latitude, longitude },
                craterDiameter: craterResults.diameter
            });
            
            console.log('Seismic calculation results:', seismicResults);
            
            const tsunamiResults = await this.tsunamiCalc.calculateTsunami({
                energy: finalEnergy,
                location: { latitude, longitude },
                craterDiameter: craterResults.diameter
            });
            
            console.log('Tsunami calculation results:', tsunamiResults);
            
            const phase2Data = {
                // Seismic effects
                seismicMagnitude: seismicResults.magnitude,
                seismicSignificant: seismicResults.significant,
                seismicRadius: seismicResults.effectRadius,
                seismicZones: seismicResults.zones,
                groundMotion: seismicResults.groundMotion,
                buildingDamage: seismicResults.damageAssessment,
                seismicDuration: seismicResults.duration,
                
                // Tsunami effects  
                tsunamiGenerated: tsunamiResults.generated,
                tsunamiMaxHeight: tsunamiResults.maxHeight,
                tsunamiOceanImpact: tsunamiResults.oceanImpact,
                tsunamiPropagation: tsunamiResults.propagation,
                tsunamiCoastalEffects: tsunamiResults.coastalEffects,
                tsunamiVisualization: tsunamiResults.visualization,
                tsunamiArrivalTimes: tsunamiResults.arrivalTimes
            };
            
            console.log('Phase 2 data being added to results:', phase2Data);
            Object.assign(results, phase2Data);
        }

        return results;
    }

    calculateMass(diameter, density) {
        // Mass = Volume × Density
        // Assuming spherical asteroid
        const radius = diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        return volume * density; // kg
    }

    calculateKineticEnergy(mass, velocity) {
        // KE = 1/2 × m × v²
        const velocityMs = velocity * 1000; // convert km/s to m/s
        return 0.5 * mass * Math.pow(velocityMs, 2); // Joules
    }

    calculateMomentum(mass, velocity) {
        // p = m × v
        const velocityMs = velocity * 1000; // convert km/s to m/s
        return mass * velocityMs; // kg⋅m/s
    }

    getAsteroidDensity(composition, customDensity) {
        const densities = {
            'rock': 2700,  // kg/m³
            'iron': 7800,  // kg/m³
            'ice': 917,    // kg/m³
            'custom': customDensity || 2700
        };
        
        return densities[composition] || densities['rock'];
    }

    // Helper method to check if Phase 2 features are enabled
    isPhase2Enabled() {
        // Phase 2 is always enabled since it's fully implemented
        return true;
    }

    // Method to convert energy to TNT equivalent
    energyToTNT(energyJoules) {
        // 1 ton of TNT = 4.184 × 10^9 Joules
        const TNT_EQUIVALENT = 4.184e9;
        return energyJoules / TNT_EQUIVALENT; // tons of TNT
    }

    // Method to calculate impact angle effects
    calculateAngleEffects(angle) {
        // Angle affects crater shape and ejecta distribution
        const angleRad = (angle * Math.PI) / 180;
        const efficiency = Math.sin(angleRad); // Impact efficiency
        const asymmetry = 1 - Math.cos(angleRad); // Crater asymmetry
        
        return {
            efficiency,
            asymmetry,
            ejectaDirection: angle < 45 ? 'downrange' : 'symmetric'
        };
    }
}

export { ImpactCalculator };