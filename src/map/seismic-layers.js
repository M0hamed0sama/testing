/**
 * Seismic Layer Manager - Handles seismic effect visualization
 * Phase 2 visualization for earthquake effects
 */

import { EventEmitter } from '../utils/events.js';

export class SeismicLayerManager extends EventEmitter {
    constructor(map, layerManager) {
        super();
        this.map = map;
        this.layerManager = layerManager;
        this.animationId = null;
        this.isAnimating = false;
    }

    /**
     * Add seismic intensity zones to the map
     * @param {Object} seismicData - Seismic calculation results
     */
    addIntensityZones(seismicData) {
        if (!seismicData.significant || !seismicData.zones.length) {
            console.log('No significant seismic effects to display');
            return;
        }

        // Clear existing seismic layers
        this.clearSeismicLayers();

        // Add intensity zones as filled circles (largest first, creating gradient effect)
        const sortedZones = seismicData.zones.sort((a, b) => b.radius - a.radius);
        
        sortedZones.forEach((zone, index) => {
            try {
                // Validate zone data
                if (!zone || !zone.center || 
                    typeof zone.center.latitude !== 'number' || 
                    typeof zone.center.longitude !== 'number' ||
                    !zone.radius || zone.radius <= 0) {
                    console.warn(`Invalid seismic zone at index ${index}:`, zone);
                    return;
                }
                
                const layerId = `seismic-intensity-${zone.intensity}`;
                
                // Convert coordinates to proper {lat, lng} format
                const center = {
                    lat: zone.center.latitude,
                    lng: zone.center.longitude
                };
                
                // Use filled circles to show intensity gradient (strongest at center)
                this.layerManager.addCircleLayer(layerId, center, zone.radius, {
                    fillColor: zone.color,
                    fillOpacity: zone.opacity || 0.6,
                    strokeColor: zone.color,
                    strokeOpacity: 0.8,
                    strokeWidth: 1
                });
                
                console.log(`Added seismic zone MMI ${zone.intensity}: ${zone.radius.toFixed(0)}m radius`);
                
                // Add intensity labels
                this.addIntensityLabel(zone, layerId);
            } catch (error) {
                console.error(`Error creating seismic zone ${index}:`, error);
            }
        });

        // Add epicenter marker
        this.addEpicenterMarker(seismicData.zones[0].center, seismicData.magnitude);

        console.log(`Added ${seismicData.zones.length} seismic intensity zones`);
    }

    /**
     * Create animated seismic wave propagation
     * @param {Object} epicenter - Earthquake epicenter
     * @param {Array} zones - Intensity zones 
     * @param {number} duration - Animation duration in seconds
     */
    createShakingAnimation(epicenter, zones, duration = 30) {
        if (this.isAnimating) {
            this.stopShakingAnimation();
        }

        this.isAnimating = true;
        const startTime = Date.now();
        const waveSpeed = 6000; // 6 km/s seismic wave speed

        const animate = () => {
            if (!this.isAnimating) return;

            const elapsed = (Date.now() - startTime) / 1000; // seconds
            const waveRadius = waveSpeed * elapsed; // meters

            // Remove previous wave circle
            this.layerManager.removeLayer('seismic-wave');

            // Add current wave position if within effect radius
            const maxRadius = Math.max(...zones.map(z => z.radius));
            if (waveRadius < maxRadius && elapsed < duration) {
                // Epicenter should already be in {lat, lng} format
                this.layerManager.addCircleLayer('seismic-wave', epicenter, waveRadius, {
                    fillColor: 'transparent',
                    strokeColor: '#ff0000',
                    strokeWidth: 3,
                    strokeOpacity: Math.max(0.1, 1 - (elapsed / duration))
                });
            }

            // Continue animation
            if (elapsed < duration && waveRadius < maxRadius * 1.5) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.stopShakingAnimation();
            }
        };

