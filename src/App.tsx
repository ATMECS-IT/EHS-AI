import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/AdminLayout/AdminLayout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import RawMaterials from './pages/RawMaterials/RawMaterials'
import Analytics from './pages/Analytics/Analytics'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="dashboard" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="raw-materials" element={<AdminLayout />}>
        <Route index element={<RawMaterials />} />
      </Route>
      <Route path="analytics" element={<AdminLayout />}>
        <Route index element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default App
