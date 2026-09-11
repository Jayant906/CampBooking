/**
 * Login.jsx - User login page
 * 
 * Features:
 * - Email/password authentication form
 * - Password visibility toggle
 * - Redirect after login (remembers where user came from)
 * - Error toast notifications
 * - Link to register page for new users
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';

/**
 * Login Component
 * Handles user authentication form and dispatch to Redux
 */
const Login = () => {
  const dispatch = useAppDispatch();              // Redux dispatcher
  const navigate = useNavigate();                 // Navigation after login
  const location = useLocation();                 // Get where user came from
  const { isLoading, error } = useAppSelector((state) => state.auth); // Redux auth state
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility

  // Redirect destination: where user was trying to go, or home if direct login
  const from = location.state?.from?.pathname || '/';

  // React Hook Form setup for form validation and handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',          // Validate as user types
    reValidateMode: 'onChange',
  });

  /**
   * Form submission handler
   * Dispatches login action to Redux, then navigates on success
   */
  const onSubmit = async (data) => {
    try {
      // Dispatch login thunk and wait for result
      const result = await dispatch(login(data)).unwrap();
      if (result) {
        // Navigate with animation state
        navigate(from, { replace: true, state: { fromAuth: true } });
      }
    } catch (err) {
      toast.error(err || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex animate-fadeIn">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200" 
          alt="Camping under stars"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="image-text-overlay-side" />
        <div className="relative z-10 flex flex-col justify-end p-12 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
          <h2 className="font-display text-4xl image-text-title font-semibold mb-4">
            Welcome Back to<br />Your Adventure
          </h2>
          <p className="image-text-subtitle text-lg max-w-md">
            Sign in to access your bookings and discover new camping destinations across India.
          </p>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center py-12 px-6 lg:px-12">
        <div className="w-full max-w-md animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          {/* Logo */}
          {/* <div className="flex items-center mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l7 9-7 9M12 3l7 9-7 9" />
              </svg>
            </div>
          </div> */}

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white mb-2">Sign In</h1>
            <p className="text-white/50">Enter your credentials to access your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] dark:text-white/40 hover:text-[var(--color-charcoal)] dark:hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full btn-primary py-4 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/50">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--color-forest)] dark:text-emerald-400 hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
