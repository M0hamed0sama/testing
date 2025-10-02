
/**
 * Visualization Manager - Handles effect visualization on the map
 * Enhanced for Phase 2 with seismic and tsunami effects
 */

import { EventEmitter } from '../utils/events.js';
import { SeismicLayerManager } from '../map/seismic-layers.js';
import { TsunamiLayerManager } from '../map/tsunami-layers.js';

export class VisualizationManager extends EventEmitter {
    constructor(map, layerManager) {
        super();
        this.map = map;
        this.layerManager = layerManager;
        this.seismicLayerManager = new SeismicLayerManager(map, layerManager);
        this.tsunamiLayerManager = new TsunamiLayerManager(map, layerManager);
        
        this.animationState = {
            isPlaying: false,
            isPaused: false,
            speed: 1,
            currentTime: 0,
            duration: 10000 // 10 seconds
        };
        
        this.phase2Enabled = false;
        this.currentResults = null;
        
        // Zone label management
        this.zoneLabels = {
            crater: [],
            blast: [],
            thermal: [],
            seismic: []
        };
    }

    async visualizeEffects(results, parameters) {
        const center = { lat: parameters.latitude, lng: parameters.longitude };
        this.currentResults = results;
        
        // Clear existing layers and labels (including Phase 2)
        this.layerManager.clearAllEffectLayers();
        this.seismicLayerManager.clearSeismicLayers();
        this.clearZoneLabels(); // Clear all zone labels
        // this.tsunamiLayerManager.clearTsunamiLayers(); // Temporarily disabled
        
        // Always create Phase 1 zones (physics simulation results)
        this.visualizeCrater(center, results.craterDiameter);
        this.visualizeBlastWave(center, results);
        this.visualizeThermalRadiation(center, results);
        
        // Phase 2 visualization (if enabled and data available)
        if (this.isPhase2Available(results)) {
            await this.visualizePhase2Effects(results, parameters);
        }
        
        // Update timeline controls availability
        this.updateTimelineControls(results);
        
        // Apply current visibility states from timeline selection
        this.applyLayerVisibilityStates();
        
        console.log('Effects visualized on map');
    }

    /**
     * Visualize Phase 2 effects (seismic and tsunami)
     */
    async visualizePhase2Effects(results, parameters) {
        console.log('Rendering Phase 2 effects...');
        
        // Validate parameters
        if (!parameters || typeof parameters.latitude !== 'number' || typeof parameters.longitude !== 'number') {
            console.warn('Invalid parameters for Phase 2 effects:', parameters);
            return;
        }
        
        // Visualize seismic effects
        if (results.seismicSignificant && results.seismicZones) {
            console.log('Adding seismic intensity zones:', results.seismicZones.length, 'zones');
            // Format seismic data for the layer manager
            const seismicData = {
                significant: results.seismicSignificant,
                magnitude: results.seismicMagnitude,
                zones: results.seismicZones,
                duration: results.seismicDuration || 30
            };
            
            this.seismicLayerManager.addIntensityZones(seismicData);
            
            // Start seismic wave animation if enabled
            if (this.shouldAnimateSeismic()) {
                const epicenter = { 
                    lat: parameters.latitude, 
                    lng: parameters.longitude 
                };
                this.seismicLayerManager.createShakingAnimation(
                    epicenter, 
                    results.seismicZones, 
                    results.seismicDuration || 30
                );
            }
        } else {
            console.warn('No seismic effects to visualize:', {
                significant: results.seismicSignificant,
                zonesLength: results.seismicZones?.length || 0
            });
        }
        
        // Visualize tsunami effects - temporarily disabled (keeping code for later)
        /*
        if (results.tsunamiGenerated) {
            try {
                console.log('Adding tsunami wave height zones:', results.tsunamiGenerated);
                // Format tsunami data for the layer manager
                const tsunamiData = {
                    generated: results.tsunamiGenerated,
                    propagation: results.tsunamiPropagation,
                    coastalEffects: results.tsunamiCoastalEffects || [],
                    visualization: results.tsunamiVisualization
                };
                
                this.tsunamiLayerManager.addWaveHeightZones(tsunamiData);
                
                // Start tsunami animation if enabled and data available
                if (this.shouldAnimateTsunami() && results.tsunamiPropagation) {
                    this.tsunamiLayerManager.animateWavePropagation(
                        results.tsunamiPropagation,
                        this.getTsunamiAnimationSpeed()
                    );
                }
                
                // Show coastal effects with validation
                if (results.tsunamiCoastalEffects?.length > 0) {
                    console.log('Adding coastal effects:', results.tsunamiCoastalEffects.length, 'locations');
                    // Filter out any coastal effects with invalid coordinates
                    const validCoastalEffects = results.tsunamiCoastalEffects.filter(effect => 
                        effect.coordinates && 
                        typeof effect.coordinates.latitude === 'number' && 
                        typeof effect.coordinates.longitude === 'number' &&
                        !isNaN(effect.coordinates.latitude) &&
                        !isNaN(effect.coordinates.longitude)
                    );
                    
                    if (validCoastalEffects.length > 0) {
                        this.tsunamiLayerManager.visualizeCoastalInundation(validCoastalEffects);
                    }
                }
            } catch (error) {
                console.error('Error visualizing tsunami effects:', error);
            }
        }
        */
    }

