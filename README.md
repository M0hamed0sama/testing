# Asteroid Impact Simulator - Version 2.0

A scientifically accurate asteroid impact simulation web application featuring 3D terrain visualization, physics-based calculations, and modern interactive UI. Built with modern web technologies and based on established physics models for educational and research purposes.

## 🌍 Features - Version 2.0

### Core Functionality
- **3D Terrain Visualization**: Interactive 3D map with terrain exaggeration using MapLibre GL JS
- **Scientific Physics Models**: Based on established scaling laws (Collins et al., Melosh)
- **Non-Overlapping Zone Display**: Ring-based visualization with high contrast colors
- **Global Earth Coverage**: Works anywhere on Earth with proper antimeridian wrapping
- **Multiple Simulation Support**: Unlimited consecutive runs without errors
- **Smart Visibility Controls**: Real-time show/hide of effect zones

### Physics Calculations
- **Crater Formation**: Diameter, depth, volume, and rim height calculations  
- **Blast Wave Modeling**: Overpressure zones using Sedov-Taylor solutions
- **Thermal Radiation**: Fireball and burn radius calculations
- **Atmospheric Entry**: Survival analysis and airburst calculations

### User Experience  
- **Interactive Controls**: Real-time parameter adjustment and preset scenarios
- **Modern UI**: Dark theme with responsive design and smooth animations
- **Educational Mode**: Progressive effect revelation for teaching
- **Professional Visualization**: Publication-ready graphics with clear zone boundaries

### Phase 2 (Planned)
- **Seismic Effects**: Earthquake magnitude and propagation modeling
- **Tsunami Generation**: Wave height and coastal impact analysis
- **Real Population Data**: Integration with WorldPop APIs
- **Real Bathymetry**: Ocean depth data for accurate tsunami modeling

### Phase 3 (Planned)  
- **Casualty Estimation**: Population impact calculations
- **Economic Assessment**: Infrastructure damage modeling
- **Advanced Visualization**: Time-based animations and heat maps
- **Data Export**: Results export in multiple formats

## 🚀 Technology Stack

### Core Technologies
- **JavaScript ES6+** - Modern module system with import/export
- **MapLibre GL JS v3.6.2** - WebGL-powered 3D mapping
- **HTML5 & CSS3** - Semantic markup and modern styling
- **Turf.js** - Geospatial analysis and calculations
- **D3.js** - Data visualization and overlays
- **Chart.js** - Statistical charts and graphs

### Data Sources
- **Mapbox Terrain RGB** - Elevation data for 3D terrain
- **OpenStreetMap** - Base map tiles
- **Scientific Models** - Peer-reviewed impact physics

### Development Tools
- **Servor** - Lightweight development server with live reload
- **ES Modules** - Native browser module loading
- **npm** - Package management

## 📋 Requirements

### Browser Compatibility
- **Chrome 61+** / **Edge 79+** (ES6 modules, WebGL 2.0)
- **Firefox 60+** (ES6 modules, WebGL support) 
- **Safari 11+** (ES6 modules, WebGL support)

### System Requirements
- **WebGL-capable graphics** (for 3D terrain rendering)
- **Modern CPU** (for real-time physics calculations)
- **Stable internet connection** (for map tiles)

## � What's New in Version 2.0

### Major Improvements
- **Enhanced Visualization**: Non-overlapping rings with high-contrast colors
- **Global Coverage**: Perfect rendering anywhere on Earth, including antimeridian crossing
- **Multiple Simulations**: Run unlimited consecutive simulations without errors  
- **Smart Controls**: Visibility toggles control display, not calculation
- **Professional Quality**: Publication-ready visualizations for research and education

### Technical Enhancements
- Earth-wrapping geometry for large impacts
- Robust layer cleanup and memory management  
- Improved error handling and fallback systems
- Optimized rendering performance

## �🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd asteroid-impact-simulator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Production Build
```bash
npm run build
npm start
```

## 🎮 Usage Guide

### Basic Simulation
1. **Set Impact Parameters**
   - Adjust asteroid diameter (1m - 10km)
   - Set velocity (5-70 km/s)
   - Choose impact angle (15-90°)
   - Select composition (rock, iron, ice, or custom)

2. **Choose Impact Location**
   - Enter coordinates manually
   - Click "Select on Map" and click desired location
   - Use preset scenarios (Tunguska, Chelyabinsk, Chicxulub)

3. **Run Simulation**
   - Click "Run Simulation" button
   - Wait for physics calculations to complete
   - View results in the side panel

