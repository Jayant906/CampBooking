import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAppSelector } from '../store/hooks';
import { campService } from '../services/campService';
import { bookingService } from '../services/bookingService';
import { couponService } from '../services/couponService';
import { paymentService } from '../services/paymentService';
import { resolveImageUrl, DEFAULT_CAMP_IMAGE } from '../services/imageUrl';
import UpiPaymentModal from '../components/UpiPaymentModal';

// Phone validation rules by country code
const phoneValidationRules = {
  '+91': { minLength: 10, maxLength: 10, message: 'India requires exactly 10 digits' },
  '+1': { minLength: 10, maxLength: 10, message: 'US/Canada requires exactly 10 digits' },
  '+44': { minLength: 10, maxLength: 11, message: 'UK requires 10-11 digits' },
  '+61': { minLength: 9, maxLength: 9, message: 'Australia requires exactly 9 digits' },
  '+971': { minLength: 9, maxLength: 9, message: 'UAE requires exactly 9 digits' },
  '+65': { minLength: 8, maxLength: 8, message: 'Singapore requires exactly 8 digits' },
  '+49': { minLength: 10, maxLength: 11, message: 'Germany requires 10-11 digits' },
  '+33': { minLength: 9, maxLength: 9, message: 'France requires exactly 9 digits' },
  '+39': { minLength: 10, maxLength: 10, message: 'Italy requires exactly 10 digits' },
  '+34': { minLength: 9, maxLength: 9, message: 'Spain requires exactly 9 digits' },
  '+31': { minLength: 9, maxLength: 9, message: 'Netherlands requires exactly 9 digits' },
  '+41': { minLength: 9, maxLength: 9, message: 'Switzerland requires exactly 9 digits' },
  '+81': { minLength: 10, maxLength: 11, message: 'Japan requires 10-11 digits' },
  '+82': { minLength: 9, maxLength: 10, message: 'South Korea requires 9-10 digits' },
  '+86': { minLength: 11, maxLength: 11, message: 'China requires exactly 11 digits' },
  '+852': { minLength: 8, maxLength: 8, message: 'Hong Kong requires exactly 8 digits' },
  '+60': { minLength: 9, maxLength: 10, message: 'Malaysia requires 9-10 digits' },
  '+64': { minLength: 8, maxLength: 10, message: 'New Zealand requires 8-10 digits' },
  '+62': { minLength: 10, maxLength: 12, message: 'Indonesia requires 10-12 digits' },
  '+966': { minLength: 9, maxLength: 9, message: 'Saudi Arabia requires exactly 9 digits' },
  '+974': { minLength: 8, maxLength: 8, message: 'Qatar requires exactly 8 digits' },
  '+27': { minLength: 9, maxLength: 9, message: 'South Africa requires exactly 9 digits' },
  '+234': { minLength: 10, maxLength: 11, message: 'Nigeria requires 10-11 digits' },
  '+20': { minLength: 10, maxLength: 10, message: 'Egypt requires exactly 10 digits' },
  '+55': { minLength: 10, maxLength: 11, message: 'Brazil requires 10-11 digits' },
  '+54': { minLength: 10, maxLength: 10, message: 'Argentina requires exactly 10 digits' },
  '+52': { minLength: 10, maxLength: 10, message: 'Mexico requires exactly 10 digits' },
};

const getPhoneValidation = (countryCode) => {
  const rules = phoneValidationRules[countryCode] || { minLength: 7, maxLength: 12, message: 'Enter 7-12 digits' };
  return rules;
};

