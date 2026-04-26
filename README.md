# Anemic 2D

![Anemic 2D Logo](icons/icon.ico)

**Ultra-lightweight Sprite Sheet Editor**

## Introduction

Anemic 2D is built on a simple philosophy: **Ultra-lightweight, Zero-Library**. No bloated frameworks, no unnecessary dependencies. Just pure, fast, industrial-grade sprite editing powered by vanilla Electron and Canvas API.

Designed for pixel artists and game developers who demand precision, speed, and minimal resource consumption.

## Key Features

- **Fast Sprite Packing** - Drag, drop, and pack sprites with grid-snapping precision
- **Multi-Select & Group Operations** - Select multiple sprites, move them as one solid block
- **Undo/Redo System** - Full history persistence with deep state snapshots
- **Real-time Naming** - Instant sprite identification and layer management
- **Ghost Preview** - Visual feedback during drag operations with coordinate tooltips
- **Export Options** - PNG, JPG, SVG export capabilities
- **Zero Dependencies** - Built with vanilla JavaScript, no external UI libraries

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/Rozaq125/Anemic.git
cd Anemic
npm install
npm start
```

### Usage

1. **Create Project** - Set canvas size (256x256 or 512x512) and grid size (16px, 32px, 64px)
2. **Import Sprites** - Drag and drop PNG files onto the canvas
3. **Arrange** - Use mouse to position, resize, and organize sprites
4. **Export** - Export your sprite sheet in PNG, JPG, or SVG format

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Delete | Delete selected sprites |
| F | Focus canvas on selection |
| Ctrl+Scroll | Zoom in/out |

## Project Structure

```
Anemic2D/
├── exporter/          # Image export utilities
├── icons/             # Application icons
├── img/               # Image loading utilities
├── packer/            # Sprite packing and gizmo logic
├── project/           # Project management
├── src/               # Main application source
│   ├── main.js        # Electron main process
│   ├── renderer.js    # Electron renderer process
│   └── style.css      # Application styles
├── website/           # Project website
├── index.html         # Main HTML structure
└── package.json       # Project configuration
```

## Alpha 1.0 Roadmap

### Completed ✓
- [x] Core sprite editing functionality
- [x] Multi-select and group operations
- [x] Undo/Redo persistence with deep copy
- [x] Ghost preview and coordinate tooltips
- [x] Grid snapping system
- [x] Export to PNG/JPG/SVG
- [x] Project save/load system
- [x] Fast preloader with progress tracking
- [x] Professional UI with black & orange theme

### In Progress 🚧
- [ ] Layer management system
- [ ] Advanced transform tools (rotate, flip)
- [ ] Sprite sheet auto-packing algorithm
- [ ] Custom grid configurations

### Planned 📋
- [ ] Animation timeline
- [ ] Batch export presets
- [ ] Plugin system
- [ ] Cloud project sync
- [ ] Collaborative editing
- [ ] Performance profiling tools

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **Canvas API** - Hardware-accelerated 2D rendering
- **Vanilla JavaScript** - Zero framework dependencies
- **Node.js** - File system and IPC operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Rozaq125**

- GitHub: [@Rozaq125](https://github.com/Rozaq125)
- Repository: https://github.com/Rozaq125/Anemic

---

**Anemic 2D Alpha 1.0** - Built for speed. Designed for precision.