    // Apply the current timeline selection to layer visibility
    applyLayerVisibilityStates() {
        // Find the currently selected timeline layer
        const selectedRadio = document.querySelector('input[name="visualizationLayer"]:checked');
        const selectedLayer = selectedRadio ? selectedRadio.value : 'crater'; // Default to crater
        
        console.log(`Applying timeline state: ${selectedLayer}`);
        
        // Show the selected timeline layer
        this.showTimelineLayer(selectedLayer);
    }

    visualizeCrater(center, diameter) {
        this.layerManager.addCircleLayer('crater-layer', center, diameter / 2, {
            fillColor: '#4a2c17',
            fillOpacity: 0.8,
            strokeColor: '#2d1a0e'
        });
        
        // Add crater label at center
        console.log('Adding crater label at center:', center);
        this.addZoneLabel(center, `Crater Radius: ${this.formatDistance(diameter / 2)}`, 'crater', '#000000');
    }

    visualizeBlastWave(center, results) {
        const blastZones = [
            { radius: results.blastRadius10psi, color: '#cc0000', opacity: 0.7, label: '10 psi overpressure' },
            { radius: results.blastRadius5psi, color: '#ff6600', opacity: 0.6, label: '5 psi overpressure' },
            { radius: results.blastRadius1psi, color: '#ffcc00', opacity: 0.5, label: '1 psi overpressure' }
        ];

        // Sort zones by radius (largest first) and create non-overlapping rings
        const sortedZones = blastZones
            .filter(zone => zone.radius && zone.radius > 0)
            .sort((a, b) => b.radius - a.radius);

        console.log('Adding blast wave zones:', sortedZones.length);
        
        sortedZones.forEach((zone, index) => {
            this.layerManager.addRingLayer(`blast-wave-layer-${index}`, center, zone.radius, {
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                strokeColor: zone.color,
                innerRadius: index < sortedZones.length - 1 ? sortedZones[index + 1].radius : 0
            });
            
            // Add blast wave labels at multiple positions around the circle
            for (let angle = 0; angle < 360; angle += 120) { // 3 labels per zone
                const labelPosition = this.calculateLabelPosition(center, zone.radius, angle);
                console.log(`Adding blast label "${zone.label}" at angle ${angle}:`, labelPosition);
                this.addZoneLabel(labelPosition, zone.label, 'blast', '#000000');
            }
        });
    }

    visualizeThermalRadiation(center, results) {
        // Debug thermal radius values
        console.log('Thermal Radii:', {
            '1st degree': results.thermalRadius1deg,
            '2nd degree': results.thermalRadius2deg, 
            '3rd degree': results.thermalRadius3deg
        });
        
        const thermalZones = [
            { radius: results.thermalRadius1deg, color: '#ffff00', opacity: 0.5, label: '1st degree burns' },
            { radius: results.thermalRadius2deg, color: '#ff8800', opacity: 0.6, label: '2nd degree burns' },
            { radius: results.thermalRadius3deg, color: '#cc3300', opacity: 0.7, label: '3rd degree burns' }
        ];

        // Sort zones by radius (largest first) and create non-overlapping rings
        const sortedZones = thermalZones
            .filter(zone => zone.radius && zone.radius > 0)
            .sort((a, b) => b.radius - a.radius);

        console.log('Adding thermal zones:', sortedZones.length);
        
        sortedZones.forEach((zone, index) => {
            this.layerManager.addRingLayer(`thermal-layer-${index}`, center, zone.radius, {
                fillColor: zone.color,
                fillOpacity: zone.opacity,
                strokeColor: zone.color,
                innerRadius: index < sortedZones.length - 1 ? sortedZones[index + 1].radius : 0
            });
            
            // Add thermal radiation labels at multiple positions
            for (let angle = 45; angle < 360; angle += 90) { // 4 labels per zone, offset from blast labels
                const labelPosition = this.calculateLabelPosition(center, zone.radius, angle);
                console.log(`Adding thermal label "${zone.label}" at angle ${angle}:`, labelPosition);
                this.addZoneLabel(labelPosition, zone.label, 'thermal', '#000000');
            }
        });
    }

