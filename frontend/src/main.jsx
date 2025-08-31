import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './pages/App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CreateLot from './pages/CreateLot.jsx'
import LotDetails from './pages/LotDetails.jsx'
import PublicLot from './pages/PublicLot.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App/>,
    children: [
      { index: true, element: <Dashboard/> },
      { path: 'create', element: <CreateLot/> },
      { path: 'lot/:lotId', element: <LotDetails/> },
    ]
  },
  { path: '/login', element: <Login/> },
  { path: '/register', element: <Register/> },
  { path: '/scan/:lotId', element: <PublicLot/> }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
