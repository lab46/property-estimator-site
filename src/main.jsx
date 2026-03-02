import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import './index.css';

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Debug: Log environment variables
console.log('Auth0 Configuration:', {
  domain: auth0Domain,
  audience: auth0Audience,
  hasClientId: !!auth0ClientId,
  hasDomain: !!auth0Domain,
});

// Validate required environment variables
if (!auth0Domain || !auth0ClientId) {
  console.error('Missing required Auth0 environment variables!');
  console.error('VITE_AUTH0_DOMAIN:', auth0Domain);
  console.error('VITE_AUTH0_CLIENT_ID:', auth0ClientId);
}

const isProduction = import.meta.env.PROD;
const basePath = isProduction ? '/property-estimator-site' : '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basePath}>
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin + basePath,
          audience: auth0Audience,
        }}
        onRedirectCallback={(appState) => {
          console.log('Auth0 redirect callback:', appState);
        }}
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);
