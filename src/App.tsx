import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/AdminLayout/AdminLayout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import RawMaterials from './pages/RawMaterials/RawMaterials'
import Analytics from './pages/Analytics/Analytics'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="raw-materials" element={<RawMaterials />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
