import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { OnlineProvider } from './context/OnlineContext.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <OnlineProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </OnlineProvider>
    </BrowserRouter>
  </React.StrictMode>
)
