import { HashRouter, Routes, Route } from 'react-router-dom'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WorkbenchPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}
