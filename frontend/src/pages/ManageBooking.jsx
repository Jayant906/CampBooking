import { useState, useEffect } from 'react';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingService } from '../services/bookingService';
import { ratingService } from '../services/ratingService';
import StarRating from '../components/Camp/StarRating';
import { useAppSelector } from '../store/hooks';

const ManageBooking = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [bookingReference, setBookingReference] = useState(searchParams.get('ref') || '');
  const [lastSearchedReference, setLastSearchedReference] = useState(searchParams.get('ref') || '');
  const [myBookings, setMyBookings] = useState([]);
  const [isMyBookingsLoading, setIsMyBookingsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [referenceToRemove, setReferenceToRemove] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [scrollToDetailsOnLoad, setScrollToDetailsOnLoad] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setBookingReference(ref);
      handleSearch(ref);
    }
  }, [searchParams]);

  const loadMyBookings = async () => {
    if (!isAuthenticated) {
      setMyBookings([]);
      return;
    }

    setIsMyBookingsLoading(true);
    try {
      const response = await bookingService.getUserBookings();
      if (response.success && response.data) {
        setMyBookings(response.data);
      } else {
        setMyBookings([]);
      }
    } catch {
      setMyBookings([]);
      toast.error('Failed to load your bookings');
    } finally {
      setIsMyBookingsLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!booking || !scrollToDetailsOnLoad) return;

    const detailsSection = document.getElementById('booking-details-section');
    if (detailsSection) {
      detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setScrollToDetailsOnLoad(false);
  }, [booking, scrollToDetailsOnLoad]);

  const scrollToResultSection = (sectionId) => {
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const handleFindBookingSubmit = (e) => {
    e.preventDefault();
    handleSearch(bookingReference);
  };

  const handleSearch = async (referenceToSearch) => {
    if (!referenceToSearch?.trim()) {
      toast.warning('Please enter a booking reference');
      return;
    }

    setLastSearchedReference(referenceToSearch);

    setIsLoading(true);
    try {
      const response = await bookingService.getByReference(referenceToSearch);
      if (response.success && response.data) {
        setBooking(response.data);
        // Check for existing rating
        if (response.data.rating) {
          try {
            const ratingResponse = await ratingService.getByBookingId(response.data.id);
            if (ratingResponse.success && ratingResponse.data) {
              setExistingRating(ratingResponse.data);
            }
          } catch {
            // No rating exists
          }
        } else {
          setExistingRating(null);
        }
        scrollToResultSection('booking-details-section');
      } else {
        toast.error('Booking not found. Please check your reference number.');
        setBooking(null);
        setExistingRating(null);
        scrollToResultSection('booking-search-result-section');
      }
    } catch {
      toast.error('Failed to find booking');
      setBooking(null);
      setExistingRating(null);
      scrollToResultSection('booking-search-result-section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = (bookingRef) => {
    setBookingToCancel(bookingRef);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      const response = await bookingService.cancel(bookingToCancel);
      if (response.success) {
        toast.success('Booking cancelled successfully');
        setShowCancelModal(false);
        setBookingToCancel(null);
        // Refresh booking data
        await handleSearch(bookingToCancel);
        await loadMyBookings();
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    if (!isCancelling) {
      setShowCancelModal(false);
      setBookingToCancel(null);
    }
  };

  const handleSubmitRating = async () => {
    if (!booking || rating === 0) {
      toast.warning('Please select a rating');
      return;
    }

    setIsRating(true);
    try {
      const ratingData = {
        bookingReference: booking.bookingReference,
        starRating: rating,
        review: comment.trim() || undefined,
      };

      const response = await ratingService.create(ratingData);
      if (response.success) {
        toast.success('Thank you for your rating!');
        setShowRatingForm(false);
        setExistingRating(response.data || null);
        // Refresh booking
        await handleSearch(booking.bookingReference);
        await loadMyBookings();
      } else {
        toast.error(response.message || 'Failed to submit rating');
      }
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setIsRating(false);
    }
  };

  const handleRemove = (reference) => {
    setReferenceToRemove(reference);
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (!referenceToRemove) return;
    setIsRemoving(true);
    try {
      const response = await bookingService.remove(referenceToRemove);
      if (response.success) {
        toast.success('Booking removed successfully');
        if (booking?.bookingReference === referenceToRemove) {
          setBooking(null);
          setExistingRating(null);
        }
        await loadMyBookings();
      } else {
        toast.error(response.message || 'Failed to remove booking');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove booking');
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
      setReferenceToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setReferenceToRemove(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toDateOnly = (value) => {
    if (!value) return null;
    const datePart = String(value).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const getCancelDeadline = (checkInDateStr) => {
    if (!checkInDateStr) return null;
    const datePart = String(checkInDateStr).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return null;
    // Check-in at noon (12pm); cancel deadline = 11am (1 hour before check-in)
    return new Date(year, month - 1, day, 11, 0, 0);
  };

  const canCancel = () => {
    if (!booking || booking.status?.toLowerCase() !== 'confirmed') return false;
    const cancelDeadline = getCancelDeadline(booking.checkInDate);
    if (!cancelDeadline) return false;
    return new Date() < cancelDeadline;
  };

  const canRate = () => {
    if (!booking || booking.status?.toLowerCase() === 'cancelled') return false;
    const checkOutDate = new Date(booking.checkOutDate);
    const today = new Date();
    return checkOutDate <= today && !booking.rating;
  };

  const canCancelBooking = (item) => {
    if (!item || item.status?.toLowerCase() !== 'confirmed') return false;
    const cancelDeadline = getCancelDeadline(item.checkInDate);
    if (!cancelDeadline) return false;
    return new Date() < cancelDeadline;
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream)] dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--color-charcoal)] dark:text-white mb-3">
            Manage Bookings
          </h1>
          <p className="text-[var(--color-bark)] dark:text-gray-400 font-body">
            View, manage, or cancel your camping reservations
          </p>
        </div>

        {/* Search Form */}
        <div className="card-flat p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-forest)]/10 dark:bg-[var(--color-forest)]/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white">Find a Booking</h2>
          </div>
          <label className="block text-sm font-medium text-[var(--color-charcoal)] dark:text-gray-300 mb-2 font-body">Booking Reference</label>
          <form onSubmit={handleFindBookingSubmit} className="flex gap-3">
            <input
              type="text"
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
              placeholder="e.g., ABC12345"
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white placeholder-[var(--color-bark)]/50 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/20 transition font-mono uppercase tracking-wider"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </>
              )}
            </button>
          </form>
        </div>

        {isAuthenticated && (
          <div className="card-flat p-6 sm:p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--color-forest)]/10 dark:bg-[var(--color-forest)]/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white">My Bookings</h2>
            </div>
            {isMyBookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-[var(--color-forest)]/20 border-t-[var(--color-forest)] rounded-full animate-spin"></div>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[var(--color-sand)] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[var(--color-bark)] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[var(--color-bark)] dark:text-gray-400 font-body">You don't have any bookings yet.</p>
                <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Book Your First Camp
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-700 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-[var(--color-forest)]/30 transition-colors">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="font-mono text-xs bg-[var(--color-sand)] dark:bg-gray-700 px-2 py-0.5 rounded">{item.bookingReference}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.status === 'Confirmed' && (
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <h3 className={`font-display font-semibold ${item.status === 'Confirmed' ? 'text-[var(--color-charcoal)] dark:text-white' : 'text-[var(--color-bark)]/50 dark:text-gray-500 line-through'}`}>
                          {item.campName}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-bark)] dark:text-gray-400 font-body">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(item.checkInDate).toLocaleDateString('en-IN')} → {new Date(item.checkOutDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Confirmed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : (item.status === 'Cancelled' || item.status === 'PendingPayment')
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {item.status === 'PendingPayment' ? 'Cancelled' : item.status}
                      </span>
                      <button
                        onClick={() => {
                          setScrollToDetailsOnLoad(true);
                          handleSearch(item.bookingReference);
                        }}
                        className="px-4 py-2 text-sm font-medium text-[var(--color-forest)] hover:bg-[var(--color-forest)]/10 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                      {item.status === 'Confirmed' && canCancelBooking(item) && (
                        <button
                          onClick={() => handleCancelClick(item.bookingReference)}
                          disabled={isCancelling}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div id="booking-details-section" className="card-flat p-6 sm:p-8">
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-forest)]/10 dark:bg-[var(--color-forest)]/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white">
                  Booking Details
                </h2>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                booking.status === 'Confirmed'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : (booking.status === 'Cancelled' || booking.status === 'PendingPayment')
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {booking.status === 'PendingPayment' ? 'Cancelled' : booking.status}
              </span>
            </div>

            {/* Reference */}
            <div className="bg-[var(--color-forest)] dark:bg-[var(--color-forest)]/90 rounded-xl p-5 mb-6 text-center">
              <p className="text-sm text-white/70 mb-1 font-body">Booking Reference</p>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
                {booking.bookingReference}
              </p>
            </div>

            {/* Camp Info */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-[var(--color-sand)] dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--color-charcoal)] dark:text-white">{booking.campName}</h3>
                  <p className="text-[var(--color-bark)] dark:text-gray-400 font-body flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {booking.campLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Check-in</p>
                </div>
                <p className="font-semibold text-[var(--color-charcoal)] dark:text-white font-body">{formatDate(booking.checkInDate)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Check-out</p>
                </div>
                <p className="font-semibold text-[var(--color-charcoal)] dark:text-white font-body">{formatDate(booking.checkOutDate)}</p>
              </div>
            </div>

            {/* Price Summary */}
            <div className="border-t border-[var(--color-sand)] dark:border-gray-700 pt-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[var(--color-bark)] dark:text-gray-400 font-body">Number of Nights</span>
                <span className="font-semibold text-[var(--color-charcoal)] dark:text-white">{booking.numberOfNights}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-[var(--color-charcoal)] dark:text-white">Total Amount</span>
                <span className="font-display text-2xl font-bold text-[var(--color-forest)]">₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Guest Info */}
            <div className="border-t border-[var(--color-sand)] dark:border-gray-700 pt-5 mb-6">
              <h4 className="font-display font-semibold text-[var(--color-charcoal)] dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Guest Information
              </h4>
              {booking.cellPhone && (
                <p className="text-[var(--color-bark)] dark:text-gray-400 font-body flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {booking.cellPhone}
                </p>
              )}
              {booking.billingAddress && (
                <p className="text-[var(--color-bark)] dark:text-gray-400 font-body flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {booking.billingAddress}
                </p>
              )}
            </div>

            {/* UPI Payment Status Card */}
            <div className="border-t border-[var(--color-sand)] dark:border-gray-700 pt-5 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Payment Status
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    {booking.paymentStatus === 'Completed' || booking.status === 'Confirmed' ? 'PAID' : (booking.paymentStatus || 'PENDING')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Method:</span>
                    <span className="font-medium text-gray-800 dark:text-white">{booking.paymentMethod || 'UPI'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Transaction Reference / UTR:</span>
                    <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">{booking.paymentTransactionId || 'UPI-CONFIRMED'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Rating */}
            {existingRating && (
              <div className="border-t border-[var(--color-sand)] dark:border-gray-700 pt-5 mb-6">
                <h4 className="font-display font-semibold text-[var(--color-charcoal)] dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Your Rating
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={existingRating.starRating} readonly size="md" />
                  <span className="text-[var(--color-bark)] dark:text-gray-400 font-body">({existingRating.starRating}/5)</span>
                </div>
                {existingRating.review && (
                  <p className="text-[var(--color-bark)] dark:text-gray-400 italic font-body bg-[var(--color-sand)]/50 dark:bg-gray-800 p-3 rounded-lg">"{existingRating.review}"</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-[var(--color-sand)] dark:border-gray-700 pt-6 space-y-4">
              {/* Cancel Button */}
              {canCancel() ? (
                <button
                  onClick={() => handleCancelClick(booking.bookingReference)}
                  disabled={isCancelling}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Booking
                    </>
                  )}
                </button>
              ) : booking.status?.toLowerCase() === 'confirmed' ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Cancellation Window Closed</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Cancellations are allowed up to 1 hour before noon check-in (11:00 AM on check-in date).
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Rating Section */}
              {canRate() && !showRatingForm && (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"> // Solid star icon
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Rate Your Stay
                </button>
              )}

              {showRatingForm && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5">
                  <h4 className="font-display font-semibold text-[var(--color-charcoal)] dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Rate Your Experience
                  </h4>
                  <div className="flex justify-center mb-4">
                    <StarRating
                      rating={rating}
                      onRatingChange={setRating}
                      size="lg"
                    />
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience (optional)"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-[var(--color-sand)] dark:border-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white placeholder-[var(--color-bark)]/50 dark:placeholder-gray-500 focus:outline-none focus:border-[var(--color-forest)] focus:ring-2 focus:ring-[var(--color-forest)]/20 transition font-body resize-none mb-4"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRatingForm(false)}
                      className="flex-1 py-3 bg-[var(--color-sand)] dark:bg-gray-700 hover:bg-[var(--color-sand)]/80 dark:hover:bg-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitRating}
                      disabled={isRating || rating === 0}
                      className="flex-1 py-3 bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Rating'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(booking.status === 'Cancelled' || booking.status === 'PendingPayment') && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-700 dark:text-red-400 font-body flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {booking.status === 'PendingPayment'
                      ? 'This booking was cancelled because payment was not completed.'
                      : 'This booking has been cancelled.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Booking Found */}
        {!booking && !isLoading && lastSearchedReference && (
          <div id="booking-search-result-section" className="card-flat p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-[var(--color-sand)] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[var(--color-bark)] dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white mb-2">No Booking Found</h3>
            <p className="text-[var(--color-bark)] dark:text-gray-400 font-body mb-6">We couldn't find a booking with that reference number.</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Book a Camp
            </Link>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="animate-fadeIn w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-red-50 dark:bg-red-500/10 p-6 text-center border-b border-red-100 dark:border-red-500/20">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--color-charcoal)] dark:text-white mb-2">Cancel Booking?</h3>
                <p className="text-[var(--color-bark)] dark:text-gray-400 font-body">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {bookingToCancel && (
                  <div className="bg-[var(--color-sand)]/50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-[var(--color-bark)] dark:text-gray-400 font-body">
                      <span className="font-semibold text-[var(--color-charcoal)] dark:text-white">Booking Reference:</span>
                    </p>
                    <p className="font-mono text-lg text-[var(--color-charcoal)] dark:text-white tracking-wider">{bookingToCancel}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseCancelModal}
                    disabled={isCancelling}
                    className="flex-1 py-3 bg-[var(--color-sand)] dark:bg-gray-700 hover:bg-[var(--color-sand)]/80 dark:hover:bg-gray-600 rounded-xl text-[var(--color-charcoal)] dark:text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={isCancelling}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Remove Booking Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showRemoveConfirm}
          title="Remove Booking?"
          message="Remove this booking permanently? This cannot be undone."
          confirmLabel="Yes, Remove"
          cancelLabel="Keep It"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
          isDangerous={true}
          isLoading={isRemoving}
        />
      </div>
    </div>
  );
};

export default ManageBooking;
