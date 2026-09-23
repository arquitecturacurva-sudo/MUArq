import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/kit.css'
import App from './App.tsx'
import TeamSessionGate from './composition/TeamSessionGate'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeamSessionGate><App /></TeamSessionGate>
  </StrictMode>,
)