        animate();
    }

    /**
     * Stop seismic wave animation
     */
    stopShakingAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.layerManager.removeLayer('seismic-wave');
    }

    /**
     * Visualize earthquake damage zones
     * @param {Object} damageData - Building damage assessment
     */
    visualizeEarthquakeDamage(damageData) {
        damageData.zones.forEach((zone, index) => {
            const layerId = `damage-zone-${index}`;
            
            // Calculate damage level color
            const maxDamage = Math.max(
                ...Object.values(zone.buildings).map(b => b.expectedLoss)
            );
            
            const damageColor = this.getDamageColor(maxDamage);
            
            this.layerManager.addCircleLayer(layerId, zone.center, zone.radius, {
                fillColor: damageColor,
                fillOpacity: 0.3,
                strokeColor: damageColor,
                strokeWidth: 1
            });
        });
    }

    /**
     * Add epicenter marker with magnitude indicator
     */
    addEpicenterMarker(location, magnitude) {
        const el = document.createElement('div');
        el.className = 'seismic-epicenter';
        el.innerHTML = `
            <div class="epicenter-icon">⚡</div>
            <div class="magnitude-label">M${magnitude.toFixed(1)}</div>
        `;
        el.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #ff0000;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: seismicPulse 2s ease-in-out infinite;
        `;

        // Add CSS animation if not exists
        if (!document.getElementById('seismic-styles')) {
            const style = document.createElement('style');
            style.id = 'seismic-styles';
            style.textContent = `
                @keyframes seismicPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                }
                .epicenter-icon { font-size: 24px; }
                .magnitude-label { font-size: 12px; }
            `;
            document.head.appendChild(style);
        }

        if (this.epicenterMarker) {
            this.epicenterMarker.remove();
        }

        this.epicenterMarker = new maplibregl.Marker(el)
            .setLngLat([location.lng || location.longitude, location.lat || location.latitude])
            .addTo(this.map);
    }

    /**
     * Add intensity zone labels
     */
    addIntensityLabel(zone, layerId) {
        const labelId = `${layerId}-label`;
        
        // Calculate label position (at zone edge)
        const labelDistance = zone.radius * 0.8;
        const labelLat = zone.center.latitude + (labelDistance / 111320); // Approximate
        const labelLng = zone.center.longitude;

        const labelEl = document.createElement('div');
        labelEl.className = 'intensity-label';
        labelEl.textContent = `MMI ${zone.intensity} - ${zone.description}`;
        labelEl.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            color: #000000;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid rgba(0,0,0,0.3);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            pointer-events: none;
        `;

        const marker = new maplibregl.Marker(labelEl)
            .setLngLat([labelLng, labelLat])
            .addTo(this.map);

        // Store marker for cleanup
        if (!this.intensityLabels) {
            this.intensityLabels = [];
        }
        this.intensityLabels.push(marker);
    }

    /**
     * Clear all seismic visualization layers
     */
    clearSeismicLayers() {
        // Remove intensity zones
        for (let i = 0; i < 20; i++) { // Support up to 20 zones
            this.layerManager.removeLayer(`seismic-intensity-${i}`);
            this.layerManager.removeLayer(`damage-zone-${i}`);
        }

        // Remove wave animation
        this.layerManager.removeLayer('seismic-wave');

        // Remove epicenter marker
        if (this.epicenterMarker) {
            this.epicenterMarker.remove();
            this.epicenterMarker = null;
        }

        // Remove intensity labels
        if (this.intensityLabels) {
            this.intensityLabels.forEach(marker => marker.remove());
            this.intensityLabels = [];
        }

        this.stopShakingAnimation();
    }

    /**
     * Toggle seismic layer visibility
     */
    toggleSeismicLayers(visible) {
        // Toggle intensity zones
        for (let i = 0; i < 20; i++) {
            this.layerManager.toggleLayer(`seismic-intensity-${i}`, visible);
        }

        // Toggle epicenter marker
        if (this.epicenterMarker) {
            this.epicenterMarker.getElement().style.display = visible ? 'block' : 'none';
        }

        // Toggle labels
        if (this.intensityLabels) {
            this.intensityLabels.forEach(marker => {
                marker.getElement().style.display = visible ? 'block' : 'none';
            });
        }
    }

    /**
     * Get color for damage level visualization
     */
    getDamageColor(damageLevel) {
        if (damageLevel > 0.8) return '#8b0000';      // Dark red - severe
        if (damageLevel > 0.6) return '#dc143c';      // Crimson - major
        if (damageLevel > 0.4) return '#ff4500';      // Orange red - moderate
        if (damageLevel > 0.2) return '#ffa500';      // Orange - minor
        return '#ffff00';                             // Yellow - light
    }

    /**
     * Create seismic visualization data for time-based animation
     */
    createSeismicVisualizationData(seismicResults) {
        if (!seismicResults.significant) return null;

        const { zones, arrivalTimes } = seismicResults;
        const epicenter = zones[0]?.center;
        
        if (!epicenter) return null;

        return {
            epicenter: epicenter,
            magnitude: seismicResults.magnitude,
            zones: zones,
            waveSpeed: 6000, // m/s
            duration: seismicResults.duration,
            arrivalSequence: arrivalTimes.arrivals.map(arrival => ({
                distance: arrival.distance,
                pWaveTime: arrival.waveArrivals.pWave.arrivalTime,
                sWaveTime: arrival.waveArrivals.sWave.arrivalTime,
                surfaceWaveTime: arrival.waveArrivals.surface.arrivalTime,
                intensity: arrival.intensity
            }))
        };
    }
}