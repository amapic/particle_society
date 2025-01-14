import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './AppReact';

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

// Handle Three.js initialization
async function initializeThreeJS() {
  try {
    const { default: gl } = await import('./scripts/gl');
    return gl;
  } catch (error) {
    console.error('Failed to initialize Three.js:', error);
  }
}

// Main initialization
async function initialize() {
  try {
    // First initialize React
    initializeReact();
    
    // Then initialize Three.js
    await initializeThreeJS();
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