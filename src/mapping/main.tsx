import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MappingSheet from './MappingSheet'
import './mapping.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MappingSheet />
  </StrictMode>,
)
