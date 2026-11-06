import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // An update replaced an older worker: reload once so this tab runs the new build instead of a stale one.
  if (navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
  navigator.serviceWorker.register('./sw.js')
  // On a first visit the app's files and area data load before the worker runs, so it never saw them.
  // Hand it the list once it's ready so the app still opens offline after one visit.
  navigator.serviceWorker.ready.then((reg) =>
    reg.active?.postMessage({
      save: performance
        .getEntriesByType('resource')
        .map((e) => e.name)
        .filter((u) => u.startsWith(location.origin)),
    }),
  )
}
