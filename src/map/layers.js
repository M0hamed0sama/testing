/**
 * Layer Manager - Handles map layers and overlays for impact effects
 */

import { EventEmitter } from '../utils/events.js';

class LayerManager extends EventEmitter {
    constructor(map) {
        super();
        this.map = map;
        this.layers = new Map();
        this.sources = new Map();
        this.impactMarker = null;
    }

    init() {
        this.setupBaseLayers();
    }

    setupBaseLayers() {
        // Initialize layer management system
        console.log('Layer manager initialized');
    }

    addImpactMarker(coordinates) {
        // Remove existing marker if any
        if (this.impactMarker) {
            this.impactMarker.remove();
        }

        // Create impact marker
        const el = document.createElement('div');
        el.className = 'impact-marker';
        el.innerHTML = '🎯';
        el.style.cssText = `
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
            animation: pulse 2s ease-in-out infinite;
        `;

        this.impactMarker = new maplibregl.Marker(el)
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(this.map);

        // Add pulse animation CSS if not exists
        if (!document.getElementById('marker-styles')) {
            const style = document.createElement('style');
            style.id = 'marker-styles';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    addCircleLayer(id, center, radius, options = {}) {
        const sourceId = `${id}-source`;
        
        // Validate coordinates
        if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
            console.warn(`Invalid coordinates for layer ${id}:`, center);
            return;
        }
        
        // Validate radius
        if (!radius || radius <= 0) {
            console.warn(`Invalid radius for layer ${id}:`, radius);
            return;
        }
        
        // Create geodesic circle that properly handles Earth's curvature and wrapping
        const circle = this.createWrappingCircle([center.lng, center.lat], radius / 1000);

        // Add source
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: circle
        });

