/* eslint-disable check-file/filename-naming-convention */
import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './ui/App.tsx'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
