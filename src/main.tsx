import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SmokeTest from './SmokeTest.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmokeTest />
    {/* <App /> */}
  </StrictMode>,
)