    toggleLayer(layerId, enabled) {
        // Handle grouped layers
        if (layerId === 'crater-layer') {
            this.layerManager.toggleLayer('crater-layer', enabled);
        } else if (layerId === 'blastwave-layer') {
            // Toggle all blast wave layers
            for (let i = 0; i < 3; i++) {
                this.layerManager.toggleLayer(`blast-wave-layer-${i}`, enabled);
            }
        } else if (layerId === 'thermal-layer') {
            // Toggle all thermal layers
            for (let i = 0; i < 3; i++) {
                this.layerManager.toggleLayer(`thermal-layer-${i}`, enabled);
            }
        } else if (layerId === 'seismic-layer') {
            // Toggle seismic effects
            console.log('Toggling seismic layer:', enabled, 'Results:', this.currentResults?.seismicSignificant);
            if (this.currentResults?.seismicSignificant) {
                this.seismicLayerManager.toggleSeismicLayers(enabled);
            } else {
                console.warn('No seismic effects available to toggle');
            }
        /* 
        } else if (layerId === 'tsunami-layer') {
            // Toggle tsunami effects - temporarily disabled
            console.log('Toggling tsunami layer:', enabled, 'Results:', this.currentResults?.tsunamiGenerated);
            if (this.currentResults?.tsunamiGenerated) {
                this.tsunamiLayerManager.toggleTsunamiLayers(enabled);
            } else {
                console.warn('No tsunami effects available to toggle');
            }
        */
        } else {
            this.layerManager.toggleLayer(layerId, enabled);
        }
    }

    playAnimation() {
        this.animationState.isPlaying = true;
        this.animationState.isPaused = false;
        
        // Start Phase 2 animations if available
        if (this.isPhase2Available(this.currentResults)) {
            if (this.currentResults.seismicSignificant) {
                const epicenter = { 
                    lat: this.currentResults.impactLocation?.latitude || 0,
                    lng: this.currentResults.impactLocation?.longitude || 0
                };
                this.seismicLayerManager.createShakingAnimation(
                    epicenter, 
                    this.currentResults.seismicZones, 
                    (this.currentResults.seismicDuration || 30) / this.animationState.speed
                );
            }
            
            // Tsunami animation temporarily disabled
            /*
            if (this.currentResults.tsunamiGenerated && this.currentResults.tsunamiPropagation) {
                this.tsunamiLayerManager.animateWavePropagation(
                    this.currentResults.tsunamiPropagation,
                    this.getTsunamiAnimationSpeed()
                );
            }
            */
        }
        
        console.log('Animation started (including Phase 2 effects)');
    }

    pauseAnimation() {
        this.animationState.isPaused = true;
        
        // Pause Phase 2 animations
        this.seismicLayerManager.stopShakingAnimation();
        // this.tsunamiLayerManager.stopWaveAnimation(); // Tsunami temporarily disabled
        
        console.log('Animation paused');
    }

    resetAnimation() {
        this.animationState.isPlaying = false;
        this.animationState.isPaused = false;
        this.animationState.currentTime = 0;
        
        // Reset Phase 2 animations
        this.seismicLayerManager.stopShakingAnimation();
        // this.tsunamiLayerManager.stopWaveAnimation(); // Tsunami temporarily disabled
        
        console.log('Animation reset');
    }

    setAnimationSpeed(speed) {
        this.animationState.speed = speed;
    }

    // Phase 2 helper methods

