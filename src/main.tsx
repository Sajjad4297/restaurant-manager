import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './app.css'
import "react-multi-date-picker/styles/layouts/mobile.css"; // Optional: better for small windows
import "react-multi-date-picker/styles/layouts/prime.css";
// OR the standard one:
import "react-multi-date-picker/styles/colors/purple.css";
import './assets/Vazirmatn-font-face.css'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
