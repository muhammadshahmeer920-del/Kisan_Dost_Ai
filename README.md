<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Kisan Dost AI — Smart Livestock & Farm Management Platform

This repository contains the source code and configuration required to run the Kisan Dost AI application locally and in production.

## Stack Overview
- **Frontend Framework:** React 19 + Vite 6 (Single Page Application architecture)
- **Styling:** Tailwind CSS 4
- **Backend Service:** Express server with Vite middleware integration for SSR/SPA serving
- **Database & Identity:** Firebase (Firestore real-time sync + Firebase Authentication)
- **AI Engine:** Google Gemini API (gemini-2.5-flash with local offline fallback models)

## Run Locally

**Prerequisites:** Node.js (v18+ recommended)

1. **Install dependencies:**
   `npm install`

2. **Set the environment variables:**
   Create a `.env` or `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```

3. **Run the development server:**
   `npm run dev`

   The app will be accessible at http://localhost:3000.

## Production Build & Deploy

To build and compile both the client SPA assets and bundle the Express server for production:
```bash
npm run build
npm start
```
This outputs assets to `/dist` and runs the production Express build from `/dist/server.cjs`.