    /**
     * Show specific timeline layer (single layer display)
     */
    showTimelineLayer(selectedLayer) {
        console.log(`Showing timeline layer: ${selectedLayer}`);
        
        if (!this.currentResults) {
            console.warn('No results available for timeline visualization');
            return;
        }

        // Hide all layers and labels first
        this.hideAllLayers();
        this.clearZoneLabels();

        // Show selected layer(s) with appropriate labels
        switch (selectedLayer) {
            case 'crater':
                this.layerManager.toggleLayer('crater-layer', true);
                this.showZoneLabels('crater');
                break;
                
            case 'blast':
                for (let i = 0; i < 3; i++) {
                    this.layerManager.toggleLayer(`blast-wave-layer-${i}`, true);
                }
                this.showZoneLabels('blast');
                break;
                
            case 'thermal':
                for (let i = 0; i < 3; i++) {
                    this.layerManager.toggleLayer(`thermal-layer-${i}`, true);
                }
                this.showZoneLabels('thermal');
                break;
                
                case 'seismic':
                if (this.currentResults.seismicSignificant) {
                    this.seismicLayerManager.toggleSeismicLayers(true);
                    // Note: Seismic labels are handled by SeismicLayerManager directly
                    console.log('Seismic layer activated - labels managed by SeismicLayerManager');
                }
                break;            case 'all':
                // Show all available layers
                this.showAllLayers();
                this.showAllZoneLabels();
                break;
                
            default:
                console.warn(`Unknown timeline layer: ${selectedLayer}`);
        }
    }

    /**
     * Hide all visualization layers
     */
    hideAllLayers() {
        // Hide Phase 1 layers
        this.layerManager.toggleLayer('crater-layer', false);
        
        for (let i = 0; i < 3; i++) {
            this.layerManager.toggleLayer(`blast-wave-layer-${i}`, false);
            this.layerManager.toggleLayer(`thermal-layer-${i}`, false);
        }
        
        // Hide Phase 2 layers
        if (this.currentResults?.seismicSignificant) {
            this.seismicLayerManager.toggleSeismicLayers(false);
        }
    }

    /**
     * Show all available layers
     */
    showAllLayers() {
        // Show Phase 1 layers
        this.layerManager.toggleLayer('crater-layer', true);
        
        for (let i = 0; i < 3; i++) {
            this.layerManager.toggleLayer(`blast-wave-layer-${i}`, true);
            this.layerManager.toggleLayer(`thermal-layer-${i}`, true);
        }
        
        // Show Phase 2 layers if available
        if (this.currentResults?.seismicSignificant) {
            this.seismicLayerManager.toggleSeismicLayers(true);
        }
    }

    /**
     * Update timeline controls based on available results
     */
    updateTimelineControls(results) {
        // Enable/disable seismic timeline option based on results
        const seismicRadio = document.getElementById('showSeismic');
        const seismicItem = seismicRadio?.closest('.timeline-item');
        
        if (seismicRadio && seismicItem) {
            if (results.seismicSignificant) {
                seismicRadio.disabled = false;
                seismicItem.style.opacity = '1';
                seismicItem.style.pointerEvents = 'auto';
            } else {
                seismicRadio.disabled = true;
                seismicItem.style.opacity = '0.5';
                seismicItem.style.pointerEvents = 'none';
                
                // If seismic was selected but not available, switch to crater
                if (seismicRadio.checked) {
                    document.getElementById('showCrater').checked = true;
                    this.showTimelineLayer('crater');
                }
            }
        }
    }