const BookingPage = () => {
  const WEEKEND_MULTIPLIER = 1.25;
  const { campId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [camp, setCamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsList, setShowCouponsList] = useState(false);
  const [upiOrder, setUpiOrder] = useState(null);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      checkInDate,
      checkOutDate,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      countryCode: '+91',
      billingAddress: '',
      phoneNumber: '',
    },
  });

  const watchCheckIn = watch('checkInDate');
  const watchCheckOut = watch('checkOutDate');
  const watchCountryCode = watch('countryCode');

  useEffect(() => {
    const loadCamp = async () => {
      if (!campId) return;
      
      try {
        const response = await campService.getCampById(campId);
        if (response.success && response.data) {
          setCamp(response.data);
        } else {
          toast.error('Camp not found');
          navigate('/');
        }
      } catch (error) {
        toast.error('Failed to load camp details');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadCamp();
  }, [campId, navigate]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const response = await couponService.getVisibleCoupons();
        if (response.success && response.data) {
          setAvailableCoupons(response.data);
        }
      } catch (error) {
        console.error('Failed to load coupons:', error);
      }
    };
    loadCoupons();
  }, []);

  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: 'info',
        message: 'Booking dates changed. Reapply your coupon to continue using the discount.',
      });
    }
  }, [watchCheckIn, watchCheckOut, campId]);

  const calculateNights = () => {
    if (!watchCheckIn || !watchCheckOut) return 0;
    const checkIn = new Date(watchCheckIn);
    const checkOut = new Date(watchCheckOut);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getPricingBreakdown = () => {
    if (!camp || !watchCheckIn || !watchCheckOut) {
      return {
        weekdayNights: 0,
        weekendNights: 0,
        weekdayRate: 0,
        weekendRate: 0,
        totalPrice: 0,
      };
    }

    const checkIn = new Date(watchCheckIn);
    const checkOut = new Date(watchCheckOut);
    let weekdayNights = 0;
    let weekendNights = 0;

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      const isWeekend = day === 5 || day === 6 || day === 0; // Fri, Sat, Sun
      if (isWeekend) weekendNights += 1;
      else weekdayNights += 1;
    }

    const weekdayRate = Number(camp.pricePerNight || 0);
    const weekendRate = Math.round(weekdayRate * WEEKEND_MULTIPLIER);
    const totalPrice = weekdayNights * weekdayRate + weekendNights * weekendRate;

    return { weekdayNights, weekendNights, weekdayRate, weekendRate, totalPrice };
  };

  const nights = calculateNights();
  const { weekdayNights, weekendNights, weekdayRate, weekendRate, totalPrice } = getPricingBreakdown();
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const originalTotalPrice = Number(appliedCoupon?.originalTotalAmount ?? totalPrice);
  const finalTotalPrice = Number(appliedCoupon?.finalTotalAmount ?? totalPrice);
  const amenitiesList = Array.isArray(camp?.amenities)
    ? camp.amenities
    : typeof camp?.amenities === 'string'
      ? camp.amenities.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  const campImage = resolveImageUrl(camp?.imageUrl, DEFAULT_CAMP_IMAGE);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponFeedback({ type: 'error', message: 'Please enter a coupon code' });
      return;
    }

    if (nights < 1) {
      setCouponFeedback({ type: 'error', message: 'Please select valid dates before applying a coupon' });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await bookingService.validateCoupon({
        campId: Number(campId),
        code: couponCode.trim(),
        checkInDate: watchCheckIn,
        checkOutDate: watchCheckOut,
      });

      if (response.success && response.data) {
        setAppliedCoupon(response.data);
        setCouponCode(response.data.code);
        setCouponFeedback({
          type: 'success',
          message: `Coupon applied successfully. You saved ₹${Number(response.data.discountAmount || 0).toLocaleString('en-IN')}.`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({ type: 'error', message: response.message || 'Failed to apply coupon' });
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: 'error',
        message: error?.response?.data?.message || 'Invalid or inactive coupon code',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponFeedback({ type: 'info', message: 'Coupon removed from this booking.' });
  };

  const onSubmit = async (data) => {
    if (!isAuthenticated) {
      toast.warning('Please login to make a booking');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (nights < 1) {
      toast.error('Please select valid dates');
      return;
    }

    if (nights > 30) {
      toast.error('Booking can be made for maximum 30 nights only');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        campId: Number(campId),
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        billingAddress: data.billingAddress,
        cellPhone: `${data.countryCode || '+91'} ${data.phoneNumber}`.trim(),
        couponCode: appliedCoupon?.code || '',
      };

      const response = await paymentService.createUpiOrder(bookingData);
      
      if (response.success && response.data) {
        setUpiOrder(response.data);
        setIsUpiModalOpen(true);
      } else {
        toast.error(response.message || 'Failed to initiate payment');
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && apiErrors.length > 0) {
        toast.error(apiErrors[0]);
      } else {
        toast.error(apiMessage || 'An error occurred while processing your booking');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (verificationPayload) => {
    const response = await paymentService.verifyPayment(verificationPayload);
    if (response.success && response.data) {
      toast.success('Payment confirmed! Booking completed successfully.');
      setIsUpiModalOpen(false);
      navigate(`/confirmation/${response.data.bookingReference}`);
    } else {
      toast.error(response.message || 'Payment verification failed');
    }
  };

  const handlePaymentModalClose = async () => {
    setIsUpiModalOpen(false);
    if (upiOrder?.bookingReference) {
      try {
        await bookingService.cancel(upiOrder.bookingReference);
      } catch {
        // Silently handle if already cancelled
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading camp details...</p>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-20 h-20 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Camp Not Found</h2>
        <p className="text-white/50">The requested camp could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-white mb-2">Complete Your Booking</h1>
          <p className="text-white/50">Review your details and confirm your camping adventure</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Date Selection Card */}
              <div className="card-flat rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[var(--color-forest)] dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Select Your Dates</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">Check-in Date</label>
                    <input
                      type="date"
                      {...register('checkInDate', { required: 'Check-in date is required' })}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                    {errors.checkInDate && <p className="form-error">{errors.checkInDate.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Check-out Date</label>
                    <input
                      type="date"
                      {...register('checkOutDate', {
                        required: 'Check-out date is required',
                        validate: (value) => {
                          if (!watchCheckIn) return true;
                          const diff = Math.ceil((new Date(value) - new Date(watchCheckIn)) / 86400000);
                          if (diff < 1) return 'Check-out must be after check-in';
                          if (diff > 30) return 'Maximum booking duration is 30 nights';
                          return true;
                        }
                      })}
                      min={watchCheckIn || new Date().toISOString().split('T')[0]}
                      max={watchCheckIn ? (() => { const d = new Date(watchCheckIn); d.setDate(d.getDate()+30); return d.toISOString().split('T')[0]; })() : undefined}
                      className="input-field"
                    />
                    {errors.checkOutDate && <p className="form-error">{errors.checkOutDate.message}</p>}
                  </div>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="card-flat rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[var(--color-forest)] dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white">Guest Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      className="input-field"
                    />
                    {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input-field"
                    />
                    {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="input-field"
                    />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        {...register('countryCode', { value: '+91' })}
                        className="input-field w-28"
                        defaultValue="+91"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+1">🇨🇦 +1</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+31">🇳🇱 +31</option>
                        <option value="+41">🇨🇭 +41</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+82">🇰🇷 +82</option>
                        <option value="+86">🇨🇳 +86</option>
                        <option value="+852">🇭🇰 +852</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+64">🇳🇿 +64</option>
                        <option value="+62">🇮🇩 +62</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+20">🇪🇬 +20</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+52">🇲🇽 +52</option>
                      </select>
                      <input
                        type="tel"
                        {...register('phoneNumber', {
                          required: 'Phone number is required',
                          validate: (value) => {
                            const digitsOnly = value.replace(/\D/g, '');
                            const rules = getPhoneValidation(watchCountryCode || '+91');
                            if (digitsOnly.length < rules.minLength || digitsOnly.length > rules.maxLength) {
                              return rules.message;
                            }
                            return true;
                          }
                        })}
                        placeholder={watchCountryCode === '+91' ? '10-digit number' : 'Phone number'}
                        className="input-field flex-1"
                      />
                    </div>
                    {errors.phoneNumber && <p className="form-error">{errors.phoneNumber.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Billing Address</label>
                    <textarea
                      rows={3}
                      {...register('billingAddress', {
                        required: 'Billing address is required',
                        maxLength: {
                          value: 500,
                          message: 'Billing address cannot exceed 500 characters'
                        }
                      })}
                      className="input-field"
                      placeholder="Enter your billing address"
                    />
                    {errors.billingAddress && <p className="form-error">{errors.billingAddress.message}</p>}
                  </div>
                </div>
              </div>

              {/* Coupon Card */}
              <div className="card-flat rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[var(--color-forest)] dark:text-emerald-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m0 0c0 1.657 1.343 3 3 3m-3-3H5m4 0h10m-7 6h4a2 2 0 002-2V7a2 2 0 00-2-2h-4m0 12H8a2 2 0 01-2-2V7a2 2 0 012-2h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Apply Coupon</h2>
                    <p className="text-white/50 text-sm">Add a valid coupon before confirming your booking</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponFeedback?.type === 'error') {
                        setCouponFeedback(null);
                      }
                    }}
                    className="input-field flex-1 uppercase"
                    placeholder="Enter coupon code"
                    maxLength={50}
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={handleRemoveCoupon} className="btn-secondary sm:min-w-[140px]">
                      Remove Coupon
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || nights < 1}
                      className="btn-primary sm:min-w-[140px] disabled:opacity-50"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply Coupon'}
                    </button>
                  )}
                </div>

                {couponFeedback && (
                  <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                    couponFeedback.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : couponFeedback.type === 'error'
                      ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : 'bg-[var(--color-sand)]/50 dark:bg-[#333] text-white/70 border border-[var(--color-sand)] dark:border-[#404040]'
                  }`}>
                    {couponFeedback.message}
                  </div>
                )}

                {appliedCoupon && (
                  <div className="mt-4 rounded-xl bg-[var(--color-sand)]/50 dark:bg-[#333] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-white font-medium">Coupon {appliedCoupon.code}</p>
                        <p className="text-white/50 text-sm">Valid for stays of {appliedCoupon.minNights} night{appliedCoupon.minNights > 1 ? 's' : ''} or more</p>
                      </div>
                      <span className="text-[var(--color-forest)] dark:text-emerald-400 font-semibold">
                        -₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Available Coupons Section */}
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCouponsList(!showCouponsList)}
                      className="flex items-center gap-2 text-[var(--color-forest)] dark:text-emerald-400 text-sm font-medium hover:underline"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showCouponsList ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {showCouponsList ? 'Hide' : 'View'} Available Coupons ({availableCoupons.length})
                    </button>
                    
                    {showCouponsList && (
                      <div className="mt-4 space-y-3">
                        {availableCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-dashed border-[var(--color-forest)]/30 dark:border-emerald-500/30 bg-[var(--color-forest)]/5 dark:bg-emerald-500/5 hover:border-[var(--color-forest)] dark:hover:border-emerald-400 transition-colors cursor-pointer"
                            onClick={() => {
                              setCouponCode(coupon.code);
                              setShowCouponsList(false);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[var(--color-forest)] dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--color-forest)] dark:text-emerald-400">{coupon.code}</p>
                                <p className="text-white/50 text-sm">Min. {coupon.minNights} night{coupon.minNights > 1 ? 's' : ''} stay required</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[var(--color-forest)] dark:text-emerald-400">₹{coupon.discountAmount.toLocaleString('en-IN')} OFF</p>
                              <p className="text-white/40 text-xs">Click to apply</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || nights < 1}
                className="w-full btn-primary py-4 text-base disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 text-white" style={{ color: '#ffffff' }}>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating UPI Order...
                  </span>
                ) : (
                  <span className="font-semibold text-white tracking-wide text-base" style={{ color: '#ffffff' }}>
                    Pay with UPI — ₹{finalTotalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-flat rounded-2xl overflow-hidden sticky top-24">
              {/* Camp Image */}
              <div className="relative h-48">
                <img
                  src={campImage}
                  alt={camp.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src !== DEFAULT_CAMP_IMAGE) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_CAMP_IMAGE;
                    }
                  }}
                />
                <div className="image-text-overlay" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="image-text-title text-lg font-semibold">{camp.name}</h3>
                  <p className="image-text-subtitle text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {camp.location}
                  </p>
                </div>
              </div>
              
              {/* Summary Content */}
              <div className="p-6">
                <h4 className="font-semibold text-white mb-4">Price Breakdown</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Weekday rate (Mon-Thu)</span>
                    <span className="text-white">₹{Number(weekdayRate).toLocaleString('en-IN')}/night</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Weekend rate (Fri-Sun)</span>
                    <span className="text-white">₹{Number(weekendRate).toLocaleString('en-IN')}/night</span>
                  </div>
                  
                  <div className="border-t border-[var(--color-sand)] dark:border-[#3D3D3D] my-4" />
                  
                  <div className="flex justify-between">
                    <span className="text-white/60">Weekday nights × {weekdayNights}</span>
                    <span className="text-white">₹{(weekdayNights * weekdayRate).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Weekend nights × {weekendNights}</span>
                    <span className="text-white">₹{(weekendNights * weekendRate).toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="border-t border-[var(--color-sand)] dark:border-[#3D3D3D] my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">Subtotal ({nights} nights)</span>
                    <span className="text-white">₹{originalTotalPrice.toLocaleString('en-IN')}</span>
                  </div>

                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Coupon ({appliedCoupon.code})</span>
                        <span className="font-medium text-[var(--color-forest)] dark:text-emerald-400">-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--color-sand)] dark:border-[#3D3D3D]">
                        <span className="font-semibold text-white">Total After Discount</span>
                        <span className="text-xl font-bold text-[var(--color-forest)] dark:text-emerald-400">₹{finalTotalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}

                  {!appliedCoupon && (
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--color-sand)] dark:border-[#3D3D3D]">
                      <span className="font-semibold text-white">Total</span>
                      <span className="text-xl font-bold text-[var(--color-forest)] dark:text-emerald-400">₹{finalTotalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {amenitiesList.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[var(--color-sand)] dark:border-[#3D3D3D]">
                    <h4 className="font-semibold text-white mb-3">Included Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 text-[var(--color-forest)] dark:text-emerald-400 text-xs font-medium rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cancellation Policy */}
                <div className="mt-6 p-4 rounded-xl bg-[var(--color-sand)]/50 dark:bg-[#333]">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--color-forest)] dark:text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <p className="font-medium text-white text-sm">Free Cancellation</p>
                      <p className="text-white/50 text-xs mt-1">Cancel up to 11 AM on check-in day for a full refund</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Gateway Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={handlePaymentModalClose}
        order={upiOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default BookingPage;
