import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { bookingService } from '../services/bookingService';
import ConfirmDialog from '../components/UI/ConfirmDialog';

// Admin Bookings Page - displays all bookings in system
const AdminBookings = () => {
  // State to store all fetched bookings
  const [bookings, setBookings] = useState([]);
  // State to track loading status while fetching data
  const [isLoading, setIsLoading] = useState(true);
  // State to track pagination info (current page, total pages, total count)
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 });
  // State for cancellation confirm dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Effect hook: Re-fetch bookings whenever page number changes
  useEffect(() => {
    loadBookings();
  }, [pagination.currentPage]);

  // Function: Fetch all bookings from API
  const loadBookings = async () => {
    setIsLoading(true);
    try {
      // Call API to get bookings for current page (10 items per page)
      const response = await bookingService.getAllBookings(pagination.currentPage, 10);
      
      // Check if API response was successful
      if (response.success && response.data) {
        // Extract booking items from response (fallback to empty array if none)
        const items = response.data.items || [];
        setBookings(items);
        
        // Update pagination info with total count and total pages from API
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.totalCount ?? items.length,
          totalPages: response.data.totalPages ?? 1,
        }));
      } else {
        // Show error toast if API returned failure
        toast.error(response.message || 'Failed to load bookings');
        setBookings([]);
      }
    } catch {
      // Show error toast if network/request failed
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      // Stop loading spinner after request completes
      setIsLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      const response = await bookingService.cancel(bookingToCancel.bookingReference);
      if (response.success) {
        toast.success('Booking cancelled successfully before fulfillment. Date slot released.');
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingReference === bookingToCancel.bookingReference
              ? { ...b, status: 'Cancelled' }
              : b
          )
        );
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
      setBookingToCancel(null);
    }
  };

  // Function: Return color styling based on booking status
  const getStatusBadge = (status) => {
    // Map each status to its corresponding Tailwind color classes
    const statusStyles = {
      'confirmed': 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
      'pending': 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
      'cancelled': 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
    };
    // Return matching style or default to pending if status not found
    return statusStyles[status?.toLowerCase()] || statusStyles['pending'];
  };

  // Function: Format date string to readable format (DD-Mon-YYYY)
  const formatDate = (date) => {
    // Return dash if date is empty/null
    if (!date) return '-';
    // Convert to Date object and format using Indian locale (en-IN)
    return new Date(date).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Check if camp check-in time has started (12:00 PM on check-in date)
  const isCampStarted = (checkInDate) => {
    if (!checkInDate) return false;
    const datePart = String(checkInDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return false;
    // Check-in starts at 12:00 PM (noon)
    const checkInStart = new Date(year, month - 1, day, 12, 0, 0);
    return new Date() >= checkInStart;
  };

  // Check if booking is fulfilled (check-out date is in the past)
  const isBookingFulfilled = (checkOutDate) => {
    if (!checkOutDate) return false;
    const datePart = String(checkOutDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return false;
    const checkOutEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    return new Date() > checkOutEnd;
  };

  // Show loading spinner while fetching bookings
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Spinning loader animation */}
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white mb-1">All Bookings</h1>
            <p className="text-white/50">View and manage all bookings across all users</p>
          </div>
          <button onClick={loadBookings} className="btn-secondary text-sm self-start md:self-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Bookings Display Table or Empty State */}
        <div className="card-flat rounded-2xl overflow-hidden">
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Table showing all system bookings */}
              <table className="w-full">
                <thead>
                  {/* Table header row with column titles */}
                  <tr className="border-b border-[var(--color-sand)] dark:border-[#3D3D3D] bg-[var(--color-sand)]/30 dark:bg-[#1a1a1a]">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">Booking Reference</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">User</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">Camp</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">Check-in</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">Check-out</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-white">Total Price</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-white">Status</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-sand)] dark:divide-[#3D3D3D]">
                  {/* Loop through each booking and create table row */}
                  {bookings.map((booking) => {
                    const campStarted = isCampStarted(booking.checkInDate);
                    const fulfilled = isBookingFulfilled(booking.checkOutDate);
                    const canCancel = booking.status !== 'Cancelled' && !campStarted && !fulfilled;

                    return (
                      <tr key={booking.id} className="hover:bg-[var(--color-sand)]/10 dark:hover:bg-[#1a1a1a] transition-colors">
                        {/* Booking Reference Column */}
                        <td className="px-4 py-4">
                          <span className="font-mono text-sm font-medium text-white">{booking.bookingReference}</span>
                        </td>
                        {/* User Info Column */}
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-white">{booking.userFirstName} {booking.userLastName}</p>
                            <p className="text-white/50 text-xs">{booking.userEmail}</p>
                          </div>
                        </td>
                        {/* Camp Info Column */}
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-white">{booking.campName}</p>
                            <p className="text-white/50 text-xs">{booking.campLocation}</p>
                          </div>
                        </td>
                        {/* Check-in Date Column */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-white">{formatDate(booking.checkInDate)}</p>
                        </td>
                        {/* Check-out Date Column */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-white">{formatDate(booking.checkOutDate)}</p>
                        </td>
                        {/* Total Price Column */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-[var(--color-forest)] dark:text-emerald-400">
                            ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')}
                          </p>
                        </td>
                        {/* Status Column */}
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                            <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                            {booking.status || 'Confirmed'}
                          </span>
                        </td>
                        {/* Action Column */}
                        <td className="px-4 py-4 text-center">
                          {canCancel ? (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Cancel Booking
                            </button>
                          ) : booking.status === 'Cancelled' ? (
                            <span className="text-xs text-white/40 italic">Cancelled</span>
                          ) : fulfilled ? (
                            <span className="text-xs text-white/40 italic">Fulfilled</span>
                          ) : campStarted ? (
                            <span className="text-xs text-amber-400/80 italic font-medium">In Progress</span>
                          ) : (
                            <span className="text-xs text-white/40 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center">
                <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Bookings</h3>
              <p className="text-white/50">No bookings found in the system.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: page }))}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${
                  pagination.currentPage === page
                    ? 'bg-[var(--color-forest)] dark:bg-emerald-600 text-white'
                    : 'bg-[var(--color-sand)]/30 dark:bg-[#333] text-white/70 hover:bg-[var(--color-sand)]/50 dark:hover:bg-[#404040]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmDialog
          isOpen={showCancelConfirm}
          title="Cancel Booking Before Fulfillment?"
          message={
            bookingToCancel
              ? `Are you sure you want to cancel booking ${bookingToCancel.bookingReference} for ${bookingToCancel.campName}? The slot will be released and refund process initiated.`
              : 'Are you sure you want to cancel this booking?'
          }
          confirmLabel="Cancel Booking"
          cancelLabel="Keep Booking"
          onConfirm={handleConfirmCancel}
          onCancel={() => {
            setShowCancelConfirm(false);
            setBookingToCancel(null);
          }}
          isDangerous={true}
          isLoading={isCancelling}
        />
      </div>
    </div>
  );
};

export default AdminBookings;

