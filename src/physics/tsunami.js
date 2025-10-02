/**
 * Tsunami Calculator - Enhanced Phase 2 Implementation
 * Based on impact-generated tsunami physics and wave propagation models
 */

import { PHYSICS_CONSTANTS } from '../utils/constants.js';

export class TsunamiCalculator {
    constructor() {
        this.waterDensity = PHYSICS_CONSTANTS.WATER_DENSITY;
        this.gravity = PHYSICS_CONSTANTS.EARTH_GRAVITY;
        this.earthRadius = PHYSICS_CONSTANTS.EARTH_RADIUS;
    }

    /**
     * Calculate complete tsunami effects from ocean impact
     * @param {Object} parameters - Impact parameters
     * @returns {Object} Tsunami modeling results
     */
    async calculateTsunami(parameters) {
        const { energy, location, craterDiameter } = parameters;
        
        // Validate input parameters
        if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
            console.warn('Invalid location for tsunami calculation:', location);
            return {
                generated: false,
                reason: 'Invalid coordinates provided',
                oceanImpact: null,
                maxHeight: 0,
                waveData: null,
                coastalEffects: []
            };
        }
        
        // Determine if impact occurs in water
        const oceanImpact = await this.determineOceanImpact(location);
        
        if (!oceanImpact.inOcean) {
            return {
                generated: false,
                reason: 'Land impact - no tsunami generation',
                oceanImpact: oceanImpact,
                maxHeight: 0,
                waveData: null,
                coastalEffects: []
            };
        }

        // Calculate initial tsunami wave parameters
        const initialWave = this.calculateInitialWave(energy, oceanImpact.waterDepth, craterDiameter);
        
        // Check if wave is significant enough to propagate
        if (initialWave.height < 0.1) { // Less than 10cm
            return {
                generated: false,
                reason: 'Wave height too small for significant tsunami',
                oceanImpact: oceanImpact,
                maxHeight: initialWave.height,
                waveData: initialWave,
                coastalEffects: []
            };
        }

        // Model wave propagation across ocean basin
        const propagationData = await this.modelWavePropagation(initialWave, location);
        
        // Calculate coastal effects and arrival times
        const coastalEffects = await this.calculateCoastalEffects(propagationData, location);
        
        // Generate visualization data
        const visualizationData = this.generateTsunamiVisualization(propagationData, coastalEffects);

