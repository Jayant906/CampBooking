/**
 * main.jsx - React application entry point
 * 
 * Initializes:
 * - Redux store provider for global state management (auth, camps, bookings, filters)
 * - React Router BrowserRouter for client-side navigation
 * - Toast notifications (react-toastify) for user feedback
 * - Global CSS styling
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from './App'
import { store } from './store/store'
import './index.css'

/**
 * Mount React app to DOM with all necessary providers:
 * - Provider: Redux store access to all components
 * - BrowserRouter: Client-side routing
 * - ToastContainer: Toast notification rendering
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
