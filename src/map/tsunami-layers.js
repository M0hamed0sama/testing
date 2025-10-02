/**
 * Tsunami Layer Manager - Handles tsunami effect visualization
 * Phase 2 visualization for tsunami wave pr            coastalEffects.forEach((effect, index) => {
            if (effect.inundationDistance > 0) {
                const layerId = `inundation-zone-${index}`;
                
                // Create simplified inundation zone (circle for now)
                // Convert coordinates to proper format
                const center = {
                    lat: effect.coordinates.latitude,
                    lng: effect.coordinates.longitude
                };
                this.layerManager.addCircleLayer(layerId, center, effect.inundationDistance, {ion and coastal effects
 */

import { EventEmitter } from '../utils/events.js';

export class TsunamiLayerManager extends EventEmitter {
    constructor(map, layerManager) {
        super();
        this.map = map;
        this.layerManager = layerManager;
        this.animationId = null;
        this.isAnimating = false;
        this.coastalMarkers = [];
    }

    /**
     * Add tsunami wave height zones to the map
     * @param {Object} tsunamiData - Tsunami calculation results
     */
    addWaveHeightZones(tsunamiData) {
        if (!tsunamiData.generated) {
            console.log('No tsunami generated - nothing to visualize');
            return;
        }

        // Clear existing tsunami layers
        this.clearTsunamiLayers();

        const { propagation, coastalEffects } = tsunamiData;
        
        // Add initial wave zone at epicenter
        if (propagation && propagation.initialWave) {
            this.addInitialWaveZone(propagation.epicenter, propagation.initialWave);
        }

        // Add coastal effect markers
        if (coastalEffects && coastalEffects.length > 0) {
            this.addCoastalEffectMarkers(coastalEffects);
        }

        // Add wave height legend
        this.addWaveHeightLegend(tsunamiData.visualization?.colorScale);

        console.log('Added tsunami visualization layers');
    }

