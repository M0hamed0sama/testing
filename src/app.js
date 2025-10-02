/**
 * Asteroid Impact Simulator - Main Application
 * 
 * This is the main entry point for the asteroid impact simulator.
 * It initializes the 3D map, sets up the UI controls, and coordinates
 * all the different simulation modules.
 */

import { TerrainManager } from './map/terrain.js';
import { LayerManager } from './map/layers.js';
import { UIController } from './ui/controls.js';
import { DisplayManager } from './ui/display.js';
import { VisualizationManager } from './ui/visualization.js';
import { ImpactCalculator } from './physics/impact.js';
import { SimulationState } from './utils/state.js';

class AsteroidImpactSimulator {
    constructor() {
        this.map = null;
        this.terrainManager = null;
        this.layerManager = null;
        this.uiController = null;
        this.displayManager = null;
        this.visualizationManager = null;
        this.impactCalculator = null;
        this.simulationState = new SimulationState();
        
        this.currentPhase = 2; // Enable Phase 2 by default
        this.isMapSelecting = false;
        this.animationId = null;
        this.phase2Enabled = true;
    }

    async init() {
        try {
            await this.initializeMap();
            this.initializeManagers();
            this.setupEventListeners();
            this.updatePhaseIndicator();
            
            console.log('Asteroid Impact Simulator initialized successfully');
        } catch (error) {
            console.error('Failed to initialize simulator:', error);
            this.displayManager.showError('Failed to initialize the simulator. Please refresh the page.');
        }
    }

