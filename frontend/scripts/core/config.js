// frontend/scripts/core/config.js

// Define the base URL for the API.
// In production: set VITE_API_URL to the backend Render URL (e.g. https://savora-backend.onrender.com)
// In development: falls back to '/api', which is proxied to localhost:5000 by vite.config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// --- Cloudinary Configuration ---
// IMPORTANT: Set these to your actual Cloudinary credentials before deploying.
// How to get them:
//   1. Create a free account at https://cloudinary.com
//   2. Go to Dashboard → Settings → Upload → Upload Presets
//   3. Create an unsigned upload preset and copy the preset name
//   4. Your cloud name is shown in the top-left of the Cloudinary dashboard
//
// Without valid credentials, dish/chef image uploads will fall back to the Cloudinary
// demo account (images may be deleted) or fail silently. URL input still works as a fallback.
export const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'; // e.g., 'dabc123'
export const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // e.g., 'savora_unsigned'
