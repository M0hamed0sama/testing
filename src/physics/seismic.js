/**
 * Seismic Calculator - Enhanced Phase 2 Implementation
 * Based on established earthquake magnitude scaling and ground motion prediction
 */

import { PHYSICS_CONSTANTS, DAMAGE_THRESHOLDS } from '../utils/constants.js';

export class SeismicCalculator {
    constructor() {
        this.attenuationModel = 'Boore-Atkinson'; // Ground motion prediction equation
        this.crustalVelocity = PHYSICS_CONSTANTS.SEISMIC_VELOCITY; // 6 km/s average
    }

    /**
     * Calculate complete seismic effects from impact energy
     * @param {Object} parameters - Impact parameters including energy and location
     * @returns {Object} Seismic effects data
     */
    calculateSeismicEffects(parameters) {
        const { energy, location, craterDiameter } = parameters;
        
        // Validate input parameters
        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
            console.warn('Invalid location for seismic calculation:', location);
            return {
                magnitude: 0,
                significant: false,
                effectRadius: 0,
                zones: [],
                peakAcceleration: 0
            };
        }
        
        // Calculate earthquake magnitude from impact energy
        const magnitude = this.calculateMagnitude(energy);
        
        // Determine if magnitude is significant enough for effects
        if (magnitude < 3.0) {
            return {
                magnitude: magnitude,
                significant: false,
                effectRadius: 0,
                zones: [],
                peakAcceleration: 0
            };
        }

        // Calculate seismic intensity zones
        const intensityZones = this.calculateIntensityZones(magnitude, location, craterDiameter);
        
        // Calculate ground motion parameters
        const groundMotion = this.calculateGroundMotionParameters(magnitude, intensityZones);
        
        // Assess building damage probabilities
        const damageAssessment = this.assessBuildingDamage(intensityZones);
        
        // Calculate seismic wave arrival times
        const arrivalTimes = this.calculateArrivalTimes(location, intensityZones);