    /**
     * Animate tsunami wave propagation across ocean
     * @param {Object} propagationData - Wave propagation sequence
     * @param {number} speedMultiplier - Animation speed multiplier
     */
    animateWavePropagation(propagationData, speedMultiplier = 100) {
        if (!propagationData || !propagationData.waveFronts.length) {
            console.warn('No wave propagation data for animation');
            return;
        }

        if (this.isAnimating) {
            this.stopWaveAnimation();
        }

        this.isAnimating = true;
        const startTime = Date.now();
        const waveFronts = propagationData.waveFronts;
        const animationDuration = (waveFronts[waveFronts.length - 1].time / speedMultiplier) * 1000; // ms
        
        const animate = () => {
            if (!this.isAnimating) return;

            const elapsed = Date.now() - startTime;
            const progress = elapsed / animationDuration;
            
            if (progress >= 1) {
                this.stopWaveAnimation();
                return;
            }

            // Find current wave front
            const currentTime = progress * waveFronts[waveFronts.length - 1].time;
            const currentWave = this.findWaveAtTime(waveFronts, currentTime);
            
            if (currentWave) {
                this.updateWaveVisualization(propagationData.epicenter, currentWave, progress);
            }

            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop wave propagation animation
     */
    stopWaveAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clean up animation layers
        for (let i = 0; i < 10; i++) {
            this.layerManager.removeLayer(`tsunami-wave-${i}`);
        }
    }

    /**
     * Visualize coastal inundation zones
     * @param {Array} coastalEffects - Coastal impact data
     */
    visualizeCoastalInundation(coastalEffects) {
        if (!Array.isArray(coastalEffects)) {
            console.warn('Invalid coastal effects data:', coastalEffects);
            return;
        }
        
        coastalEffects.forEach((effect, index) => {
            try {
                // Validate effect data
                if (!effect || !effect.coordinates || 
                    typeof effect.coordinates.latitude !== 'number' || 
                    typeof effect.coordinates.longitude !== 'number' ||
                    !effect.inundationDistance || effect.inundationDistance <= 0) {
                    console.warn(`Invalid coastal effect at index ${index}:`, effect);
                    return;
                }
                
                const layerId = `inundation-zone-${index}`;
                
                // Create simplified inundation zone (circle for now)
                // Convert coordinates to proper {lat, lng} format for LayerManager
                const center = {
                    lat: effect.coordinates.latitude,
                    lng: effect.coordinates.longitude
                };
                
                this.layerManager.addCircleLayer(layerId, center, effect.inundationDistance, {
                    fillColor: this.getInundationColor(effect.runUpHeight || 0),
                    fillOpacity: 0.5,
                    strokeColor: '#0066cc',
                    strokeWidth: 2,
                    strokeOpacity: 0.8
                });

                // Add inundation label
                this.addInundationLabel(effect, index);
                
            } catch (error) {
                console.error(`Error creating inundation zone ${index}:`, error);
            }
        });
    }

    /**
     * Show tsunami arrival time isochrones (lines of equal arrival time)
     * @param {Array} arrivalTimes - Tsunami arrival time data
     */
    showArrivalTimeIsochrones(arrivalTimes) {
        const epicenter = arrivalTimes.length > 0 ? 
            { latitude: 0, longitude: 0 } : // Would calculate from actual epicenter
            null;

        if (!epicenter) return;

        // Create isochrones for different arrival times (1h, 2h, 4h, 8h intervals)
        const isochroneTimes = [3600, 7200, 14400, 28800]; // seconds
        
        isochroneTimes.forEach((time, index) => {
            const radiusKm = this.calculateWaveDistance(time, 200); // 200 m/s average speed
            const layerId = `isochrone-${index}`;
            
            this.layerManager.addCircleLayer(layerId, epicenter, radiusKm * 1000, {
                fillColor: 'transparent',
                strokeColor: '#0099ff',
                strokeWidth: 2,
                strokeOpacity: 0.6,
                strokeDashArray: [5, 5]
            });

            // Add time label
            this.addIsochroneLabel(epicenter, radiusKm * 1000, this.formatTime(time));
        });
    }

    /**
     * Add initial wave zone at tsunami source
     */
    addInitialWaveZone(epicenter, initialWave) {
        const sourceRadius = Math.max(initialWave.wavelength / 4, 5000); // Minimum 5km
        
        // Convert epicenter to proper format
        const center = { lat: epicenter.latitude, lng: epicenter.longitude };
        
        this.layerManager.addCircleLayer('tsunami-source', center, sourceRadius, {
            fillColor: '#ff0000',
            fillOpacity: 0.6,
            strokeColor: '#cc0000',
            strokeWidth: 3,
            strokeOpacity: 0.8
        });

        // Add source marker
        this.addTsunamiSourceMarker(epicenter, initialWave.height);
    }

    /**
     * Add coastal effect markers showing wave heights and arrival times
     */
    addCoastalEffectMarkers(coastalEffects) {
        coastalEffects.forEach((effect, index) => {
            const el = document.createElement('div');
            el.className = 'tsunami-coastal-marker';
            
            const hazardIcon = this.getHazardIcon(effect.hazardLevel);
            const arrivalTime = this.formatTime(effect.arrivalTime);
            
            el.innerHTML = `
                <div class="tsunami-icon">${hazardIcon}</div>
                <div class="tsunami-info">
                    <div class="location-name">${effect.location}</div>
                    <div class="wave-height">${effect.waveHeight.toFixed(1)}m</div>
                    <div class="arrival-time">${arrivalTime}</div>
                </div>
            `;
            
            el.style.cssText = `
                display: flex;
                align-items: center;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid ${this.getHazardColor(effect.hazardLevel)};
                min-width: 120px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            `;

            const marker = new maplibregl.Marker(el)
                .setLngLat([effect.coordinates.longitude || 0, effect.coordinates.latitude || 0])
                .addTo(this.map);

            this.coastalMarkers.push(marker);
        });
    }

    /**
     * Update wave visualization during animation
     */
    updateWaveVisualization(epicenter, currentWave, progress) {
        // Remove previous wave
        this.layerManager.removeLayer('tsunami-wave-current');
        
        // Add current wave front
        if (currentWave.radius > 0 && currentWave.height > 0.01) {
            // Convert epicenter to proper format
            const center = { lat: epicenter.latitude, lng: epicenter.longitude };
            
            this.layerManager.addCircleLayer('tsunami-wave-current', center, currentWave.radius, {
                fillColor: 'transparent',
                strokeColor: this.getWaveHeightColor(currentWave.height),
                strokeWidth: Math.max(2, 6 * (1 - progress)), // Fade over time
                strokeOpacity: Math.max(0.3, 1 - progress)
            });
        }
    }

    /**
     * Add tsunami source marker
     */
    addTsunamiSourceMarker(location, waveHeight) {
        const el = document.createElement('div');
        el.className = 'tsunami-source-marker';
        el.innerHTML = `
            <div class="source-icon">🌊</div>
            <div class="wave-height-label">${waveHeight.toFixed(1)}m</div>
        `;
        el.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #0066cc;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            animation: tsunamiPulse 3s ease-in-out infinite;
        `;

        // Add CSS animation
        if (!document.getElementById('tsunami-styles')) {
            const style = document.createElement('style');
            style.id = 'tsunami-styles';
            style.textContent = `
                @keyframes tsunamiPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                .source-icon { font-size: 28px; }
                .wave-height-label { font-size: 12px; }
            `;
            document.head.appendChild(style);
        }

        if (this.sourceMarker) {
            this.sourceMarker.remove();
        }

        this.sourceMarker = new maplibregl.Marker(el)
            .setLngLat([location.longitude || location.lng, location.latitude || location.lat])
            .addTo(this.map);
    }

    /**
     * Add wave height legend to map
     */
    addWaveHeightLegend(colorScale) {
        if (!colorScale) return;

        const legendEl = document.createElement('div');
        legendEl.className = 'tsunami-legend';
        legendEl.innerHTML = `
            <div class="legend-title">Tsunami Wave Height</div>
            ${Object.entries(colorScale).map(([height, color]) => `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${color}"></div>
                    <div class="legend-text">${height}m</div>
                </div>
            `).join('')}
        `;
        
        legendEl.style.cssText = `
            position: absolute;
            bottom: 100px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 200;
        `;

        // Add legend styles
        const style = document.createElement('style');
        style.textContent = `
            .tsunami-legend .legend-title { 
                font-weight: bold; 
                margin-bottom: 8px; 
                text-align: center;
            }
            .tsunami-legend .legend-item { 
                display: flex; 
                align-items: center; 
                margin-bottom: 4px; 
            }
            .tsunami-legend .legend-color { 
                width: 16px; 
                height: 16px; 
                margin-right: 8px; 
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(legendEl);
        this.legendElement = legendEl;
    }

    /**
     * Clear all tsunami visualization layers
     */
    clearTsunamiLayers() {
        // Remove wave layers
        this.layerManager.removeLayer('tsunami-source');
        this.layerManager.removeLayer('tsunami-wave-current');
        
        // Remove animation waves
        for (let i = 0; i < 10; i++) {
            this.layerManager.removeLayer(`tsunami-wave-${i}`);
        }

        // Remove isochrones
        for (let i = 0; i < 10; i++) {
            this.layerManager.removeLayer(`isochrone-${i}`);
        }

        // Remove inundation zones
        for (let i = 0; i < 50; i++) {
            this.layerManager.removeLayer(`inundation-zone-${i}`);
        }

        // Remove source marker
        if (this.sourceMarker) {
            this.sourceMarker.remove();
            this.sourceMarker = null;
        }

        // Remove coastal markers
        this.coastalMarkers.forEach(marker => marker.remove());
        this.coastalMarkers = [];

        // Remove legend
        if (this.legendElement) {
            this.legendElement.remove();
            this.legendElement = null;
        }

        this.stopWaveAnimation();
    }

    /**
     * Toggle tsunami layer visibility
     */
    toggleTsunamiLayers(visible) {
        // Toggle source
        this.layerManager.toggleLayer('tsunami-source', visible);
        
        // Toggle current wave
        this.layerManager.toggleLayer('tsunami-wave-current', visible);
        
        // Toggle isochrones
        for (let i = 0; i < 10; i++) {
            this.layerManager.toggleLayer(`isochrone-${i}`, visible);
        }

        // Toggle inundation zones
        for (let i = 0; i < 50; i++) {
            this.layerManager.toggleLayer(`inundation-zone-${i}`, visible);
        }

        // Toggle markers
        if (this.sourceMarker) {
            this.sourceMarker.getElement().style.display = visible ? 'block' : 'none';
        }

        this.coastalMarkers.forEach(marker => {
            marker.getElement().style.display = visible ? 'block' : 'none';
        });

        // Toggle legend
        if (this.legendElement) {
            this.legendElement.style.display = visible ? 'block' : 'none';
        }
    }

    // Helper methods

    findWaveAtTime(waveFronts, targetTime) {
        // Find the wave front closest to the target time
        let closest = waveFronts[0];
        let minDiff = Math.abs(waveFronts[0].time - targetTime);
        
        for (const wave of waveFronts) {
            const diff = Math.abs(wave.time - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closest = wave;
            }
        }
        
        return closest;
    }

    calculateWaveDistance(time, speed) {
        return (speed * time) / 1000; // Convert to km
    }

    getHazardIcon(hazardLevel) {
        const icons = {
            'extreme': '🔴',
            'high': '🟠', 
            'moderate': '🟡',
            'low': '🟢',
            'minimal': '⚪'
        };
        return icons[hazardLevel] || '⚪';
    }

    getHazardColor(hazardLevel) {
        const colors = {
            'extreme': '#8b0000',
            'high': '#ff4500',
            'moderate': '#ffa500', 
            'low': '#ffff00',
            'minimal': '#ffffff'
        };
        return colors[hazardLevel] || '#ffffff';
    }

    getWaveHeightColor(height) {
        if (height > 10) return '#8b0000';     // Dark red - extreme
        if (height > 5) return '#dc143c';      // Crimson - high
        if (height > 2) return '#ff4500';      // Orange red - moderate
        if (height > 1) return '#ffa500';      // Orange - low
        if (height > 0.5) return '#ffff00';    // Yellow - minimal
        return '#00ffff';                      // Cyan - very small
    }

    getInundationColor(runUpHeight) {
        if (runUpHeight > 10) return '#000080'; // Navy - extreme inundation
        if (runUpHeight > 5) return '#0000ff';  // Blue - high inundation
        if (runUpHeight > 2) return '#4169e1';  // Royal blue - moderate
        return '#87ceeb';                        // Sky blue - low inundation
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    addInundationLabel(effect, index) {
        // Add label for inundation zone
        const labelEl = document.createElement('div');
        labelEl.textContent = `${effect.runUpHeight.toFixed(1)}m run-up`;
        labelEl.style.cssText = `
            background: rgba(0,0,255,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        `;

        const marker = new maplibregl.Marker(labelEl)
            .setLngLat([effect.coordinates.longitude || 0, effect.coordinates.latitude || 0])
            .addTo(this.map);

        this.coastalMarkers.push(marker);
    }

    addIsochroneLabel(center, radius, timeText) {
        // Add label for isochrone lines
        const labelLat = center.latitude + (radius / 111320); // Approximate offset
        const labelEl = document.createElement('div');
        labelEl.textContent = timeText;
        labelEl.style.cssText = `
            background: rgba(0,153,255,0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        `;

        const marker = new maplibregl.Marker(labelEl)
            .setLngLat([center.longitude, labelLat])
            .addTo(this.map);

        this.coastalMarkers.push(marker);
    }
}