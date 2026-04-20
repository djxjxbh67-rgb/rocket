# Project Memory: RocketLanding

## Current Status
- **Phase**: Optimization & Configuration (Form + Chatbot).
- **Last Milestone**: Added prominent Telegram direct buttons (@sergkane) in Hero and Order sections.
- **Ongoing**: Refining chatbot logic and prompt.

## Context & Background
- The project is a premium landing page developed to sell high-end websites.
- Key differentiator: Cinematic 3D background that assembles on load and reacts to scroll.
- Chat system was simplified from a complex Make.com polling setup to a direct Telegram handoff for cost and performance reasons.

## Technical Decisions
1. **3D Canvas**: Positioned `fixed`, `z-index: -1`, `pointer-events: none` to stay in background while allowing clicks on HTML.
2. **Theme**: Dark mode is preferred and set as default in `index.html` and `main.js`.
3. **Chat Handoff**: Switched to a direct Telegram link (`t.me/...`) to avoid high credit costs on Make.com for bidirectional polling.
4. **Build**: Uses Vite for bundling React/Three.js inside a vanilla HTML project.
5. **Deployment Phase**:
  - [x] Push code to GitHub.
  - [x] Deploy dist folder to gh-pages.
6. **SEO & Content Analysis**:
  - [x] Locate `content-creator` skill.
  - [x] Run the skill over `emerald-ring` site.
  - [x] Implement SEO recommendations.
7. **2026 Adjustments**:
  - [x] Integrate direct Telegram buttons (@sergkane) globally.
  - [ ] Configure Order Form webhook and logic.
  - [ ] Refine AI Chatbot prompt and handoff logic.

## Pending Tasks
- [ ] Configure/Fix the Order Form logic (Lead generation).
- [ ] Refine the Chatbot behavior/prompt.
- [ ] (Optional) Final SEO validation.
