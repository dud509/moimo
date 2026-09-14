import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorScreen } from './ErrorScreen'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorScreen>
      <App />
    </ErrorScreen>
  </StrictMode>,
)
