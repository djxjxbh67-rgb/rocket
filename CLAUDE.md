# RocketLanding (Emerald Ring)

Landing page for a premium web agency with 3D assembly effects and AI integration.

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+), React Three Fiber (R3F) for 3D.
- **Build Tool**: Vite.
- **Animations**: GSAP, Three.js, Intersection Observer.
- **Deployment**: GitHub Pages (using `gh-pages` branch).

## Build & Test Commands
- `npm run dev` - Start development server.
- `npm run build` - Build for production.
- `npm run preview` - Preview production build.
- `npm run deploy` - Deploy to GitHub Pages (via gh-pages script).

## Coding Standards
- Use **BEM** methodology for CSS.
- Maintain **Dark Theme** as default.
- Ensure all interactive elements have unique IDs.
- Keep 3D scene optimized (low-poly, compressed textures).
- Critical: `pointer-events: none` on 3D canvas container to allow content interaction.