    /**
     * Add a zone label at specified position
     */
    addZoneLabel(position, text, category, textColor = '#000000') {
        console.log(`Adding zone label: ${text} at`, position, `for category: ${category}`);
        
        try {
            const labelEl = document.createElement('div');
            labelEl.className = 'zone-label';
            labelEl.textContent = text;
            labelEl.style.cssText = `
                background: rgba(255, 255, 255, 0.95);
                color: ${textColor};
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: bold;
                border: 2px solid rgba(0,0,0,0.5);
                box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                white-space: nowrap;
                pointer-events: none;
                z-index: 1000;
                text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
            `;

            // Ensure we have valid coordinates
            const lng = position.lng || position.longitude;
            const lat = position.lat || position.latitude;
            
            if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
                console.error('Invalid coordinates for label:', { lng, lat, position });
                return;
            }

            console.log(`Creating marker at [${lng}, ${lat}]`);
            
            // Check if maplibregl is available
            if (typeof maplibregl === 'undefined') {
                console.error('maplibregl is not available');
                return;
            }

            const marker = new maplibregl.Marker(labelEl)
                .setLngLat([lng, lat])
                .addTo(this.map);

            // Store label for later removal
            if (!this.zoneLabels[category]) {
                this.zoneLabels[category] = [];
            }
            this.zoneLabels[category].push(marker);
            
            console.log(`Successfully added ${category} label: ${text}`);
            
        } catch (error) {
            console.error('Error creating zone label:', error, { position, text, category });
        }
    }

    /**
     * Calculate label position around a circle
     */
    calculateLabelPosition(center, radius, angleDegrees = 0) {
        const angle = (angleDegrees * Math.PI) / 180;
        const offsetDistance = radius * 0.9; // Position at 90% of radius for better visibility
        
        // Convert meters to approximate lat/lng offset
        const latOffset = (offsetDistance * Math.cos(angle)) / 111320; // ~111320 m per degree latitude
        const lngOffset = (offsetDistance * Math.sin(angle)) / (111320 * Math.cos(center.lat * Math.PI / 180));
        
        const position = {
            lat: center.lat + latOffset,
            lng: center.lng + lngOffset
        };
        
        console.log(`Label position calculated: radius=${radius}m, angle=${angleDegrees}°, offset=${offsetDistance}m, position=`, position);
        
        return position;
    }

    /**
     * Show zone labels for a specific category
     */
    showZoneLabels(category) {
        // Labels are already created and stored, just make them visible
        // The labels are automatically visible when created with addZoneLabel
        console.log(`Showing ${category} zone labels:`, this.zoneLabels[category].length);
    }

    /**
     * Show all zone labels
     */
    showAllZoneLabels() {
        Object.keys(this.zoneLabels).forEach(category => {
            this.showZoneLabels(category);
        });
    }

    /**
     * Clear all zone labels for a category
     */
    clearZoneLabels(category = null) {
        if (category) {
            // Clear specific category
            this.zoneLabels[category].forEach(marker => marker.remove());
            this.zoneLabels[category] = [];
        } else {
            // Clear all categories
            Object.keys(this.zoneLabels).forEach(cat => {
                this.zoneLabels[cat].forEach(marker => marker.remove());
                this.zoneLabels[cat] = [];
            });
        }
    }

    /**
     * Format distance for display
     */
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        } else {
            return `${(meters / 1000).toFixed(1)} km`;
        }
    }

    /**
     * Check if Phase 2 effects are available in results
     * (Temporarily only checking seismic - tsunami disabled in UI)
     */
    isPhase2Available(results) {
        return results && results.seismicSignificant;
        // Temporarily disabled: || results.tsunamiGenerated
    }

    /**
     * Check if seismic animation should be enabled
     */
    shouldAnimateSeismic() {
        const animateSeismic = document.getElementById('animateSeismic')?.checked ?? true;
        return animateSeismic && this.animationState.isPlaying;
    }

    /**
     * Check if tsunami animation should be enabled
     */
    shouldAnimateTsunami() {
        const animateTsunami = document.getElementById('animateTsunami')?.checked ?? true;
        return animateTsunami && this.animationState.isPlaying;
    }

    /**
     * Get tsunami animation speed multiplier
     */
    getTsunamiAnimationSpeed() {
        return (this.animationState.speed || 1) * 100; // Base 100x real-time
    }

    /**
     * Enable Phase 2 features
     */
    enablePhase2() {
        this.phase2Enabled = true;
        console.log('Phase 2 features enabled');
    }

    /**
     * Disable Phase 2 features  
     */
    disablePhase2() {
        this.phase2Enabled = false;
        this.seismicLayerManager.clearSeismicLayers();
        this.tsunamiLayerManager.clearTsunamiLayers();
        console.log('Phase 2 features disabled');
    }

    /**
     * Get current visualization statistics
     */
    getVisualizationStats() {
        const stats = {
            phase1: {
                crater: !!this.currentResults?.craterDiameter,
                blastWave: !!this.currentResults?.blastRadius1psi,
                thermal: !!this.currentResults?.thermalRadius1deg
            },
            phase2: {
                seismic: !!this.currentResults?.seismicSignificant,
                tsunami: !!this.currentResults?.tsunamiGenerated
            },
            animation: {
                isPlaying: this.animationState.isPlaying,
                speed: this.animationState.speed,
                duration: this.animationState.duration
            }
        };
        
        return stats;
    }
}