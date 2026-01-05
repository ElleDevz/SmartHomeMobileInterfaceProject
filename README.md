# HomeHarmony - Smart Home Control Interface

A modern, beautifully designed smart home control interface that works seamlessly across all devices. Built with vanilla HTML, CSS, and JavaScript with full Progressive Web App (PWA) support.

## ✨ Features

### Smart Controls
- **Lighting Control**: Intuitive toggle switch for instant light management
- **Temperature Control**: Precision temperature adjustment with increase/decrease buttons
- **Music Control**: Play, pause, skip, and stop with a dynamic song display
- **Real-time Updates**: Instant visual feedback for all controls

### Modern Design
- 🎨 Beautiful gradient-based color scheme
- 📱 Fully responsive mobile-first design
- ⚡ Smooth animations and transitions
- 🌙 Dark mode optimized interface
- ♿ Full accessibility support with keyboard shortcuts

### PWA Support
- 📲 Install as a native app on iOS and Android
- 🔄 Works offline with service worker caching
- 🚀 Fast loading and smooth performance
- 💾 Local data persistence

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js and npm (optional, for development server)

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd SmartHomeMobileInterfaceProject
   ```

2. **Option A: Direct Browser Access**
   - Simply open `index.html` in your web browser

3. **Option B: Development Server (Recommended)**
   ```bash
   npm install
   npm run dev
   ```
   Then navigate to `http://localhost:5173` (or the provided local URL)

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 📱 Installing as a Mobile App

### On iOS
1. Open the app in Safari
2. Tap the Share button (arrow icon)
3. Select "Add to Home Screen"
4. Choose a name and tap "Add"

### On Android
1. Open the app in Chrome or Edge
2. Tap the menu button (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Confirm the installation

### On Desktop
1. Click the install button in the address bar (if browser supports it)
2. Or right-click > "Install HomeHarmony"

## 💻 File Structure

```
SmartHomeMobileInterfaceProject/
├── index.html           # Main application layout
├── styles.css           # Complete styling with animations
├── script.js            # Application logic and event handling
├── sw.js                # Service worker for offline support
├── manifest.json        # PWA configuration
├── package.json         # Project dependencies
├── vite.config.js       # Build configuration
├── README.md            # This file
└── icons/
    ├── icon-192x192.png # App icon (small)
    └── icon-512x512.png # App icon (large)
```

## 🎮 Usage

### Lighting Control
- Toggle the switch to turn lights on and off
- Status displays current lighting state

### Temperature Management
- Use **+** button to increase temperature
- Use **−** button to decrease temperature
- Real-time temperature display
- **Keyboard shortcut**: Use `+` and `-` keys

### Music Player
- **Play/Pause**: Start or pause current track
- **Next**: Skip to next song
- **Stop**: Stop playback and reset display
- **Keyboard shortcut**: Press `Space` to play/pause

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` or `=` | Increase Temperature |
| `-` or `_` | Decrease Temperature |
| `Space` | Play/Pause Music |

## 🛠️ Development

### Customization

#### Change Color Scheme
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    /* ... modify other colors ... */
}
```

#### Add New Controls
1. Add HTML in `index.html` with a new control card
2. Add CSS styling to `styles.css`
3. Add JavaScript event listeners in `script.js`

#### Add More Songs
Edit the `funnySongNames` array in `script.js`:
```javascript
const funnySongNames = [
    "Your Song Name",
    // ... add more songs
];
```

## 📋 Configuration Files

### manifest.json
The PWA manifest configures how your app appears when installed:
- App name and icon
- Start URL and display mode
- Theme and background colors
- App shortcuts

### vite.config.js
Vite configuration for fast development and optimized builds.

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Chromium | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Opera | ✅ Full |

## 🔒 Performance & Security

- ⚡ Optimized for fast loading
- 🔐 Works offline with service worker
- 📊 Minimal JavaScript bundle
- 🎯 Progressive enhancement approach

## 🤝 Contributing

Feel free to fork, modify, and enhance this project! Some ideas:
- Add more smart home device controls
- Implement real API integration
- Add voice control support
- Create different theme options
- Add device automation schedules

## 📝 License

This project is open source and available for personal and educational use.

## 🙋 Support & Feedback

For issues, questions, or suggestions, please create an issue or contact the project maintainer.

---

**Made with ❤️ for smart home enthusiasts**
