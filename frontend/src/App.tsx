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
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminRecipesPage } from './pages/admin/AdminRecipesPage'
import { AdminRecipeFormPage } from './pages/admin/AdminRecipeFormPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRoute } from './components/layout/AdminRoute'
import { BottomNav } from './components/layout/BottomNav'

function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

function Admin({ children }: { children: React.ReactNode }) {
  return <Protected><AdminRoute>{children}</AdminRoute></Protected>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BottomNav />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Pages nécessitant un compte */}
          <Route path="/dashboard" element={
            <ProtectedRoute guestFallback={{ emoji: '🏠', feature: 'Tableau de bord perso', description: 'Crée un compte pour suivre tes calories, macros et progression quotidienne.' }}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={<Protected><OnboardingPage /></Protected>} />
          <Route path="/plan" element={
            <ProtectedRoute guestFallback={{ emoji: '📅', feature: 'Plan nutrition IA', description: 'Génère ton plan repas personnalisé sur 7 jours avec Claude. Il suffit de créer un compte.' }}>
              <PlanPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute guestFallback={{ emoji: '👤', feature: 'Profil & objectifs', description: 'Configure ton profil nutritionnel pour des recommandations personnalisées.' }}>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute guestFallback={{ emoji: '🗓️', feature: 'Calendrier repas', description: 'Planifie tes repas de la semaine et suis tes apports nutritionnels.' }}>
              <CalendarPage />
            </ProtectedRoute>
          } />

          {/* Pages publiques (invités et connectés) */}
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/recipe/:id" element={<RecipeDetailPage />} />

          {/* Admin */}
          <Route path="/admin" element={<Admin><AdminLayout /></Admin>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="recipes" element={<AdminRecipesPage />} />
            <Route path="recipes/new" element={<AdminRecipeFormPage />} />
            <Route path="recipes/:id/edit" element={<AdminRecipeFormPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
