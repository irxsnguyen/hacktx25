# Solarized 🌞

A production-ready web application for solar potential analysis that helps users find optimal locations for solar panel installation.

## Features

- **Interactive Map Interface**: Clean, responsive design with OpenStreetMap integration
- **Solar Potential Analysis**: Advanced algorithm for scoring solar potential at any location
- **Real-time Results**: Top 5 optimal locations with detailed metrics
- **Persistent Storage**: Save and manage analysis results
- **Responsive Design**: Works on desktop and mobile devices
- **Offline-First**: No external API dependencies for core functionality

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom earthy color palette
- **Maps**: Leaflet with OpenStreetMap tiles
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Storage**: IndexedDB with localStorage fallback
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier
    

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solarized
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Usage

### Main Interface

1. **Set Location**: Enter latitude/longitude coordinates or click "Pick on Map"
2. **Configure Analysis**: Set search radius (0.5-50 km) and enable urban penalty if needed
3. **Run Analysis**: Click "Analyze" to start the solar potential analysis
4. **View Results**: See the top 5 optimal locations on the map with detailed metrics

### Analysis Results

Each result includes:
- **Rank**: Position in the top 5
- **Coordinates**: Exact latitude/longitude
- **Score**: Solar potential score (0-100)
- **Estimated kWh/day**: Expected daily energy production

### Saved Analyses

- View all completed analyses at `/analysis`
- Click on any analysis to see detailed results
- Delete individual analyses or clear all
- Navigate back to map with pre-filled data

## Solar Algorithm

The application uses a sophisticated solar potential scoring algorithm that considers:

### Solar Position Calculations
- Solar declination and hour angle
- Elevation and azimuth angles
- Time-of-day solar tracking

### Irradiance Modeling
- Direct Normal Irradiance (DNI)
- Diffuse Horizontal Irradiance (DHI)
- Global Horizontal Irradiance (GHI)
- Plane-of-Array (POA) irradiance

### Panel Optimization
- Optimal tilt angle (latitude × 0.76)
- South-facing orientation (Northern Hemisphere)
- Temperature derating
- Ground reflection effects

### Environmental Factors
- Sky view factor approximation
- Urban penalty (optional)
- Clear-sky attenuation
- Atmospheric transmittance

## Architecture

### State Management

- **Map State**: Center coordinates, zoom level, location picking
- **UI State**: Sidebar collapse, analysis progress, current analysis
- **Analysis State**: Saved analyses with persistent storage

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main app layout
│   ├── Map.tsx          # Interactive map component
│   └── Sidebar.tsx      # Analysis controls and results
├── pages/               # Route components
│   ├── MapView.tsx      # Main analysis interface
│   └── AnalysisView.tsx # Saved analyses management
├── store/               # Zustand stores
│   ├── useMapStore.ts   # Map state management
│   ├── useUIStore.ts    # UI state management
│   └── useAnalysisStore.ts # Analysis persistence
├── utils/               # Business logic
│   ├── solarCalculations.ts # Solar algorithm
│   └── storage.ts       # Data persistence
└── types/               # TypeScript definitions
    └── index.ts         # Shared interfaces
```

### Data Flow

1. User inputs location and parameters
2. Solar analysis algorithm processes grid points
3. Results are ranked and filtered (top 5, minimum spacing)
4. Analysis is saved to persistent storage
5. Results displayed on interactive map

## Customization

### Color Palette

The app uses a custom earthy color scheme defined in `tailwind.config.js`:

- **Primary**: Terra-cotta orange (#E07A5F)
- **Secondary**: Earthy green (#3D8361)  
- **Accent**: Dusty pink (#FFCCD5)
- **Base**: White and warm off-white (#F8F5F2)

### Extensibility

The solar algorithm is designed for future enhancements:

- **Horizon Profile**: `getHorizonProfile(lat, lon)` - DEM integration
- **Near Field Mask**: `nearFieldMask(lat, lon)` - Obstruction modeling
- **External Irradiance**: `externalIrradiance(lat, lon, date)` - API integration

## Testing

The application includes comprehensive testing:

- **Unit Tests**: Solar calculation algorithms
- **Component Tests**: React component behavior
- **Integration Tests**: State management and data flow

Run tests with:
```bash
npm test
```

## Performance

- **Lazy Loading**: Components loaded on demand
- **Memoization**: Expensive calculations cached
- **Efficient Rendering**: React.memo and useCallback optimizations
- **Bundle Splitting**: Code split by route

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- OpenStreetMap contributors for map tiles
- Leaflet team for mapping library
- React and TypeScript communities
- Solar energy research and algorithms