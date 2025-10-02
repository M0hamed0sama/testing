/**
 * Physics and Application Constants
 */

export const PHYSICS_CONSTANTS = {
    // Earth properties
    EARTH_RADIUS: 6371000, // meters
    EARTH_GRAVITY: 9.81, // m/s²
    EARTH_CRUST_DENSITY: 2700, // kg/m³
    WATER_DENSITY: 1000, // kg/m³
    
    // Atmospheric properties
    ATMOSPHERE_SCALE_HEIGHT: 8400, // meters
    AIR_DENSITY_SEA_LEVEL: 1.225, // kg/m³
    
    // Impact physics
    TNT_EQUIVALENT: 4.184e9, // Joules per ton of TNT
    SOUND_SPEED: 343, // m/s in air
    ROCK_MELTING_ENERGY: 1.5e6, // J/kg approximate
    
    // Blast wave
    BLAST_WAVE_DECAY: 1.033, // Sedov-Taylor blast wave decay
    
    // Thermal radiation
    STEFAN_BOLTZMANN: 5.67e-8, // W/m²/K⁴
    
    // Seismic
    SEISMIC_VELOCITY: 6000 // m/s average crustal velocity
};

export const TERRAIN_CONFIG = {
    DEFAULT_EXAGGERATION: 1,
    MIN_EXAGGERATION: 1,
    MAX_EXAGGERATION: 10,
    TERRAIN_SOURCE: 'terrain-rgb'
};

export const UI_CONFIG = {
    ANIMATION_DURATION: 2000,
    DEFAULT_ZOOM: 8,
    IMPACT_ZOOM: 12,
    MAX_ZOOM: 18,
    MIN_ZOOM: 2
};

export const DAMAGE_THRESHOLDS = {
    // Overpressure thresholds (Pa)
    OVERPRESSURE: {
        LIGHT_DAMAGE: 6895, // 1 psi
        MODERATE_DAMAGE: 34475, // 5 psi
        HEAVY_DAMAGE: 68950, // 10 psi
        COMPLETE_DESTRUCTION: 137900 // 20 psi
    },
    
    // Thermal radiation thresholds (J/cm²)
    THERMAL: {
        FIRST_DEGREE_BURN: 25,
        SECOND_DEGREE_BURN: 37.5,
        THIRD_DEGREE_BURN: 62.5
    },
    
    // Seismic thresholds (Modified Mercalli Intensity)
    SEISMIC: {
        BARELY_FELT: 3,
        LIGHT_DAMAGE: 6,
        MODERATE_DAMAGE: 8,
        SEVERE_DAMAGE: 10
    }
};