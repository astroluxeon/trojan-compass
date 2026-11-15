import React from 'react'
import { createRoot } from 'react-dom/client'
import Wayfinder from '../../apps/web/src/components/Wayfinder'

// The actual website owns its original UI and interactions. Swift only hosts it.
createRoot(document.getElementById('root')!).render(<Wayfinder />)
