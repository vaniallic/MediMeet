import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { GeoProvider } from './context/GeoContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

// Daftarkan service worker (cuma di versi production) supaya app bisa dipasang ke layar utama.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GeoProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </GeoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
