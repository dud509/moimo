import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CompareSheet from './CompareSheet'
import './compare.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CompareSheet />
  </StrictMode>,
)
