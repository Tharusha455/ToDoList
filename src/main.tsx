import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="433978596521-ak6mkdp45037q03hrrn8f2jguorgkeop.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
