import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { OutlineWizardPage } from './pages/OutlineWizardPage'
import { WorkbenchPage } from './pages/WorkbenchPage'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
        <Route path="/wizard/:workspaceId" element={<ErrorBoundary><OutlineWizardPage /></ErrorBoundary>} />
        <Route path="/workbench/:workspaceId" element={<ErrorBoundary><WorkbenchPage /></ErrorBoundary>} />
        <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
