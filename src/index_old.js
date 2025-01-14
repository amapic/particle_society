import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.jsx';

// Initialize React in a separate function
function initializeReact() {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Failed to find the root element');
  }
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Handle other vanilla JS imports and code
async function initialize() {
  try {
    // Import your vanilla JS modules here
    // For example:
    // await import('./scripts/vanilla-script.js');
    
    // Initialize React after other scripts are loaded
    initializeReact();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Start everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 