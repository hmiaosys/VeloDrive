import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ProtectedRoute } from './router/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ItemsListPage } from './pages/items/ItemsListPage'
import { ItemNewPage } from './pages/items/ItemNewPage'
import { CustomersListPage } from './pages/customers/CustomersListPage'
import { BookingsListPage } from './pages/bookings/BookingsListPage'
import { BookingDetailPage } from './pages/bookings/BookingDetailPage'
import { BookingsNewPage } from './pages/bookings/BookingsNewPage'
import { QuotesListPage } from './pages/quotes/QuotesListPage'
import { InvoicesListPage } from './pages/invoices/InvoicesListPage'
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage'
import { AddOnsListPage } from './pages/addons/AddOnsListPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { TeamPage } from './pages/settings/TeamPage'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/items" element={<ItemsListPage />} />
            <Route path="/items/new" element={<ItemNewPage />} />
            <Route path="/addons" element={<AddOnsListPage />} />
            <Route path="/customers" element={<CustomersListPage />} />
            <Route path="/bookings" element={<BookingsListPage />} />
            <Route path="/bookings/new" element={<BookingsNewPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/quotes" element={<QuotesListPage />} />
            <Route path="/invoices" element={<InvoicesListPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/team" element={<TeamPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