    async initializeMap() {
        // Initialize MapLibre GL map with 3D terrain capabilities
        this.map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'osm-raster': {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors'
                    }
                },
                layers: [
                    {
                        id: 'osm-raster-layer',
                        type: 'raster',
                        source: 'osm-raster'
                    }
                ]
            },
            center: [-74.0060, 40.7128], // New York City
            zoom: 8,
            pitch: 45,
            bearing: 0,
            antialias: true,
            maxZoom: 18,
            minZoom: 2
        });

        // Wait for map to load
        await new Promise((resolve) => {
            this.map.on('load', resolve);
        });

        // Add navigation controls
        this.map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
        this.map.addControl(new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');
    }

    initializeManagers() {
        // Initialize all manager classes
        this.terrainManager = new TerrainManager(this.map);
        this.layerManager = new LayerManager(this.map);
        this.uiController = new UIController();
        this.displayManager = new DisplayManager();
        this.visualizationManager = new VisualizationManager(this.map, this.layerManager);
        this.impactCalculator = new ImpactCalculator();

        // Initialize managers
        this.terrainManager.init();
        this.layerManager.init();
        this.uiController.init();
        this.displayManager.init();
    }

    setupEventListeners() {
        // UI Control Events
        this.uiController.on('parameterChange', (data) => {
            this.simulationState.updateParameters(data);
        });

        this.uiController.on('simulate', (parameters) => {
            this.runSimulation(parameters);
        });

        this.uiController.on('selectOnMap', () => {
            this.enableMapSelection();
        });

        this.uiController.on('presetLoad', (preset) => {
            this.loadPreset(preset);
        });

        this.uiController.on('layerToggle', (layer, enabled) => {
            this.visualizationManager.toggleLayer(layer, enabled);
        });

        this.uiController.on('timelineSelection', (selectedLayer) => {
            this.visualizationManager.showTimelineLayer(selectedLayer);
        });

        this.uiController.on('phase2Toggle', (enabled) => {
            this.togglePhase2Features(enabled);
        });

        this.uiController.on('animationControl', (action) => {
            this.handleAnimationControl(action);
        });

        this.uiController.on('newSimulation', () => {
            this.startNewSimulation();
        });

        // Map Events
        this.map.on('click', (e) => {
            if (this.isMapSelecting) {
                this.selectImpactLocation(e.lngLat);
            }
        });

        this.map.on('mousemove', (e) => {
            if (this.isMapSelecting) {
                this.updateCursor(e.lngLat);
            }
        });

        // Terrain Events
        this.terrainManager.on('terrainChange', (exaggeration) => {
            this.displayManager.updateTerrainStatus(exaggeration);
        });

        // Window Events
        window.addEventListener('resize', () => {
            this.map.resize();
        });
    }

    startNewSimulation() {
        // Clear existing layers
        this.layerManager.clearAllEffectLayers();
        this.visualizationManager.seismicLayerManager.clearSeismicLayers();
        
        // Switch back to input mode
        this.displayManager.switchToInputMode();
        
        // Reset status
        this.displayManager.updateStatus('Ready');
        
        console.log('Started new simulation');
    }

    async runSimulation(parameters) {
        try {
            this.displayManager.showLoading(true);
            this.displayManager.updateStatus('Calculating impact effects...');

            // Phase 1: Basic calculations (crater, blast wave, thermal)
            const results = await this.impactCalculator.calculateImpact(parameters);
            
            // Check atmospheric survival
            if (!results.survivesAtmosphere) {
                this.displayManager.updateStatus('Asteroid disintegrates in atmosphere');
                this.displayManager.showResults({
                    survivesAtmosphere: false,
                    airburstAltitude: results.airburstAltitude,
                    airburstEnergy: results.airburstEnergy
                });
                this.displayManager.showLoading(false);
                return;
            }

            // Update simulation state
            this.simulationState.setResults(results);

            // Visualize effects on map
            await this.visualizationManager.visualizeEffects(results, parameters);

            // Display results
            this.displayManager.showResults(results);
            this.displayManager.updateStatus('Simulation complete');
            
            console.log('Simulation results:', results);
            console.log('Phase 2 Status:', {
                seismicSignificant: results.seismicSignificant,
                seismicZones: results.seismicZones?.length || 0,
                tsunamiGenerated: results.tsunamiGenerated,
                tsunamiCoastalEffects: results.tsunamiCoastalEffects?.length || 0
            });

        } catch (error) {
            console.error('Simulation failed:', error);
            this.displayManager.showError('Simulation failed. Please check your parameters.');
        } finally {
            this.displayManager.showLoading(false);
        }
    }

    enableMapSelection() {
        this.isMapSelecting = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        this.displayManager.updateStatus('Click on the map to select impact location');
    }

    selectImpactLocation(lngLat) {
        this.isMapSelecting = false;
        this.map.getCanvas().style.cursor = '';
        
        // Update UI with selected coordinates
        this.uiController.setCoordinates(lngLat.lat, lngLat.lng);
        
        // Add marker to map
        this.layerManager.addImpactMarker(lngLat);
        
        // Fly to selected location
        this.map.flyTo({
            center: [lngLat.lng, lngLat.lat],
            zoom: 10,
            pitch: 60,
            duration: 2000
        });

        this.displayManager.updateStatus('Impact location selected');
    }

    updateCursor(lngLat) {
        // Could show coordinates in real-time
        const coords = `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`;
        this.displayManager.updateStatus(`Coordinates: ${coords}`);
    }

    loadPreset(presetName) {
        const presets = {
            tunguska: {
                diameter: 60,
                velocity: 27,
                angle: 30,
                composition: 'rock',
                latitude: 60.8858,
                longitude: 101.8942
            },
            chelyabinsk: {
                diameter: 20,
                velocity: 19,
                angle: 18,
                composition: 'rock',
                latitude: 55.1540,
                longitude: 61.4291
            },
            chicxulub: {
                diameter: 10000,
                velocity: 20,
                angle: 45,
                composition: 'rock',
                latitude: 21.4,
                longitude: -89.5167
            }
        };

        const preset = presets[presetName];
        if (preset) {
            this.uiController.loadParameters(preset);
            this.selectImpactLocation({ lat: preset.latitude, lng: preset.longitude });
            this.displayManager.updateStatus(`Loaded ${presetName} preset`);
        }
    }

    handleAnimationControl(action) {
        switch (action) {
            case 'play':
                this.visualizationManager.playAnimation();
                break;
            case 'pause':
                this.visualizationManager.pauseAnimation();
                break;
            case 'reset':
                this.visualizationManager.resetAnimation();
                break;
        }
    }

    updatePhaseIndicator() {
        const indicator = document.getElementById('phaseIndicator');
        indicator.textContent = `Phase ${this.currentPhase}`;
        
        // Update available features based on phase
        const phase2Elements = document.querySelectorAll('.phase-2 input');
        const phase3Elements = document.querySelectorAll('.phase-3 input');
        
        phase2Elements.forEach(el => el.disabled = this.currentPhase < 2);
        phase3Elements.forEach(el => el.disabled = this.currentPhase < 3);
        
        // Enable Phase 2 visualizations if available
        if (this.currentPhase >= 2) {
            this.visualizationManager.enablePhase2();
            // Store Phase 2 state
            localStorage.setItem('phase2Enabled', 'true');
        }
    }

    /**
     * Toggle Phase 2 features on/off
     */
    togglePhase2Features(enabled) {
        this.phase2Enabled = enabled;
        
        if (enabled) {
            this.currentPhase = Math.max(this.currentPhase, 2);
            this.visualizationManager.enablePhase2();
            console.log('Phase 2 features enabled: Seismic and Tsunami effects');
        } else {
            this.visualizationManager.disablePhase2();
            console.log('Phase 2 features disabled');
        }
        
        this.updatePhaseIndicator();
        localStorage.setItem('phase2Enabled', enabled.toString());
    }

    /**
     * Method to advance to next phase (for future development)
     */
    advancePhase() {
        if (this.currentPhase < 3) {
            this.currentPhase++;
            this.updatePhaseIndicator();
            console.log(`Advanced to Phase ${this.currentPhase}`);
        }
    }

    /**
     * Get comprehensive simulation statistics
     */
    getSimulationStats() {
        const results = this.simulationState.getResults();
        const visualStats = this.visualizationManager.getVisualizationStats();
        
        return {
            phase: this.currentPhase,
            results: results,
            visualization: visualStats,
            phase2Enabled: this.phase2Enabled
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new AsteroidImpactSimulator();
    simulator.init();
    
    // Make simulator globally available for debugging
    window.asteroidSimulator = simulator;
});

export { AsteroidImpactSimulator };