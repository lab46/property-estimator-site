# Frontend Deployment

## Prerequisites
- Backend deployed and API endpoint available
- Auth0 SPA application configured
- GitHub repository created
- GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)

## GitHub Secrets Required
```
VITE_AUTH0_DOMAIN
VITE_AUTH0_CLIENT_ID
VITE_AUTH0_AUDIENCE
VITE_API_BASE_URL (from backend deployment)
```

## Deploy
1. Push to GitHub `main` branch
2. GitHub Actions automatically builds and deploys to GitHub Pages
3. Site available at: `https://YOUR_USERNAME.github.io`

## Local Development
```bash
npm install
npm run dev
```

Visit: `http://localhost:3000`

## Build
```bash
npm run build
```

Output in `dist/` folder.

## Auth0 Configuration
Update Auth0 application settings:
- Allowed Callback URLs: `https://YOUR_USERNAME.github.io`
- Allowed Logout URLs: `https://YOUR_USERNAME.github.io`
- Allowed Web Origins: `https://YOUR_USERNAME.github.io`

## Tech Stack
- React 19 + Vite
- Tailwind CSS
- Auth0 React SDK
- Recharts
