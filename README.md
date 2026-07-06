# WebRTC App - Frontend

This is the frontend client for the WebRTC application. It provides the user interface for video conferencing, chat, and real-time collaboration.

## Tech Stack
- **React & Vite:** Fast and modern UI framework
- **Tailwind CSS & Shadcn UI:** For styling and UI components
- **Socket.io-client:** For real-time communication with the backend
- **WebRTC API:** For peer-to-peer video and audio streaming

## Local Development Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
   *(Note: This project supports `pnpm`, `npm`, or `yarn`. Use your preferred package manager).*

2. **Environment Configuration:**
   The project uses Vite environment variables. We have provided `.env.development` and `.env.production` templates. 
   
   Ensure that your `.env.development` contains the correct backend URLs:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SOCKET_URL=http://localhost:8000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The app will typically run on `http://localhost:5173`.

## Production Deployment
To build the application for production:
```bash
npm run build
```
This will generate a `dist` folder. You can deploy this directory to any static hosting service like Vercel, Netlify, or Cloudflare Pages. 

Make sure your production environment variables are properly set in your hosting platform dashboard so the frontend can securely connect to your deployed backend.