/**
 * UI Controls Manager - Handles all user interface controls and interactions
 */

import { EventEmitter } from '../utils/events.js';

export class UIController extends EventEmitter {
    constructor() {
        super();
        this.controls = new Map();
        this.isInitialized = false;
    }

    init() {
        this.setupControls();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    setupControls() {
        // Asteroid parameter controls
        this.controls.set('diameter', document.getElementById('diameter'));
        this.controls.set('velocity', document.getElementById('velocity'));
        this.controls.set('angle', document.getElementById('angle'));
        this.controls.set('composition', document.getElementById('composition'));
        this.controls.set('density', document.getElementById('density'));
        
        // Location controls
        this.controls.set('latitude', document.getElementById('latitude'));
        this.controls.set('longitude', document.getElementById('longitude'));
        
        // Action buttons
        this.controls.set('simulate', document.getElementById('simulateBtn'));
        this.controls.set('selectOnMap', document.getElementById('selectOnMap'));
        this.controls.set('newSimulation', document.getElementById('newSimulationBtn'));
        
        // Timeline radio buttons
        this.controls.set('crater', document.getElementById('showCrater'));
        this.controls.set('blast', document.getElementById('showBlastWave'));
        this.controls.set('thermal', document.getElementById('showThermal'));
        this.controls.set('seismic', document.getElementById('showSeismic'));
        this.controls.set('all', document.getElementById('showAll'));
        // Tsunami controls temporarily disabled - keeping code for later
        // this.controls.set('tsunami', document.getElementById('showTsunami'));
        
        // Animation controls
        this.controls.set('animationSpeed', document.getElementById('animationSpeed'));
        this.controls.set('playAnimation', document.getElementById('playAnimation'));
        this.controls.set('pauseAnimation', document.getElementById('pauseAnimation'));
        this.controls.set('resetAnimation', document.getElementById('resetAnimation'));
    }

    setupEventListeners() {
        // Range input listeners
        ['diameter', 'velocity', 'angle', 'animationSpeed'].forEach(controlName => {
            const control = this.controls.get(controlName);
            const valueDisplay = document.getElementById(`${controlName}Value`);
            
            if (control && valueDisplay) {
                control.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.updateValueDisplay(controlName, value, valueDisplay);
                    this.emit('parameterChange', { [controlName]: value });
                });
            }
        });

        // Composition dropdown
        const composition = this.controls.get('composition');
        if (composition) {
            composition.addEventListener('change', (e) => {
                const value = e.target.value;
                this.handleCompositionChange(value);
                this.emit('parameterChange', { composition: value });
            });
        }

        // Custom density input
        const density = this.controls.get('density');
        if (density) {
            density.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.emit('parameterChange', { density: value });
            });
        }

        // Location inputs
        ['latitude', 'longitude'].forEach(controlName => {
            const control = this.controls.get(controlName);
            if (control) {
                control.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.emit('parameterChange', { [controlName]: value });
                });
            }
        });

        // Action buttons
        const simulateBtn = this.controls.get('simulate');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                this.emit('simulate', this.getCurrentParameters());
            });
        }

        const selectOnMapBtn = this.controls.get('selectOnMap');
        if (selectOnMapBtn) {
            selectOnMapBtn.addEventListener('click', () => {
                this.emit('selectOnMap');
            });
        }

        // New Simulation button
        const newSimulationBtn = this.controls.get('newSimulation');
        if (newSimulationBtn) {
            newSimulationBtn.addEventListener('click', () => {
                this.emit('newSimulation');
            });
        }

        // Layer toggles (Phase 1 & 2)
        const layerMappings = {
            'crater': 'crater-layer',
            'blast': 'blastwave-layer', 
            'thermal': 'thermal-layer',
            'seismic': 'seismic-layer',
            'all': 'all-layers'
            // 'tsunami': 'tsunami-layer' // Temporarily disabled - keeping code for later
        };

        // Radio button event listener for single layer selection
        const radioButtons = document.querySelectorAll('input[name="visualizationLayer"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const selectedLayer = e.target.value;
                    console.log(`Timeline selection changed: ${selectedLayer}`);
                    this.emit('timelineSelection', selectedLayer);
                }
            });
        });
        
        // Keep individual control references for backward compatibility
        Object.entries(layerMappings).forEach(([controlName, layerId]) => {
            // No individual event listeners needed - handled by radio group
        });

        // Phase 2 enable/disable toggle
        const phase2Toggle = document.getElementById('enablePhase2');
        if (phase2Toggle) {
            phase2Toggle.addEventListener('change', (e) => {
                this.emit('phase2Toggle', e.target.checked);
            });
        }

        // Animation controls
        const playBtn = this.controls.get('playAnimation');
        const pauseBtn = this.controls.get('pauseAnimation');
        const resetBtn = this.controls.get('resetAnimation');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.emit('animationControl', 'play'));
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.emit('animationControl', 'pause'));
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.emit('animationControl', 'reset'));
        }

        // Preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.getAttribute('data-preset');
                this.emit('presetLoad', preset);
            });
        });
    }

    updateValueDisplay(controlName, value, display) {
        switch (controlName) {
            case 'diameter':
                display.textContent = `${value} m`;
                break;
            case 'velocity':
                display.textContent = `${value} km/s`;
                break;
            case 'angle':
                display.textContent = `${value}°`;
                break;
            case 'animationSpeed':
                display.textContent = `${value}x`;
                break;
            default:
                display.textContent = value.toString();
        }
    }

    handleCompositionChange(composition) {
        const customDensityGroup = document.getElementById('customDensityGroup');
        const densityControl = this.controls.get('density');
        
        if (composition === 'custom') {
            customDensityGroup.style.display = 'block';
        } else {
            customDensityGroup.style.display = 'none';
            
            // Update density based on composition
            const densities = {
                'rock': 2700,
                'iron': 7800,
                'ice': 917
            };
            
            if (densityControl && densities[composition]) {
                densityControl.value = densities[composition];
                this.emit('parameterChange', { density: densities[composition] });
            }
        }
    }

    getCurrentParameters() {
        const params = {};
        
        // Get values from all controls
        ['diameter', 'velocity', 'angle'].forEach(name => {
            const control = this.controls.get(name);
            if (control) {
                params[name] = parseFloat(control.value);
            }
        });
        
        ['latitude', 'longitude', 'density'].forEach(name => {
            const control = this.controls.get(name);
            if (control) {
                params[name] = parseFloat(control.value);
            }
        });
        
        const composition = this.controls.get('composition');
        if (composition) {
            params.composition = composition.value;
        }
        
        return params;
    }

    loadParameters(parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
            const control = this.controls.get(key);
            if (control) {
                control.value = value;
                
                // Update display for range inputs
                const valueDisplay = document.getElementById(`${key}Value`);
                if (valueDisplay) {
                    this.updateValueDisplay(key, value, valueDisplay);
                }
                
                // Handle composition change
                if (key === 'composition') {
                    this.handleCompositionChange(value);
                }
            }
        });
    }

    setCoordinates(lat, lng) {
        const latControl = this.controls.get('latitude');
        const lngControl = this.controls.get('longitude');
        
        if (latControl) latControl.value = lat.toFixed(4);
        if (lngControl) lngControl.value = lng.toFixed(4);
    }

    setSimulationEnabled(enabled) {
        const simulateBtn = this.controls.get('simulate');
        if (simulateBtn) {
            simulateBtn.disabled = !enabled;
        }
    }
}