        // Add layer
        this.map.addLayer({
            id: id,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': options.fillColor || '#ff6b35',
                'fill-opacity': options.fillOpacity || 0.3,
                'fill-outline-color': options.strokeColor || '#ff6b35'
            }
        });

        this.sources.set(sourceId, circle);
        this.layers.set(id, { type: 'circle', visible: true });
    }

    addRingLayer(id, center, outerRadius, options = {}) {
        const sourceId = `${id}-source`;
        const innerRadius = options.innerRadius || 0;
        
        // Validate coordinates
        if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
            console.warn(`Invalid coordinates for ring layer ${id}:`, center);
            return;
        }
        
        // Validate radius
        if (!outerRadius || outerRadius <= 0) {
            console.warn(`Invalid outer radius for ring layer ${id}:`, outerRadius);
            return;
        }
        
        // Create ring geometry with proper Earth wrapping
        const outerCircle = this.createWrappingCircle([center.lng, center.lat], outerRadius / 1000);

        let ringGeometry;
        if (innerRadius > 0) {
            const innerCircle = this.createWrappingCircle([center.lng, center.lat], innerRadius / 1000);
            
            // Create ring by subtracting inner circle from outer circle
            try {
                ringGeometry = turf.difference(outerCircle, innerCircle);
                // If difference fails (edge cases), fall back to outer circle
                if (!ringGeometry || !ringGeometry.geometry) {
                    ringGeometry = outerCircle;
                }
            } catch (error) {
                console.warn('Ring difference calculation failed, using outer circle:', error);
                ringGeometry = outerCircle;
            }
        } else {
            // No inner radius, use full circle
            ringGeometry = outerCircle;
        }

        // Add source
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: ringGeometry
        });

        // Add layer
        this.map.addLayer({
            id: id,
            type: 'fill',
            source: sourceId,
            paint: {
                'fill-color': options.fillColor || '#ff6b35',
                'fill-opacity': options.fillOpacity || 0.3,
                'fill-outline-color': options.strokeColor || '#ff6b35'
            }
        });

        this.sources.set(sourceId, ringGeometry);
        this.layers.set(id, { type: 'ring', visible: true });
    }

    addHeatmapLayer(id, data, options = {}) {
        const sourceId = `${id}-source`;

        // Add source
        this.map.addSource(sourceId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: data
            }
        });

        // Add heatmap layer
        this.map.addLayer({
            id: id,
            type: 'heatmap',
            source: sourceId,
            paint: {
                'heatmap-weight': [
                    'interpolate',
                    ['linear'],
                    ['get', 'intensity'],
                    0, 0,
                    6, 1
                ],
                'heatmap-intensity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 1,
                    9, 3
                ],
                'heatmap-color': [
                    'interpolate',
                    ['linear'],
                    ['heatmap-density'],
                    0, 'rgba(33,102,172,0)',
                    0.2, 'rgba(107, 33, 198, 1)',
                    0.4, 'rgb(209,229,240)',
                    0.6, 'rgba(50, 18, 0, 1)',
                    0.8, 'rgba(83, 23, 0, 1)',
                    1, 'rgba(182, 0, 21, 1)'
                ],
                'heatmap-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    0, 2,
                    9, 20
                ],
                'heatmap-opacity': options.opacity || 0.8
            }
        });

        this.sources.set(sourceId, data);
        this.layers.set(id, { type: 'heatmap', visible: true });
    }

    addAnimatedCircle(id, center, maxRadius, duration, options = {}) {
        let currentRadius = 0;
        const steps = 60; // 60 steps for smooth animation
        const radiusStep = maxRadius / steps;
        const timeStep = duration / steps;

        const animate = () => {
            if (currentRadius <= maxRadius) {
                // Remove previous circle
                this.removeLayer(id);
                
                // Add new circle with current radius
                this.addCircleLayer(id, center, currentRadius, {
                    ...options,
                    fillOpacity: (options.fillOpacity || 0.3) * (1 - currentRadius / maxRadius)
                });

                currentRadius += radiusStep;
                setTimeout(animate, timeStep);
            }
        };

        animate();
    }

    toggleLayer(layerId, visible) {
        if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(
                layerId, 
                'visibility', 
                visible ? 'visible' : 'none'
            );
            
            const layer = this.layers.get(layerId);
            if (layer) {
                layer.visible = visible;
            }
        }
    }

    removeLayer(layerId) {
        const sourceId = `${layerId}-source`;
        
        try {
            // Remove layer if it exists
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
            
            // Remove source if it exists
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        } catch (error) {
            // Silently handle errors for non-existent layers
            console.debug(`Layer ${layerId} removal: ${error.message}`);
        }

        // Clean up tracking
        this.layers.delete(layerId);
        this.sources.delete(sourceId);
    }

    clearAllEffectLayers() {
        // Remove crater layer
        this.removeLayer('crater-layer');
        
        // Remove all blast wave layers (indexed)
        for (let i = 0; i < 10; i++) { // Support up to 10 blast zones
            this.removeLayer(`blast-wave-layer-${i}`);
        }
        
        // Remove all thermal layers (indexed)
        for (let i = 0; i < 10; i++) { // Support up to 10 thermal zones
            this.removeLayer(`thermal-layer-${i}`);
        }
        
        // Remove future phase 2/3 layers
        const futureLayers = [
            'seismic-layer',
            'tsunami-layer', 
            'casualties-layer'
        ];
        
        futureLayers.forEach(layerId => {
            this.removeLayer(layerId);
        });
        
        // Also clear any remaining layers that match effect patterns
        Array.from(this.layers.keys()).forEach(layerId => {
            if (layerId.includes('blast-wave-') || 
                layerId.includes('thermal-') || 
                layerId.includes('crater-') ||
                layerId.includes('seismic-') ||
                layerId.includes('tsunami-') ||
                layerId.includes('casualties-')) {
                this.removeLayer(layerId);
            }
        });
    }

    updateLayerOpacity(layerId, opacity) {
        if (this.map.getLayer(layerId)) {
            const layer = this.map.getLayer(layerId);
            
            if (layer.type === 'fill') {
                this.map.setPaintProperty(layerId, 'fill-opacity', opacity);
            } else if (layer.type === 'heatmap') {
                this.map.setPaintProperty(layerId, 'heatmap-opacity', opacity);
            }
        }
    }

    // Method to create elevation contour lines around crater
    addContourLines(center, radius, intervals = 5) {
        // This would require elevation data to create proper contours
        // For now, create concentric circles as approximation
        
        for (let i = 1; i <= intervals; i++) {
            const contourRadius = (radius / intervals) * i;
            const contourId = `contour-${i}`;
            
            const circle = this.createWrappingCircle([center.lng, center.lat], contourRadius / 1000);

            this.map.addSource(`${contourId}-source`, {
                type: 'geojson',
                data: circle
            });

            this.map.addLayer({
                id: contourId,
                type: 'line',
                source: `${contourId}-source`,
                paint: {
                    'line-color': '#8B4513',
                    'line-width': 2,
                    'line-opacity': 0.6
                }
            });
        }
    }

    // Create a geodesic circle that properly wraps around Earth's surface
    createWrappingCircle(center, radiusKm) {
        // Validate inputs
        if (!Array.isArray(center) || center.length !== 2) {
            console.error('Invalid center coordinates for circle:', center);
            throw new Error('Center must be an array of [longitude, latitude]');
        }
        
        const [lng, lat] = center;
        
        // Validate coordinate values
        if (typeof lng !== 'number' || typeof lat !== 'number' || 
            isNaN(lng) || isNaN(lat) || 
            lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            console.error('Invalid coordinate values:', { lng, lat });
            throw new Error('Coordinates must be valid numbers within proper ranges');
        }
        
        // Validate radius
        if (typeof radiusKm !== 'number' || isNaN(radiusKm) || radiusKm <= 0) {
            console.error('Invalid radius for circle:', radiusKm);
            throw new Error('Radius must be a positive number');
        }
        
        // For large circles that might wrap around the Earth, we need special handling
        const earthCircumference = 40075; // km at equator
        const maxRadius = earthCircumference / 4; // Quarter of Earth's circumference
        
        // If radius is very large, cap it to avoid wrapping issues
        const effectiveRadius = Math.min(radiusKm, maxRadius);
        
        // Check if circle crosses the antimeridian (±180° longitude)
        const approximateDegreeRadius = (effectiveRadius / 111.32) / Math.cos(lat * Math.PI / 180);
        const crossesAntimeridian = (lng - approximateDegreeRadius < -180) || (lng + approximateDegreeRadius > 180);
        
        if (crossesAntimeridian || effectiveRadius > 5000) { // 5000km threshold for special handling
            return this.createAntimeridianWrappingCircle(center, effectiveRadius);
        } else {
            // Standard circle for smaller radii
            return turf.circle(center, effectiveRadius, {
                steps: 128, // More steps for smoother circles
                units: 'kilometers'
            });
        }
    }

    // Handle circles that cross the antimeridian (international date line)
    createAntimeridianWrappingCircle(center, radiusKm) {
        const [lng, lat] = center;
        
        try {
            // Create multiple circle segments to handle wrapping
            const segments = [];
            const numSegments = 4; // Create 4 segments for better wrapping
            
            for (let i = 0; i < numSegments; i++) {
                const offsetLng = lng + (i - numSegments/2) * 90; // Distribute segments
                const normalizedLng = ((offsetLng + 180) % 360) - 180; // Normalize to ±180
                
                const segmentCenter = [normalizedLng, lat];
                const segment = turf.circle(segmentCenter, radiusKm, {
                    steps: 64,
                    units: 'kilometers'
                });
                
                segments.push(segment);
            }
            
            // Combine all segments into a single feature collection
            const combinedFeatures = segments.reduce((acc, segment) => {
                if (segment.geometry.type === 'Polygon') {
                    acc.push(segment);
                }
                return acc;
            }, []);
            
            if (combinedFeatures.length > 0) {
                return {
                    type: 'FeatureCollection',
                    features: combinedFeatures
                };
            } else {
                // Fallback to standard circle
                return turf.circle(center, radiusKm, {
                    steps: 128,
                    units: 'kilometers'
                });
            }
        } catch (error) {
            console.warn('Antimeridian wrapping failed, using standard circle:', error);
            // Fallback to standard circle
            return turf.circle(center, radiusKm, {
                steps: 128,
                units: 'kilometers'
            });
        }
    }
}

export { LayerManager };