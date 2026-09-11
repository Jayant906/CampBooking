import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingService } from '../services/bookingService';
import ConfirmDialog from '../components/UI/ConfirmDialog';

const ConfirmationPage = () => {
  const { bookingReference } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingReference) return;
      
      try {
        const response = await bookingService.getByReference(bookingReference);
        if (response.success && response.data) {
          setBooking(response.data);
        } else {
          toast.error('Booking not found');
        }
      } catch {
        toast.error('Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    loadBooking();
  }, [bookingReference]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canCancel = () => {
    if (!booking || booking.status?.toLowerCase() !== 'confirmed') return false;
    const datePart = String(booking.checkInDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    if (!year || !month || !day) return false;
    const cancelDeadline = new Date(year, month - 1, day, 11, 0, 0);
    return new Date() < cancelDeadline;
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const response = await bookingService.cancel(booking.bookingReference);
      if (response.success) {
        toast.success('Booking cancelled successfully');
        setBooking((prev) => ({ ...prev, status: 'Cancelled' }));
        setShowCancelConfirm(false);
      } else {
        toast.error(response.message || 'Failed to cancel booking');
      }
    } catch {
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const originalAmount = Number(booking?.originalAmount || booking?.totalAmount || 0);
  const discountAmount = Number(booking?.discountAmount || 0);
  const totalAmount = Number(booking?.totalAmount || 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading your booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold text-white mb-3">Booking Not Found</h2>
          <p className="text-white/50 mb-6">We couldn't find the booking you're looking for.</p>
          <Link to="/" className="btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center animate-fadeInUp">
            <svg className="w-10 h-10 text-[var(--color-forest)] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-[var(--color-forest)] dark:text-emerald-400 mb-3">
            {booking.status === 'Cancelled' ? 'Booking Cancelled' : 'Booking Confirmed!'}
          </h1>
          <p className="text-white/50 text-lg">
            {booking.status === 'Cancelled'
              ? 'Your booking has been cancelled. Slot released and refund initiated.'
              : 'Your camping adventure awaits. Here are your booking details.'}
          </p>
        </div>

        {/* Booking Card */}
        <div className="card-flat rounded-2xl overflow-hidden mb-8">
          {/* Reference Header */}
          <div className="bg-[var(--color-forest)] dark:bg-emerald-600/20 p-6 text-center">
            <p className="text-white/70 text-sm uppercase tracking-wider mb-2">Booking Reference</p>
            <div className="text-3xl font-mono font-bold text-white tracking-widest">
              {booking.bookingReference}
            </div>
            <p className="text-white/50 text-sm mt-2">
              Save this reference for check-in
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-6 md:p-8">
            <h2 className="font-display text-xl font-semibold text-white mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--color-forest)] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {booking.campName}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-white/50 text-sm mb-1">Check-in</p>
                <p className="font-medium text-white">{formatDate(booking.checkInDate)}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-1">Check-out</p>
                <p className="font-medium text-white">{formatDate(booking.checkOutDate)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-sand)]/50 dark:bg-[#333] space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Duration</span>
                <span className="font-medium text-white">{booking.numberOfNights} night{booking.numberOfNights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Subtotal</span>
                <span className="font-medium text-white">₹{originalAmount.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">Coupon {booking.couponCode ? `(${booking.couponCode})` : ''}</span>
                  <span className="font-medium text-[var(--color-forest)] dark:text-emerald-400">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-[var(--color-sand)] dark:border-[#404040]">
                <span className="font-semibold text-white">Total Paid</span>
                <span className="text-xl font-bold text-[var(--color-forest)] dark:text-emerald-400">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {(booking.cellPhone || booking.billingAddress) && (
              <div className="mt-6 pt-6 border-t border-[var(--color-sand)] dark:border-[#3D3D3D]">
                <h3 className="font-medium text-white mb-3">Guest Information</h3>
                {booking.cellPhone && (
                  <p className="text-white/60 text-sm mb-1">{booking.cellPhone}</p>
                )}
                {booking.billingAddress && (
                  <p className="text-white/60 text-sm">{booking.billingAddress}</p>
                )}
              </div>
            )}

            {/* UPI Payment Receipt Details */}
            <div className="mt-6 pt-6 border-t border-[var(--color-sand)] dark:border-[#3D3D3D] bg-emerald-950/20 border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                  <h3 className="font-semibold text-white text-sm">UPI Payment Receipt</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PAID
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-white/50 block">Payment Method:</span>
                  <span className="text-white font-medium">{booking.paymentMethod || 'UPI (BHIM / GPay / PhonePe)'}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Bank UTR / Transaction Ref:</span>
                  <span className="text-emerald-400 font-mono font-medium">{booking.paymentTransactionId || 'UPI-CONFIRMED'}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Transaction Date:</span>
                  <span className="text-white font-medium">{formatDate(booking.paidAt || booking.createdAt)}</span>
                </div>
                <div>
                  <span className="text-white/50 block">Paid Amount:</span>
                  <span className="text-white font-bold">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-sand)] dark:border-[#3D3D3D] flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                booking.status === 'Confirmed' 
                  ? 'bg-[var(--color-forest)]/10 text-[var(--color-forest)] dark:bg-emerald-500/20 dark:text-emerald-400' 
                  : booking.status === 'Cancelled'
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
              }`}>
                {booking.status === 'Confirmed' && (
                  <span className="w-2 h-2 bg-current rounded-full"></span>
                )}
                {booking.status}
              </span>
              <span className="text-white/40 text-sm">
                Booked {formatDate(booking.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          {canCancel() && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              Cancel Booking
            </button>
          )}
          <Link
            to={`/manage-booking?ref=${booking.bookingReference}`}
            className="btn-secondary text-center"
          >
            Manage Booking
          </Link>
          <Link to="/" className="btn-primary text-center">
            Explore More Camps
          </Link>
        </div>

        {/* Info Note */}
        <div className="card-flat rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-white mb-1">Important Information</h3>
            <p className="text-white/50 text-sm">
              Please keep your booking reference safe. You'll need it for check-in and to manage your booking.
              Check-in time is at 12:00 PM (noon). Free cancellation available until 11:00 AM on check-in day.
            </p>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showCancelConfirm}
          title="Cancel Your Booking?"
          message="Are you sure you want to cancel this booking? This will release your reserved camp slot and initiate refund processing."
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Booking"
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelConfirm(false)}
          isDangerous={true}
          isLoading={isCancelling}
        />
      </div>
    </div>
  );
};

export default ConfirmationPage;