4. **Analyze Effects**
   - Toggle different effect layers (crater, blast wave, thermal)
   - View non-overlapping ring zones with high contrast colors
   - Test global locations including antimeridian crossings
   - Run multiple simulations to compare different scenarios

### Preset Scenarios
- **Tunguska (1908)**: 60m rocky asteroid, 27 km/s, 30° angle
- **Chelyabinsk (2013)**: 20m rocky asteroid, 19 km/s, 18° angle  
- **Chicxulub**: 10km rocky asteroid, 20 km/s, 45° angle

### Interpretation Guide
- **Crater**: Direct excavation zone
- **Blast Wave**: Overpressure damage zones (1, 5, 10 psi)
- **Thermal**: Burn radius zones (1st, 2nd, 3rd degree)
- **Energy**: TNT equivalent for scale reference

## 🔬 Scientific Accuracy

### Physics Models Used
- **Crater Scaling**: Collins et al. (2005) scaling laws
- **Atmospheric Entry**: Chyba et al. (1993) fragmentation models
- **Blast Waves**: Sedov-Taylor blast wave solutions
- **Thermal Radiation**: Fireball scaling and burn thresholds
- **Material Properties**: Peer-reviewed density and strength values

### Limitations
- Simplified atmospheric model (Phase 1)
- Uniform target properties assumed
- No topographic effects on blast propagation
- Population data not yet integrated (Phase 2)

### Validation
Results validated against:
- Purdue University Impact Earth calculator
- Published impact studies (Tunguska, Chelyabinsk)
- Laboratory impact experiments

## 📊 Architecture

### Project Structure
```
src/
├── app.js                 # Main application entry point
├── map/
│   ├── terrain.js        # 3D terrain management
│   └── layers.js         # Effect visualization layers
├── physics/
│   ├── impact.js         # Core impact calculator
│   ├── crater.js         # Crater formation physics
│   ├── waves.js          # Blast wave calculations
│   ├── thermal.js        # Thermal radiation
│   ├── atmosphere.js     # Atmospheric entry
│   ├── seismic.js        # Seismic effects (Phase 2)
│   └── tsunami.js        # Tsunami modeling (Phase 2)
├── ui/
│   ├── controls.js       # User interface controls  
│   ├── display.js        # Results and status display
│   └── visualization.js  # Effect visualization
└── utils/
    ├── constants.js      # Physical constants
    ├── events.js         # Event system
    └── state.js          # Application state
```

### Data Flow
1. **User Input** → UI Controls → Parameter Validation
2. **Physics Engine** → Impact Calculator → Individual Modules
3. **Results Processing** → Visualization Manager → Map Layers
4. **Display Updates** → Status Panel → Results Grid

## 🧪 Development

### Adding New Features
1. **Phase 2 Development**: Enable seismic and tsunami calculations
2. **Data Integration**: Add real population and bathymetry APIs  
3. **Advanced Visualization**: Time-based animations
4. **Mobile Support**: Responsive design improvements

### Code Style
- ES6+ features with module imports
- JSDoc comments for all public methods
- Event-driven architecture for loose coupling
- Functional programming patterns where appropriate

### Performance Considerations
- WebGL rendering for smooth 3D performance
- Efficient geospatial calculations using Turf.js
- Lazy loading of map tiles
- Debounced user input handling

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Submit pull request with detailed description

### Guidelines
- Follow existing code style and architecture
- Add tests for new physics calculations
- Update documentation for new features
- Ensure browser compatibility

### Bug Reports
Please include:
- Browser version and OS
- Steps to reproduce
- Expected vs actual behavior
- Console error messages

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### Scientific References
- Collins, G.S., et al. (2005) - Crater scaling laws
- Melosh, H.J. (1989) - Impact cratering mechanics  
- Chyba, C.F., et al. (1993) - Atmospheric fragmentation
- Glasstone, S. & Dolan, P.J. (1977) - Blast wave effects

### Data Sources
- Mapbox - Terrain elevation data
- OpenStreetMap - Base map tiles
- Purdue University - Impact Earth reference calculator

### Tools & Libraries
- MapLibre GL JS team - 3D mapping platform
- Turf.js contributors - Geospatial analysis
- D3.js team - Data visualization framework

## 📞 Support

- **Documentation**: [GitHub Wiki](wiki-url)
- **Issues**: [GitHub Issues](issues-url)  
- **Discussions**: [GitHub Discussions](discussions-url)

---

**Built with ❤️ for science education and asteroid impact research**