        return {
            magnitude: magnitude,
            significant: true,
            effectRadius: Math.max(...intensityZones.map(zone => zone.radius)),
            zones: intensityZones,
            groundMotion: groundMotion,
            damageAssessment: damageAssessment,
            arrivalTimes: arrivalTimes,
            duration: this.calculateShakingDuration(magnitude),
            frequency: this.calculateDominantFrequency(magnitude, craterDiameter)
        };
    }

    /**
     * Calculate earthquake magnitude from impact energy
     * Uses Gutenberg-Richter scaling law modified for impacts
     * @param {number} energy - Impact energy in Joules
     * @returns {number} Earthquake magnitude (Richter scale)
     */
    calculateMagnitude(energy) {
        // Gutenberg-Richter relation: log₁₀(E) = 1.5M + 9.1
        // Rearranged: M = (log₁₀(E) - 9.1) / 1.5
        // Modified for impact efficiency (only ~1% becomes seismic)
        
        const seismicEnergy = energy * 0.01; // 1% efficiency factor
        const logEnergy = Math.log10(seismicEnergy);
        const magnitude = (logEnergy - 9.1) / 1.5;
        
        // Clamp to realistic range for impacts
        return Math.max(0, Math.min(magnitude, 10));
    }

    /**
     * Calculate Modified Mercalli Intensity zones around epicenter
     * @param {number} magnitude - Earthquake magnitude
     * @param {Object} location - Epicenter coordinates {latitude, longitude}
     * @param {number} craterDiameter - Crater diameter in meters
     * @returns {Array} Array of intensity zone objects
     */
    calculateIntensityZones(magnitude, location, craterDiameter) {
        const zones = [];
        
        // Modified Mercalli Intensity scale (I-XII) - Maximum at center, decreasing outward
        const baseIntensity = Math.min(12, Math.max(3, Math.floor(magnitude * 1.5 + 2)));
        console.log(`Base seismic intensity: ${baseIntensity} for magnitude ${magnitude}`);
        
        const intensityLevels = [];
        
        // Generate intensity zones from maximum (at center) down to minimum
        for (let i = baseIntensity; i >= 3; i -= 2) {
            const radiusMultiplier = Math.pow(2, (baseIntensity - i) / 2); // Exponential distance decay
            intensityLevels.push({
                intensity: i,
                description: this.getIntensityDescription(i),
                damageLevel: i / 12, // Normalized damage (0-1)
                baseRadius: craterDiameter * radiusMultiplier
            });
        }

        intensityLevels.forEach((level, index) => {
            // Calculate radius for this intensity using attenuation
            const radius = this.calculateIntensityRadius(magnitude, level.intensity, location);
            const minRadius = Math.max(level.baseRadius, 500); // Minimum 500m radius
            
            // Only include zones with significant radius and ensure proper ordering
            if (radius > minRadius) {
                zones.push({
                    intensity: level.intensity,
                    description: level.description,
                    radius: radius,
                    damageLevel: level.damageLevel,
                    peakAcceleration: this.intensityToPGA(level.intensity),
                    center: {
                        latitude: location.latitude, // Use consistent coordinate format
                        longitude: location.longitude
                    },
                    color: this.getIntensityColor(level.intensity),
                    opacity: 0.7 - (index * 0.1) // Varying opacity for better visualization
                });
            }
        });
        
        console.log(`Generated ${zones.length} seismic intensity zones:`, zones.map(z => `MMI ${z.intensity} (${z.radius.toFixed(0)}m)`));

        return zones.sort((a, b) => b.radius - a.radius); // Largest first for ring visualization
    }

    /**
     * Calculate radius for specific intensity level
     * @param {number} magnitude - Earthquake magnitude
     * @param {number} intensity - Target MMI intensity
     * @param {Object} location - Epicenter location
     * @returns {number} Radius in meters
     */
    calculateIntensityRadius(magnitude, intensity, location) {
        // Simplified attenuation relationship
        // MMI = A + B*M - C*log₁₀(R) + site_terms
        // Rearranged to solve for R
        
        const A = 2.0; // Base intensity
        const B = 1.5; // Magnitude scaling
        const C = 3.5; // Distance attenuation
        
        // Site amplification (simplified)
        const siteAmp = this.getSiteAmplification(location);
        
        // Solve for distance: R = 10^((A + B*M + siteAmp - MMI) / C)
        const logR = (A + B * magnitude + siteAmp - intensity) / C;
        const radiusKm = Math.pow(10, logR);
        
        return Math.max(radiusKm * 1000, 0); // Convert to meters
    }

    /**
     * Calculate ground motion parameters for all zones
     * @param {number} magnitude - Earthquake magnitude
     * @param {Array} zones - Intensity zones
     * @returns {Object} Ground motion data
     */
    calculateGroundMotionParameters(magnitude, zones) {
        const maxPGA = zones.length > 0 ? Math.max(...zones.map(z => z.peakAcceleration)) : 0;
        
        return {
            peakGroundAcceleration: maxPGA,
            maxIntensity: zones.length > 0 ? Math.max(...zones.map(z => z.intensity)) : 0,
            attenuationModel: this.attenuationModel,
            crustalProperties: {
                velocity: this.crustalVelocity,
                density: PHYSICS_CONSTANTS.EARTH_CRUST_DENSITY,
                quality: 600 // Q-factor for attenuation
            }
        };
    }

    /**
     * Assess building damage probabilities for each zone
     * @param {Array} zones - Seismic intensity zones
     * @returns {Object} Damage assessment data
     */
    assessBuildingDamage(zones) {
        const damageCategories = {
            residential: { name: 'Residential Buildings', vulnerability: 1.0 },
            commercial: { name: 'Commercial Buildings', vulnerability: 0.8 },
            industrial: { name: 'Industrial Facilities', vulnerability: 0.6 },
            critical: { name: 'Critical Infrastructure', vulnerability: 0.4 }
        };

        const assessment = {
            zones: [],
            totalDamage: {
                light: 0,
                moderate: 0,
                extensive: 0,
                complete: 0
            }
        };

        zones.forEach(zone => {
            const zoneAssessment = {
                intensity: zone.intensity,
                radius: zone.radius,
                buildings: {}
            };

            Object.entries(damageCategories).forEach(([type, category]) => {
                const fragility = this.calculateFragilityCurve(zone.intensity, category.vulnerability);
                zoneAssessment.buildings[type] = {
                    name: category.name,
                    damageStates: fragility,
                    expectedLoss: fragility.complete * 0.6 + fragility.extensive * 0.3 + fragility.moderate * 0.1
                };
            });

            assessment.zones.push(zoneAssessment);
        });

        return assessment;
    }

    /**
     * Calculate seismic wave arrival times at different distances
     * @param {Object} epicenter - Earthquake epicenter
     * @param {Array} zones - Intensity zones
     * @returns {Object} Wave arrival time data
     */
    calculateArrivalTimes(epicenter, zones) {
        const waveTypes = {
            pWave: { velocity: 6000, name: 'P-Wave (Primary)' }, // m/s
            sWave: { velocity: 3500, name: 'S-Wave (Secondary)' },
            surface: { velocity: 2800, name: 'Surface Waves' }
        };

        const arrivals = zones.map(zone => {
            const distance = zone.radius;
            const times = {};
            
            Object.entries(waveTypes).forEach(([type, wave]) => {
                times[type] = {
                    name: wave.name,
                    arrivalTime: distance / wave.velocity, // seconds
                    velocity: wave.velocity
                };
            });

            return {
                distance: distance,
                intensity: zone.intensity,
                waveArrivals: times
            };
        });

        return {
            epicenter: epicenter,
            waveTypes: waveTypes,
            arrivals: arrivals
        };
    }

    /**
     * Calculate expected shaking duration
     * @param {number} magnitude - Earthquake magnitude
     * @returns {number} Duration in seconds
     */
    calculateShakingDuration(magnitude) {
        // Empirical relationship: Duration increases with magnitude
        // For impacts: shorter duration than tectonic earthquakes
        const tectonicDuration = Math.pow(10, 0.5 * magnitude - 1.5);
        return Math.max(tectonicDuration * 0.3, 5); // Impact factor: 30% of tectonic
    }

    /**
     * Calculate dominant frequency of ground motion
     * @param {number} magnitude - Earthquake magnitude  
     * @param {number} craterDiameter - Crater diameter
     * @returns {number} Frequency in Hz
     */
    calculateDominantFrequency(magnitude, craterDiameter) {
        // Larger impacts and craters produce lower frequency shaking
        // Smaller impacts produce higher frequency
        const baseFreq = 1.0 / Math.sqrt(craterDiameter / 1000); // Inversely related to crater size
        const magnitudeEffect = Math.pow(10, (5 - magnitude) / 3); // Higher magnitude = lower frequency
        
        return Math.max(Math.min(baseFreq * magnitudeEffect, 50), 0.1); // Clamp between 0.1-50 Hz
    }

    // Helper methods

    /**
     * Convert MMI intensity to Peak Ground Acceleration
     * @param {number} intensity - Modified Mercalli Intensity
     * @returns {number} PGA in g (gravity units)
     */
    intensityToPGA(intensity) {
        // Empirical relationship between MMI and PGA
        const logPGA = intensity / 3.0 - 1.5;
        return Math.pow(10, logPGA); // Return in units of g
    }

    /**
     * Get site amplification factor based on location
     * @param {Object} location - Geographic location
     * @returns {number} Amplification factor
     */
    getSiteAmplification(location) {
        // Simplified site classification
        // In real implementation, would use geological data
        return 0.0; // Assume rock site (no amplification)
    }

    /**
     * Calculate building fragility curve for damage states
     * @param {number} intensity - Ground shaking intensity
     * @param {number} vulnerability - Building vulnerability factor
     * @returns {Object} Damage state probabilities
     */
    calculateFragilityCurve(intensity, vulnerability) {
        // Simplified fragility curves based on intensity and vulnerability
        const adjustedIntensity = intensity * vulnerability;
        
        return {
            light: Math.min(adjustedIntensity / 12 * 0.8, 0.8),
            moderate: Math.min(Math.max(adjustedIntensity - 4, 0) / 8 * 0.6, 0.6),
            extensive: Math.min(Math.max(adjustedIntensity - 6, 0) / 6 * 0.4, 0.4),
            complete: Math.min(Math.max(adjustedIntensity - 8, 0) / 4 * 0.2, 0.2)
        };
    }

    /**
     * Get color for intensity visualization
     * @param {number} intensity - MMI intensity
     * @returns {string} Hex color code
     */
    getIntensityColor(intensity) {
        // High contrast color scheme showing intensity gradient from center outward
        const colors = {
            12: '#FF0000', // Bright red - Maximum intensity at epicenter
            11: '#FF2200', // Red-orange
            10: '#FF4400', // Orange-red - Very strong
            9: '#FF6600',  // Orange
            8: '#FF8800',  // Light orange - Strong  
            7: '#FFAA00',  // Yellow-orange
            6: '#FFCC00',  // Yellow - Moderate
            5: '#FFDD00',  // Light yellow
            4: '#FFFF00',  // Yellow - Light
            3: '#CCFF33',  // Yellow-green - Weak
            2: '#99FF66',  // Light green - Very weak
            1: '#66FF99'   // Green - Not felt
        };
        
        return colors[intensity] || '#CCCCCC';
    }
    
    /**
     * Get description for intensity level
     */
    getIntensityDescription(intensity) {
        const descriptions = {
            12: 'Extreme Destruction',
            11: 'Catastrophic', 
            10: 'Disastrous',
            9: 'Violent',
            8: 'Severe',
            7: 'Very Strong',
            6: 'Strong', 
            5: 'Moderate',
            4: 'Light',
            3: 'Weak',
            2: 'Very Weak',
            1: 'Not Felt'
        };
        return descriptions[intensity] || 'Unknown';
    }
}