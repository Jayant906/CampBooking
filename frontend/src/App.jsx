/**
 * App.jsx - Main application router and layout orchestrator
 * 
 * Responsibilities:
 * - Define all application routes (public, protected user, and admin-only)
 * - Wrap protected routes with authentication guards (ProtectedRoute, AdminRoute)
 * - Provide Layout wrapper for navigation/UI consistency
 * 
 * Route Structure:
 * - Public: /, /login, /register, /booking/:campId (view only)
 * - Protected User: /manage-booking, /profile, /confirmation/:bookingReference
 * - Protected Admin: /admin/camps, /admin/coupons, /admin/users, /admin/bookings
 */

import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import BookingPage from './pages/BookingPage'
import ConfirmationPage from './pages/ConfirmationPage'
import ManageBooking from './pages/ManageBooking'
import UserProfile from './pages/UserProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminCamps from './pages/AdminCamps'
import AdminCoupons from './pages/AdminCoupons'
import AdminUsers from './pages/AdminUsers'
import AdminBookings from './pages/AdminBookings'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Auth/AdminRoute'

/**
 * Main App component - Renders nested routing structure
 * All routes inherit Layout component for consistent navigation and styling
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="manage-booking"
          element={
            <ProtectedRoute>
              <ManageBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route 
          path="booking/:campId" 
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="confirmation/:bookingReference" 
          element={
            <ProtectedRoute>
              <ConfirmationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/camps" 
          element={
            <AdminRoute>
              <AdminCamps />
            </AdminRoute>
          } 
        />
        <Route 
          path="admin/coupons" 
          element={
            <AdminRoute>
              <AdminCoupons />
            </AdminRoute>
          } 
        />
        <Route 
          path="admin/users" 
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } 
        />
        <Route 
          path="admin/bookings" 
          element={
            <AdminRoute>
              <AdminBookings />
            </AdminRoute>
          } 
        />
      </Route>
    </Routes>
  )
}

export default App
