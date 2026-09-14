import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorScreen } from './ErrorScreen'
import './styles.css'

// React 가 붙기 전에 터지는 것도 화면에 남긴다
window.addEventListener('error', (e) => {
  const root = document.getElementById('root')
  if (root && !root.childElementCount) {
    root.innerHTML =
      `<div class="crash"><h1>시작하지 못했어요</h1><p class="crash-msg">${String(e.message)}</p>` +
      `<pre>${String(e.error?.stack ?? e.filename + ':' + e.lineno)}</pre></div>`
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorScreen>
      <App />
    </ErrorScreen>
  </StrictMode>,
)
