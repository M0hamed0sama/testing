/**
 * Terrain Manager - Handles 3D terrain rendering and elevation data
 */

import { EventEmitter } from '../utils/events.js';
import { TERRAIN_CONFIG } from '../utils/constants.js';

class TerrainManager extends EventEmitter {
    constructor(map) {
        super();
        this.map = map;
        this.terrainSource = null;
        this.hillshadeSource = null;
        this.exaggeration = 1;
        this.isTerrainLoaded = false;
    }

    init() {
        this.setupTerrain();
        this.setupControls();
    }

    setupTerrain() {
        // Add free terrain source (Terrarium format)
        this.map.addSource('terrain-rgb', {
            type: 'raster-dem',
            tiles: [
                'https://cloud.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.webp?key=get_your_own_OpIi9ZULNHzrESv6T2vL'
            ],
            tileSize: 512,
            encoding: 'terrarium',
            maxzoom: 15
        });

        // Alternative: AWS Terrain Tiles (free)
        this.map.addSource('terrain-aws', {
            type: 'raster-dem',
            tiles: [
                'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            encoding: 'terrarium',
            maxzoom: 15
        });

        // Set terrain with fallback
        try {
            this.map.setTerrain({ 
                source: 'terrain-aws', 
                exaggeration: this.exaggeration 
            });
            this.terrainSource = 'terrain-aws';
            this.isTerrainLoaded = true;
            this.emit('terrainLoaded', true);
        } catch (error) {
            console.warn('Primary terrain failed, trying alternative:', error);
            try {
                this.map.setTerrain({ 
                    source: 'terrain-rgb', 
                    exaggeration: this.exaggeration 
                });
                this.terrainSource = 'terrain-rgb';
                this.isTerrainLoaded = true;
                this.emit('terrainLoaded', true);
            } catch (secondError) {
                console.warn('All terrain sources failed, using flat map:', secondError);
                this.isTerrainLoaded = false;
                this.emit('terrainLoaded', false);
            }
        }

        // Add hillshade for better depth perception
        this.addHillshade();
    }

    addHillshade() {
        this.map.addSource('hillshade', {
            type: 'raster-dem',
            tiles: [
                'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            encoding: 'terrarium'
        });

        this.map.addLayer({
            id: 'hillshade',
            type: 'hillshade',
            source: 'hillshade',
            layout: { visibility: 'visible' },
            paint: {
                'hillshade-shadow-color': '#473B24',
                'hillshade-highlight-color': '#FBFAF9',
                'hillshade-accent-color': '#F7F4F1',
                'hillshade-exaggeration': 0.8,
                'hillshade-illumination-direction': 315,
                'hillshade-illumination-anchor': 'viewport'
            }
        }, 'osm-raster-layer');
    }

    setupControls() {
        const terrainControl = document.getElementById('terrainExaggeration');
        const terrainValue = document.getElementById('terrainExaggerationValue');

        if (terrainControl) {
            terrainControl.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.setExaggeration(value);
                terrainValue.textContent = `${value}x`;
            });
        }
    }

    setExaggeration(value) {
        this.exaggeration = value;
        
        if (this.isTerrainLoaded && this.terrainSource) {
            try {
                this.map.setTerrain({ 
                    source: this.terrainSource, 
                    exaggeration: value 
                });
                this.emit('terrainChange', value);
            } catch (error) {
                console.warn('Failed to update terrain exaggeration:', error);
            }
        }
    }

    getElevation(coordinates) {
        // Get elevation at specific coordinates
        // This would require elevation data queries
        return new Promise((resolve) => {
            // Placeholder - in real implementation, query elevation data
            const elevation = 0; // Sea level default
            resolve(elevation);
        });
    }

    flyToLocation(coordinates, options = {}) {
        const defaults = {
            center: coordinates,
            zoom: 12,
            pitch: 60,
            bearing: 0,
            duration: 2000
        };

        this.map.flyTo({ ...defaults, ...options });
    }

    // Method to modify terrain for crater visualization
    async modifyTerrain(center, craterRadius, craterDepth) {
        // This would require advanced WebGL techniques to modify terrain mesh
        // For now, we'll use visual overlays instead
        console.log('Terrain modification requested:', { center, craterRadius, craterDepth });
        
        // Emit event for visualization layer to handle
        this.emit('craterVisualization', { center, craterRadius, craterDepth });
    }
}

export { TerrainManager };