        return {
            generated: true,
            oceanImpact: oceanImpact,
            initialWave: initialWave,
            maxHeight: Math.max(...coastalEffects.map(c => c.maxHeight)),
            propagation: propagationData,
            coastalEffects: coastalEffects,
            visualization: visualizationData,
            arrivalTimes: this.calculateArrivalTimes(location, coastalEffects),
            duration: this.estimateEventDuration(initialWave),
            energyDistribution: this.calculateEnergyDistribution(initialWave, propagationData)
        };
    }

    /**
     * Determine if impact location is in ocean and get water depth
     * @param {Object} location - Impact coordinates
     * @returns {Object} Ocean impact assessment
     */
    async determineOceanImpact(location) {
        // Simplified ocean detection - in production would use bathymetry API
        const { latitude, longitude } = location;
        
        // Basic ocean/land classification
        const isOcean = this.isOceanCoordinate(latitude, longitude);
        
        if (!isOcean) {
            return {
                inOcean: false,
                waterDepth: 0,
                oceanBasin: null,
                nearestCoast: null
            };
        }

        // Estimate water depth (would use real bathymetry data)
        const estimatedDepth = this.estimateWaterDepth(latitude, longitude);
        const oceanBasin = this.identifyOceanBasin(latitude, longitude);
        const nearestCoast = this.findNearestCoastline(latitude, longitude);

        return {
            inOcean: true,
            waterDepth: estimatedDepth,
            oceanBasin: oceanBasin,
            nearestCoast: nearestCoast,
            coordinates: location
        };
    }

    /**
     * Calculate initial tsunami wave from impact
     * @param {number} energy - Impact energy in Joules
     * @param {number} waterDepth - Water depth at impact site in meters
     * @param {number} craterDiameter - Crater diameter in meters
     * @returns {Object} Initial wave parameters
     */
    calculateInitialWave(energy, waterDepth, craterDiameter) {
        // Energy transfer efficiency from impact to tsunami (typically 0.1-1%)
        const transferEfficiency = this.calculateEnergyTransferEfficiency(waterDepth, craterDiameter);
        const tsunamiEnergy = energy * transferEfficiency;
        
        // Initial water displacement volume
        const displacementVolume = this.calculateWaterDisplacement(craterDiameter, waterDepth);
        
        // Initial wave height based on energy and displacement
        const initialHeight = this.calculateInitialWaveHeight(tsunamiEnergy, displacementVolume, waterDepth);
        
        // Wave wavelength (typically 10-100x crater diameter for impacts)
        const wavelength = Math.max(craterDiameter * 50, waterDepth * 20);
        
        // Wave period from shallow water wave theory
        const period = this.calculateWavePeriod(wavelength, waterDepth);
        
        // Wave speed
        const waveSpeed = this.calculateWaveSpeed(wavelength, waterDepth);

        return {
            height: initialHeight,
            wavelength: wavelength,
            period: period,
            speed: waveSpeed,
            energy: tsunamiEnergy,
            displacementVolume: displacementVolume,
            transferEfficiency: transferEfficiency,
            waveType: waterDepth > wavelength / 20 ? 'deep-water' : 'shallow-water'
        };
    }

    /**
     * Model tsunami wave propagation across ocean
     * @param {Object} initialWave - Initial wave parameters
     * @param {Object} epicenter - Tsunami generation location
     * @returns {Object} Wave propagation data
     */
    async modelWavePropagation(initialWave, epicenter) {
        const propagationData = {
            epicenter: epicenter,
            initialWave: initialWave,
            waveFronts: [],
            travelTimes: new Map(),
            energyDecay: []
        };

        // Calculate wave propagation in concentric circles
        const maxPropagationDistance = 20000; // 20,000 km maximum
        const timeSteps = 24; // 24 time intervals
        const timeInterval = 3600; // 1 hour intervals

        for (let step = 0; step < timeSteps; step++) {
            const currentTime = step * timeInterval; // seconds
            const waveRadius = initialWave.speed * currentTime; // meters
            
            if (waveRadius > maxPropagationDistance * 1000) break;

            // Calculate wave height decay with distance
            const heightAtDistance = this.calculateWaveHeightDecay(
                initialWave.height, 
                waveRadius, 
                initialWave.wavelength
            );

            if (heightAtDistance < 0.01) break; // Wave too small to continue

            // Create wave front circle
            const waveFront = {
                time: currentTime,
                radius: waveRadius,
                height: heightAtDistance,
                speed: this.calculateWaveSpeedAtDistance(initialWave, waveRadius),
                energy: this.calculateEnergyAtDistance(initialWave.energy, waveRadius)
            };

            propagationData.waveFronts.push(waveFront);
        }

        return propagationData;
    }

    /**
     * Calculate coastal effects at shorelines
     * @param {Object} propagationData - Wave propagation results
     * @param {Object} epicenter - Tsunami origin
     * @returns {Array} Coastal impact data
     */
    async calculateCoastalEffects(propagationData, epicenter) {
        const coastalEffects = [];
        
        // Simplified coastal points (would use real coastline data)
        const majorCoastlines = this.getMajorCoastlines(epicenter);
        
        for (const coastline of majorCoastlines) {
            const distance = this.calculateDistance(epicenter, coastline.coordinates);
            
            // Find wave arrival at this distance
            const arrivalWave = this.findWaveAtDistance(propagationData.waveFronts, distance);
            
            if (!arrivalWave || arrivalWave.height < 0.1) continue;

            // Calculate wave run-up and inundation
            const runUp = this.calculateWaveRunUp(arrivalWave, coastline);
            const inundation = this.calculateInundationDistance(runUp, coastline.topography);
            const arrivalTime = arrivalWave.time;

            coastalEffects.push({
                location: coastline.name,
                coordinates: {
                    latitude: coastline.coordinates.latitude,
                    longitude: coastline.coordinates.longitude
                },
                distance: distance,
                arrivalTime: arrivalTime,
                waveHeight: arrivalWave.height,
                runUpHeight: runUp.maxHeight,
                inundationDistance: inundation.maxDistance,
                velocity: runUp.velocity,
                hazardLevel: this.assessHazardLevel(arrivalWave.height, runUp.maxHeight),
                populationAtRisk: coastline.population || 0
            });
        }

        return coastalEffects.sort((a, b) => a.arrivalTime - b.arrivalTime);
    }

    /**
     * Generate visualization data for tsunami animation
     * @param {Object} propagationData - Wave propagation data
     * @param {Array} coastalEffects - Coastal impact data
     * @returns {Object} Visualization data
     */
    generateTsunamiVisualization(propagationData, coastalEffects) {
        return {
            epicenter: propagationData.epicenter,
            animationFrames: propagationData.waveFronts.map(front => ({
                time: front.time,
                circles: [{
                    center: propagationData.epicenter,
                    radius: front.radius,
                    height: front.height,
                    opacity: Math.max(0.1, front.height / propagationData.initialWave.height),
                    color: this.getWaveHeightColor(front.height)
                }]
            })),
            coastalMarkers: coastalEffects.map(effect => ({
                location: effect.coordinates,
                arrivalTime: effect.arrivalTime,
                height: effect.waveHeight,
                hazard: effect.hazardLevel,
                label: `${effect.location}: ${effect.waveHeight.toFixed(1)}m`
            })),
            colorScale: this.createWaveHeightColorScale(),
            duration: Math.max(...propagationData.waveFronts.map(f => f.time))
        };
    }

    // Calculation helper methods

    /**
     * Calculate energy transfer efficiency from impact to tsunami
     */
    calculateEnergyTransferEfficiency(waterDepth, craterDiameter) {
        // Deeper water and larger craters are more efficient
        const depthFactor = Math.min(waterDepth / 1000, 1); // Normalize to 1km
        const sizeFactor = Math.min(craterDiameter / 1000, 1); // Normalize to 1km
        
        return 0.001 * (1 + depthFactor) * (1 + sizeFactor); // 0.1% to 0.4% efficiency
    }

    /**
     * Calculate water displacement volume
     */
    calculateWaterDisplacement(craterDiameter, waterDepth) {
        // Simplified as hemisphere with crater diameter
        const radius = craterDiameter / 2;
        const displacementDepth = Math.min(radius * 0.2, waterDepth); // 20% of radius or water depth
        
        return (2/3) * Math.PI * Math.pow(radius, 2) * displacementDepth;
    }

    /**
     * Calculate initial wave height from energy and displacement
     */
    calculateInitialWaveHeight(energy, displacementVolume, waterDepth) {
        // Energy stored in wave: E = 0.5 * ρ * g * A * h²
        // Where A is area, h is height, ρ is density
        
        const waveArea = Math.PI * Math.pow(Math.sqrt(displacementVolume / Math.PI), 2);
        
        // Solve for height: h = √(2E / (ρ * g * A))
        const heightSquared = (2 * energy) / (this.waterDensity * this.gravity * waveArea);
        
        return Math.sqrt(Math.max(heightSquared, 0));
    }

    /**
     * Calculate wave period from wavelength and depth
     */
    calculateWavePeriod(wavelength, waterDepth) {
        // Shallow water: T = λ / √(gh)
        // Deep water: T = √(λ / (2πg))
        
        if (waterDepth < wavelength / 20) {
            // Shallow water approximation
            return wavelength / Math.sqrt(this.gravity * waterDepth);
        } else {
            // Deep water approximation  
            return Math.sqrt(wavelength / (2 * Math.PI * this.gravity));
        }
    }

    /**
     * Calculate wave speed based on depth and wavelength
     */
    calculateWaveSpeed(wavelength, waterDepth) {
        if (waterDepth < wavelength / 20) {
            // Shallow water: c = √(gh)
            return Math.sqrt(this.gravity * waterDepth);
        } else {
            // Deep water: c = √(gλ/(2π))
            return Math.sqrt(this.gravity * wavelength / (2 * Math.PI));
        }
    }

    /**
     * Calculate wave height decay with distance
     */
    calculateWaveHeightDecay(initialHeight, distance, wavelength) {
        // Geometric spreading in deep ocean: h ∝ 1/√r
        // Plus energy dissipation
        
        const geometricDecay = 1 / Math.sqrt(Math.max(distance / 1000, 1)); // Normalize to km
        const dissipationFactor = Math.exp(-distance / (wavelength * 1000)); // Exponential decay
        
        return initialHeight * geometricDecay * dissipationFactor;
    }

    /**
     * Calculate distance between two geographic points
     */
    calculateDistance(point1, point2) {
        // Haversine formula for great circle distance
        const R = this.earthRadius;
        const φ1 = point1.latitude * Math.PI / 180;
        const φ2 = point2.latitude * Math.PI / 180;
        const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
        const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    // Simplified geographic helper methods (would use real data in production)

    isOceanCoordinate(lat, lng) {
        // Very simplified ocean detection
        // Atlantic: lng between -80 and 20
        // Pacific: lng between -180 and -80 or 120 and 180  
        // Indian: lng between 20 and 120, lat between -60 and 30
        
        if (lng >= -80 && lng <= 20 && Math.abs(lat) < 70) return true; // Atlantic
        if ((lng >= -180 && lng <= -80) || (lng >= 120 && lng <= 180)) return true; // Pacific
        if (lng >= 20 && lng <= 120 && lat >= -60 && lat <= 30) return true; // Indian
        
        return false;
    }

    estimateWaterDepth(lat, lng) {
        // Simplified depth estimation - would use real bathymetry
        const absLat = Math.abs(lat);
        if (absLat > 60) return 2000; // Polar regions - shallower
        if (absLat < 30) return 4000; // Equatorial - deeper
        return 3000; // Mid-latitudes
    }

    identifyOceanBasin(lat, lng) {
        if (lng >= -80 && lng <= 20) return 'Atlantic';
        if ((lng >= -180 && lng <= -80) || (lng >= 120 && lng <= 180)) return 'Pacific';
        if (lng >= 20 && lng <= 120) return 'Indian';
        return 'Unknown';
    }

    findNearestCoastline(lat, lng) {
        // Simplified - would calculate to actual coastlines
        const distances = {
            'North America West': Math.abs(lng + 120),
            'North America East': Math.abs(lng + 75),  
            'Europe': Math.abs(lng - 0),
            'Asia': Math.abs(lng - 140),
            'Australia': Math.abs(lng - 140) + Math.abs(lat + 25)
        };
        
        const nearest = Object.entries(distances).reduce((min, [name, dist]) => 
            dist < min.dist ? {name, dist} : min, {name: '', dist: Infinity}
        );
        
        return nearest.name;
    }

    getMajorCoastlines(epicenter) {
        // Simplified major coastline data with proper coordinate format
        return [
            { name: 'California Coast', coordinates: {lat: 36, lng: -122}, population: 25000000, topography: 'steep' },
            { name: 'Japan Coast', coordinates: {lat: 36, lng: 140}, population: 50000000, topography: 'moderate' },
            { name: 'Chile Coast', coordinates: {lat: -30, lng: -71}, population: 5000000, topography: 'steep' },
            { name: 'Indonesia Coast', coordinates: {lat: -6, lng: 106}, population: 30000000, topography: 'flat' },
            { name: 'Hawaii Islands', coordinates: {lat: 21, lng: -158}, population: 1500000, topography: 'steep' }
        ];
    }

    findWaveAtDistance(waveFronts, targetDistance) {
        return waveFronts.find(front => Math.abs(front.radius - targetDistance) < front.radius * 0.1);
    }

    calculateWaveRunUp(wave, coastline) {
        // Run-up amplification factor based on topography
        const amplificationFactors = {
            'steep': 1.5,
            'moderate': 2.0, 
            'flat': 3.0
        };
        
        const amplification = amplificationFactors[coastline.topography] || 2.0;
        
        return {
            maxHeight: wave.height * amplification,
            velocity: Math.sqrt(2 * this.gravity * wave.height * amplification)
        };
    }

    calculateInundationDistance(runUp, topography) {
        // Simplified inundation calculation
        const slopeFactors = {
            'steep': 20,    // 20m inland per 1m height
            'moderate': 100, // 100m inland per 1m height
            'flat': 1000    // 1km inland per 1m height  
        };
        
        const slopeFactor = slopeFactors[topography] || 100;
        
        return {
            maxDistance: runUp.maxHeight * slopeFactor
        };
    }

    assessHazardLevel(waveHeight, runUpHeight) {
        if (runUpHeight > 10) return 'extreme';
        if (runUpHeight > 5) return 'high';
        if (runUpHeight > 2) return 'moderate';
        if (runUpHeight > 0.5) return 'low';
        return 'minimal';
    }

    calculateArrivalTimes(epicenter, coastalEffects) {
        return coastalEffects.map(effect => ({
            location: effect.location,
            arrivalTime: effect.arrivalTime,
            formattedTime: this.formatTime(effect.arrivalTime),
            distance: effect.distance
        }));
    }

    estimateEventDuration(initialWave) {
        // Tsunami duration typically 6-24 hours
        return Math.max(initialWave.period * 10, 6 * 3600); // At least 6 hours
    }

    calculateEnergyDistribution(initialWave, propagationData) {
        const totalEnergy = initialWave.energy;
        return {
            initialEnergy: totalEnergy,
            energyDecayRate: totalEnergy / (propagationData.waveFronts.length || 1),
            finalEnergy: propagationData.waveFronts.length > 0 ? 
                propagationData.waveFronts[propagationData.waveFronts.length - 1].energy : 0
        };
    }

    getWaveHeightColor(height) {
        if (height > 5) return '#8b0000';      // Dark red - extreme
        if (height > 2) return '#dc143c';      // Crimson - high  
        if (height > 1) return '#ff4500';      // Orange red - moderate
        if (height > 0.5) return '#ffa500';    // Orange - low
        return '#ffff00';                       // Yellow - minimal
    }

    createWaveHeightColorScale() {
        return {
            0.5: '#ffff00',   // Yellow - minimal
            1.0: '#ffa500',   // Orange - low
            2.0: '#ff4500',   // Orange red - moderate  
            5.0: '#dc143c',   // Crimson - high
            10.0: '#8b0000'   // Dark red - extreme
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    calculateWaveSpeedAtDistance(initialWave, distance) {
        // Speed may vary with depth changes - simplified constant
        return initialWave.speed;
    }

    calculateEnergyAtDistance(initialEnergy, distance) {
        // Energy decreases with spreading and dissipation
        return initialEnergy / Math.max(distance / 1000, 1);
    }
}