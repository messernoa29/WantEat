import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PlanPage } from './pages/PlanPage'
import { ProfilePage } from './pages/ProfilePage'
import { LibraryPage } from './pages/LibraryPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/onboarding" element={<Protected><OnboardingPage /></Protected>} />
          <Route path="/plan" element={<Protected><PlanPage /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/library" element={<Protected><LibraryPage /></Protected>} />
          <Route path="/library/recipe/:id" element={<Protected><RecipeDetailPage /></Protected>} />
          <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
