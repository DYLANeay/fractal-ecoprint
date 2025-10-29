# 🌀 Fractal EcoPrint

A beautiful, high-quality fractal generator built with vanilla JavaScript. Generate stunning fractals with multiple formulas and color palettes, then export them as high-resolution JPEG images.

## ✨ Features

### 5 Fractal Formulas
- **Mandelbrot Set** - The classic fractal
- **Julia Set** - Beautiful variations with adjustable parameters
- **Burning Ship** - Unique ship-like patterns
- **Tricorn (Mandelbar)** - Mandelbrot's conjugate cousin
- **Newton Fractal** - Root-finding visualization

### Color Palettes
- Sunset - Warm purple to red gradient
- Ocean - Deep blue to cyan waves
- Forest - Natural green tones
- Fire - Black to yellow flames
- Rainbow - Classic spectrum
- Grayscale - Black and white elegance

### High-Quality Export
- Export resolutions: Full HD, 2K, 4K, or custom
- Adjustable JPEG quality (50-100%)
- Smooth coloring algorithm for professional results

### Interactive Controls
- Click and drag to pan around the fractal
- Scroll to zoom in/out
- Adjustable iteration count for detail level
- Real-time rendering

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download this repository
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎨 Usage

1. **Choose a fractal formula** from the dropdown menu
2. **Adjust parameters** (iterations, zoom, Julia constants)
3. **Select a color palette** by clicking on the palette previews
4. **Navigate** the fractal:
   - Click and drag to pan
   - Scroll to zoom in/out
   - Click "Reset View" to go back to default
5. **Export your creation**:
   - Choose export resolution
   - Adjust JPEG quality
   - Click "Export as JPEG"

## 🏗️ Project Structure

```
fractal-ecoprint/
├── src/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   ├── styles.css      # Main styles
│   │   └── palettes.css    # Color palette previews
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   ├── renderer.js     # Fractal rendering engine
│   │   ├── colorPalette.js # Color system
│   │   ├── exporter.js     # JPEG export functionality
│   │   └── fractals/       # Fractal formulas
│   │       ├── mandelbrot.js
│   │       ├── julia.js
│   │       ├── burning-ship.js
│   │       ├── tricorn.js
│   │       └── newton.js
│   └── server/
│       └── server.js       # Express server
├── package.json
└── README.md
```

## 🔬 Technical Details

### Rendering Algorithm
- Uses HTML5 Canvas API for rendering
- Implements smooth coloring using logarithmic smoothing
- Supports adjustable iteration counts for quality vs. performance

### Color System
- Linear interpolation between palette colors
- Smooth gradient transitions
- Normalized iteration values for consistent coloring

### Export Quality
- Off-screen canvas for high-resolution rendering
- Configurable JPEG quality (0.5 - 1.0)
- Async rendering with progress tracking

## 🎯 Future Enhancements

- [ ] Web Workers for faster rendering
- [ ] Custom color palette editor
- [ ] Save/load fractal configurations
- [ ] More fractal formulas
- [ ] Animation/zoom sequences
- [ ] PNG export option
- [ ] Deep zoom with arbitrary precision

## 📝 License

MIT License - feel free to use this project for learning or personal projects!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for fractal enthusiasts
