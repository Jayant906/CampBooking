/**
 * ProtectedRoute.jsx - Wrapper for routes requiring user authentication
 * 
 * Purpose:
 * - Prevents unauthenticated users from accessing protected pages
 * - Redirects to /login if user is not logged in
 * - Checks Redux auth state (isAuthenticated flag)
 * 
 * Used for:
 * - /manage-booking - View user's bookings
 * - /profile - User profile page
 * - /booking/:campId - Make a booking for a camp
 * - /confirmation/:bookingReference - View booking confirmation
 * 
 * Flow:
 * 1. User tries to navigate to protected route
 * 2. ProtectedRoute checks Redux auth.isAuthenticated
 * 3. If true: Render the requested component (children)
 * 4. If false: Redirect to /login
 * 
 * Note: This is client-side protection only
 * Server also enforces authentication via [Authorize] on API endpoints
 */

import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

/**
 * ProtectedRoute component
 * @param {ReactNode} children - Component to render if authenticated
 * @returns {ReactNode} - Either children or redirect to login
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
