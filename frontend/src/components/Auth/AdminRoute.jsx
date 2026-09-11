/**
 * AdminRoute.jsx - Wrapper for routes requiring admin/staff authentication
 * 
 * Purpose:
 * - Prevents regular users and unauthenticated users from accessing admin pages
 * - Checks both authentication status AND user role (isAdmin flag)
 * - Redirects to /login if not authenticated
 * - Redirects to / (home) if user is not admin
 * 
 * Used for:
 * - /admin/camps - Manage camp listings
 * - /admin/coupons - Manage discount codes
 * - /admin/users - View all registered users
 * - /admin/bookings - View system-wide bookings
 * 
 * Authorization Flow:
 * 1. User tries to navigate to admin route
 * 2. AdminRoute checks two conditions:
 *    a. Is user authenticated? (Redux auth.isAuthenticated)
 *    b. Is user an admin? (Redux auth.user.isAdmin)
 * 3. If both true: Render admin component
 * 4. If not authenticated: Redirect to /login
 * 5. If authenticated but not admin: Redirect to home /
 * 
 * Role Assignment:
 * - Admin role set during user creation by auth service
 * - Stored in JWT token as "IsAdmin" claim
 * - Retrieved and stored in Redux on login
 * 
 * Note: This is client-side protection only
 * Server enforces authorization via [Authorize(Policy = "AdminOnly")] on API endpoints
 */

import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

/**
 * AdminRoute component
 * @param {ReactNode} children - Component to render if admin
 * @returns {ReactNode} - Either children, login redirect, or home redirect
 */
const AdminRoute = ({ children }) => { // Get authentication and user info from Redux state
  const { isAuthenticated, user } = useAppSelector((state) => state.auth); // First check: User must be authenticated

  // First check: User must be authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Second check: User must have admin role
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Both checks passed: Render admin component
  return <>{children}</>;
};

export default AdminRoute;
