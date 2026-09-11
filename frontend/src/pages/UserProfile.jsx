import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateUser, logout } from '../store/slices/authSlice';
import { authService } from '../services/authService';

const UserProfile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user: storeUser } = useAppSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getCurrentUser();
        const data = response.success ? response.data : storeUser;
        setProfile(data);
        setForm({
          firstName: data?.firstName ?? '',
          lastName: data?.lastName ?? '',
          dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        });
      } catch {
        setProfile(storeUser);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [storeUser]);

  const handleCancel = () => {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { 
      toast.error('First name and last name are required.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await authService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth || null,
      });
      if (response.success && response.data) {
        setProfile(response.data);
        dispatch(updateUser({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          dateOfBirth: response.data.dateOfBirth,
        }));
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to update profile.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    dispatch(logout());
    navigate('/', { state: { resetCamps: true, ts: Date.now() } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsLoggingOut(false);
  };

  const formatDob = (dob) => {
    if (!dob) return 'Not provided';
    return new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getMemberSince = (createdAt) => {
    if (!createdAt) return 'N/A';
    return new Date(createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getInitials = (first, last) =>
    ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] dark:bg-gray-900 flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] dark:border-gray-700 border-t-[var(--color-forest)] dark:border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-[var(--color-bark)] dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-cream)] dark:bg-gray-900 flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-16 h-16 bg-[var(--color-sand)] dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--color-bark)] dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-[var(--color-bark)] dark:text-gray-400 mb-4">Could not load profile.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[var(--color-forest)] dark:text-emerald-400 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  const initials = getInitials(profile.firstName, profile.lastName);

  return (
    <div className="min-h-screen bg-[var(--color-cream)] dark:bg-gray-900 py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-[var(--color-bark)] dark:text-gray-400 hover:text-[var(--color-forest)] dark:hover:text-emerald-400 font-medium mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Main Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 overflow-hidden border border-[var(--color-sand)]/50 dark:border-gray-700/50">
          
          {/* Cover Image Section - Separate from content */}
          <div className="relative h-36 sm:h-44 bg-gradient-to-br from-[var(--color-forest)] via-emerald-600 to-teal-500">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            
            {/* Edit Button - Positioned in top-right of cover */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-[var(--color-charcoal)] dark:text-white text-sm font-medium rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all hover:shadow-xl"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCancel} 
                    className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-[var(--color-charcoal)] dark:text-white text-sm font-medium rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving} 
                    className="px-4 py-2 bg-[var(--color-forest)] text-white text-sm font-medium rounded-xl shadow-lg hover:bg-[var(--color-forest-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content Section */}
          <div className="px-5 sm:px-8 pb-8">
            
            {/* Avatar + Name Header - Clean overlap positioning */}
            <div className="relative -mt-16 sm:-mt-20 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                
                {/* Avatar */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold ring-4 ring-white dark:ring-gray-800 shadow-xl flex-shrink-0">
                  {initials}
                </div>
                
                {/* Name & Meta */}
                <div className="pb-1 sm:pb-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                    <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--color-charcoal)] dark:text-white truncate">
                      {fullName || 'Camper'}
                    </h1>
                    {profile.isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Member
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-bark)] dark:text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since {getMemberSince(profile.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-sand)] dark:via-gray-700 to-transparent mb-8" />

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              
              {/* First Name */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60 hover:border-[var(--color-forest)]/30 dark:hover:border-emerald-500/30 transition-colors">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  First Name
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={form.firstName} 
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30 focus:border-[var(--color-forest)] dark:focus:border-emerald-500 transition-all" 
                  />
                ) : (
                  <p className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white">{profile.firstName || '—'}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60 hover:border-[var(--color-forest)]/30 dark:hover:border-emerald-500/30 transition-colors">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Last Name
                </label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={form.lastName} 
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })} 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30 focus:border-[var(--color-forest)] dark:focus:border-emerald-500 transition-all" 
                  />
                ) : (
                  <p className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white">{profile.lastName || '—'}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address
                </label>
                <p className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white break-all">{profile.email || '—'}</p>
                <p className="text-xs text-[var(--color-bark)]/50 dark:text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Email cannot be changed
                </p>
              </div>

              {/* Date of Birth */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60 hover:border-[var(--color-forest)]/30 dark:hover:border-emerald-500/30 transition-colors">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 01-1.5-.454M9 6v2m6-2v2m-9 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2z" />
                  </svg>
                  Date of Birth
                </label>
                {isEditing ? (
                  <input 
                    type="date" 
                    value={form.dateOfBirth} 
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} 
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/30 focus:border-[var(--color-forest)] dark:focus:border-emerald-500 transition-all" 
                  />
                ) : (
                  <p className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white">{formatDob(profile.dateOfBirth)}</p>
                )}
              </div>

              {/* Membership Type */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Membership Type
                </label>
                <p className={`text-lg font-bold ${profile.isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-[var(--color-forest)] dark:text-emerald-400'}`}>
                  {profile.isAdmin ? 'Administrator' : 'Standard Member'}
                </p>
              </div>

              {/* Member Since */}
              <div className="bg-[var(--color-cream)]/50 dark:bg-gray-900/50 rounded-2xl p-5 border border-[var(--color-sand)]/60 dark:border-gray-700/60">
                <label className="flex items-center gap-2 text-xs text-[var(--color-bark)]/70 dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Member Since
                </label>
                <p className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white">{getMemberSince(profile.createdAt)}</p>
              </div>

            </div>

            {/* Sign Out Button */}
            <div className="mt-8 pt-6 border-t border-[var(--color-sand)]/60 dark:border-gray-700/60">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
