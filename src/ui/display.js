/**
 * Display Manager - Handles status updates, results display, and UI feedback
 */

export class DisplayManager {
    constructor() {
        this.statusPanel = null;
        this.resultsPanel = null;
        this.loadingOverlay = null;
    }

    init() {
        this.statusPanel = document.getElementById('statusPanel');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    updateStatus(message, type = 'info') {
        const statusValue = document.getElementById('simulationStatus');
        if (statusValue) {
            statusValue.textContent = message;
            statusValue.className = `status-value ${type}`;
        }
    }

    showLoading(show) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Switch between input mode and results mode
     */
    switchToResultsMode(results) {
        const inputMode = document.getElementById('inputMode');
        const resultsMode = document.getElementById('resultsMode');
        
        if (inputMode && resultsMode) {
            // Smooth transition
            inputMode.style.opacity = '0';
            setTimeout(() => {
                inputMode.style.display = 'none';
                resultsMode.style.display = 'block';
                setTimeout(() => {
                    resultsMode.style.opacity = '1';
                }, 10);
            }, 200);
            
            // Populate results
            this.populateResults(results);
        }
    }

    switchToInputMode() {
        const inputMode = document.getElementById('inputMode');
        const resultsMode = document.getElementById('resultsMode');
        
        if (inputMode && resultsMode) {
            // Smooth transition
            resultsMode.style.opacity = '0';
            setTimeout(() => {
                resultsMode.style.display = 'none';
                inputMode.style.display = 'block';
                setTimeout(() => {
                    inputMode.style.opacity = '1';
                }, 10);
            }, 200);
        }
    }

    /**
     * Populate results in the new results panel layout
     */
    populateResults(results) {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;

        resultsContent.innerHTML = '';

        // Create result sections
        const sections = [
            {
                title: 'Impact Parameters',
                items: [
                    { label: 'Asteroid Diameter', value: this.formatDistance(results.diameter) },
                    { label: 'Impact Velocity', value: `${results.velocity} km/s` },
                    { label: 'Impact Angle', value: `${results.angle}°` },
                    { label: 'Impact Energy', value: this.formatEnergy(results.kineticEnergy) }
                ]
            },
            {
                title: 'Crater Effects',
                items: [
                    { label: 'Crater Diameter', value: this.formatDistance(results.craterDiameter) },
                    { label: 'Crater Depth', value: this.formatDistance(results.craterDepth) },
                    { label: 'Rim Height', value: this.formatDistance(results.rimHeight) },
                    { label: 'Ejecta Range', value: this.formatDistance(results.ejectaRange) }
                ]
            },
            {
                title: 'Blast & Thermal Effects',
                items: [
                    { label: 'Blast Radius (1 psi)', value: this.formatDistance(results.blastRadius1psi), description: 'Glass breakage' },
                    { label: 'Blast Radius (5 psi)', value: this.formatDistance(results.blastRadius5psi), description: 'Building damage' },
                    { label: 'Thermal Radius (1st deg.)', value: this.formatDistance(results.thermalRadius1deg), description: 'Light burns' },
                    { label: 'Thermal Radius (2nd deg.)', value: this.formatDistance(results.thermalRadius2deg), description: 'Second-degree burns' }
                ]
            }
        ];

        // Add seismic section if available
        if (results.seismicSignificant) {
            sections.push({
                title: 'Seismic Effects',
                items: [
                    { label: 'Earthquake Magnitude', value: `M ${results.seismicMagnitude.toFixed(1)}` },
                    { label: 'Seismic Radius', value: this.formatDistance(results.seismicRadius) },
                    { label: 'Intensity Zones', value: `${results.seismicZones?.length || 0} zones` }
                ]
            });
        }

        // Create HTML for each section
        sections.forEach(section => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'results-section';
            sectionEl.innerHTML = `
                <h4 class="results-section-title">${section.title}</h4>
                <div class="results-grid">
                    ${section.items.map(item => `
                        <div class="result-item">
                            <div class="result-label">${item.label}</div>
                            <div class="result-value">${item.value}</div>
                            ${item.description ? `<div class="result-description">${item.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            resultsContent.appendChild(sectionEl);
        });
    }

    showResults(results) {
        // For backward compatibility, switch to results mode
        this.switchToResultsMode(results);
    }

    showError(message) {
        this.updateStatus(message, 'error');
        console.error('Display Error:', message);
    }

    formatDistance(meters) {
        if (!meters) return 'N/A';
        
        if (meters < 1000) {
            return `${Math.round(meters)} m`;
        } else if (meters < 100000) {
            return `${(meters / 1000).toFixed(1)} km`;
        } else {
            return `${Math.round(meters / 1000)} km`;
        }
    }

    formatEnergy(joules) {
        if (!joules) return 'N/A';
        
        const tntEquivalent = joules / 4.184e9; // Convert to tons of TNT
        
        if (tntEquivalent < 1) {
            return `${(tntEquivalent * 1000).toFixed(0)} kg TNT`;
        } else if (tntEquivalent < 1000) {
            return `${tntEquivalent.toFixed(1)} tons TNT`;
        } else if (tntEquivalent < 1000000) {
            return `${(tntEquivalent / 1000).toFixed(1)} kt TNT`;
        } else {
            return `${(tntEquivalent / 1000000).toFixed(1)} Mt TNT`;
        }
    }

    updateTerrainStatus(exaggeration) {
        this.updateStatus(`Terrain exaggeration: ${exaggeration}x`);
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}