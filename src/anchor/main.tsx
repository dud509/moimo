import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AnchorEditor from './AnchorEditor'
import './anchors.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnchorEditor />
  </StrictMode>,
)
