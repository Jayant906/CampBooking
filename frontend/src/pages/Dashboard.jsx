import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchCamps, setSearchParams } from '../store/slices/campSlice';
import { bookingService } from '../services/bookingService';
import { campService } from '../services/campService';
import CampCard from '../components/Camp/CampCard';
import Pagination from '../components/Common/Pagination';
import { resolveImageUrl, DEFAULT_CAMP_IMAGE } from '../services/imageUrl';

// ============ DATE UTILITY FUNCTIONS ============
// Convert Date object to "YYYY-MM-DD" format for HTML input[type="date"]
const toLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');  // Month is 0-11, add 1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse HTML date input string ("2026-04-12") back to Date object
const parseDateInputAsLocal = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);  // Month is 0-11
};

// Get tomorrow's date (default checkout when user selects checkin)
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalDateInputValue(d);
};

/**
 * Dashboard Component - Camp Search & Browse
 * 
 * User journey:
 * 1. User selects check-in/check-out dates
 * 2. Click search → API returns available camps (no date conflicts)
 * 3. View camp cards with pictures, price, rating
 * 4. Click "Book Now" → go to booking page with dates pre-filled
 * 
 * Key features:
 * - Date range search (1-30 nights max)
 * - Location filter (contains search)
 * - Pagination (6 camps per page)
 * - Quick explore destinations (featured camps)
 * - Shows existing bookings on camp cards
 */
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get search state from Redux store
  // camps: list of camps matching search criteria
  // isLoading: true while API request in progress
  // error: error message if search fails
  // searchParams: current search filters (dates, location, etc.)
  // pageNumber: current page (1, 2, 3, ...)
  // totalPages: total pages available
  const {
    camps,
    isLoading,
    error,
    searchParams,
    totalCount,
    pageNumber,
    totalPages,
  } = useAppSelector((state) => state.camps);
  
  // Local component state
  const [campBookings, setCampBookings] = useState({});      // Existing bookings for each camp
  const [allCamps, setAllCamps] = useState([]);              // All camps (for "Quick Trips")
  const [localDates, setLocalDates] = useState({              // User's date inputs
    checkIn: toLocalDateInputValue(),
    checkOut: getTomorrow(),
  });
  const [locationInput, setLocationInput] = useState('');    // User's location search

  // Check if user has selected dates (for showing results)
  const hasSelectedDates = Boolean(searchParams.checkInDate && searchParams.checkOutDate);
  const isFirstRender = useRef(true);

  // ============ RESET SEARCH TO ALL CAMPS ============
  const resetAndSearchAllCamps = () => {
    // Reset dates to today/tomorrow, location to empty
    const checkIn = toLocalDateInputValue();
    const checkOut = getTomorrow();

    setLocalDates({ checkIn, checkOut });
    setLocationInput('');

    // Search with fresh dates and no location filter
    const payload = {
      checkInDate: checkIn,
      checkOutDate: checkOut,
      capacity: undefined,
      location: undefined,
      pageNumber: 1,
      pageSize: searchParams.pageSize || 6,
    };

    dispatch(setSearchParams(payload));
    dispatch(searchCamps(payload));  // Fetch camps from API
    setCampBookings({});
  };

  // ============ INITIALIZE ON PAGE LOAD ============
  // First time user visits Dashboard, show today's available camps
  useEffect(() => {
    const initialParams = {
      ...searchParams, /// 
      checkInDate: localDates.checkIn,
      checkOutDate: localDates.checkOut,
      pageNumber: 1,
    };
    dispatch(setSearchParams(initialParams));
    dispatch(searchCamps(initialParams));  // Fetch camps for today/tomorrow
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ HANDLE NAVIGATION FROM OTHER PAGES ============
  // If user navigates back from booking/confirmation with resetCamps flag,
  // reset search to show all camps again
  useEffect(() => {
    if (location.pathname === '/' && location.state?.resetCamps) {
      resetAndSearchAllCamps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // ============ REFETCH CAMPS WHEN SEARCH CHANGES ============
  // User changed dates, location, or page number → fetch new camps (skip first render to avoid duplicate call)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hasSelectedDates) dispatch(searchCamps(searchParams)); 
  }, [dispatch, hasSelectedDates, searchParams.pageNumber, searchParams.pageSize]);

  // ============ LOAD EXISTING BOOKINGS FOR EACH CAMP ============
  // For each camp in search results, fetch existing bookings
  // Used to show "3 bookings" warning on camp cards
  useEffect(() => {
    if (hasSelectedDates && camps.length > 0) loadCampBookings();
    else setCampBookings({});
  }, [camps, hasSelectedDates]);

  // ============ FETCH ALL CAMPS FOR QUICK TRIPS ============
  // Load camps (up to 12) for "Quick Explore Destinations" section
  // These are camps marked as "isExploreDestination" for homepage promotion
  useEffect(() => {
    const loadAllCamps = async () => {
      try {
        const response = await campService.getAllCamps({ pageSize: 12 });
        if (response.success && response.data) {
          setAllCamps(response.data);
        }
      } catch {
        setAllCamps([]);  // If error, just skip Quick Trips section
      }
    };
    loadAllCamps();
  }, []);

  // ============ LOAD BOOKINGS FOR SELECTED DATES ============
  // Concurrently fetch existing bookings for each camp in parallel using Promise.all
  // Used to show "X bookings" on camp cards (helps users see occupancy)
  const loadCampBookings = async () => {
    try {
      const results = await Promise.all(
        camps.map(async (camp) => {
          try {
            const response = await bookingService.getCampBookings(camp.id, searchParams.checkInDate, searchParams.checkOutDate);
            if (response.success && response.data?.length > 0) {
              return { campId: camp.id, bookings: response.data };
            }
          } catch {
            // Log/ignore individual camp booking errors
          }
          return null;
        })
      );

      const bookingsMap = {};
      for (const result of results) {
        if (result) {
          bookingsMap[result.campId] = result.bookings;
        }
      }
      setCampBookings(bookingsMap);
    } catch (e) {
      console.error(e);
    }
  };

  // ============ HANDLE SEARCH BUTTON CLICK ============
  // Validate dates and search for available camps
  const handleSearch = () => {
    if (!localDates.checkIn || !localDates.checkOut) return;  // Dates required

    // Calculate number of nights
    const diffDays = Math.ceil((new Date(localDates.checkOut) - new Date(localDates.checkIn)) / 86400000);
    if (diffDays < 1 || diffDays > 30) return;  // Only allow 1-30 night bookings

    // Build search parameters with user's inputs
    const payload = {
      ...searchParams, 
      checkInDate: localDates.checkIn,
      checkOutDate: localDates.checkOut,
      location: locationInput.trim() || undefined,  // Empty = no location filter
      pageNumber: 1,  // Reset to first page after new search
    };

    dispatch(setSearchParams(payload));
    dispatch(searchCamps(payload));  // Fetch matching camps from API
    
    // Scroll to camps section to show results
    setTimeout(() => {
      const campsSection = document.getElementById('camps-section');
      if (campsSection) {
        campsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // ============ HANDLE SEARCH FORM SUBMIT ============
  const handleSearchSubmit = (e) => {
    e.preventDefault();  // Prevent default form submission
    handleSearch();
  };

  // ============ HANDLE PAGE CHANGE ============
  // User clicked "Page 2" or "Next" → fetch that page of results
  const handlePageChange = (page) => {
    if (!hasSelectedDates) return;  // Only allow pagination after search
    dispatch(setSearchParams({ pageNumber: page }));
    dispatch(searchCamps({ ...searchParams, pageNumber: page }));

    // Scroll back to top of camps list
    const campsSection = document.getElementById('camps-section');
    if (campsSection) {
      campsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ============ NAVIGATE TO BOOKING PAGE ============
  // User clicked "Book Now" on camp card
  // Pass dates as URL params so booking form is pre-filled
  const handleBook = (campId) => navigate(`/booking/${campId}?checkIn=${searchParams.checkInDate}&checkOut=${searchParams.checkOutDate}`);

  // ============ SCROLL TO RESULTS ============
  const scrollToCampsSection = () => {
    setTimeout(() => {
      const campsSection = document.getElementById('camps-section');
      if (campsSection) {
        campsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // ============ DATE VALIDATION ============
  // Today's date (earliest allowed checkin)
  const today = toLocalDateInputValue();
  
  // Maximum checkout date (30 days from checkin - business rule)
  const maxCheckout = useMemo(() => { 
    if (!localDates.checkIn) return undefined;
    const d = parseDateInputAsLocal(localDates.checkIn);
    d.setDate(d.getDate() + 30);  // Add 30 days max
    return toLocalDateInputValue(d);
  }, [localDates.checkIn]);

  // ============ FEATURED CAMPS FOR "QUICK TRIPS" ============
  // Filter camps marked as "isExploreDestination" for homepage showcase
  // Used in bottom section: "Explore Popular Destinations"
  const quickTrips = useMemo(() => {
    const source = allCamps.length > 0 ? allCamps : camps;  // Prefer allCamps (has featured ones)
    return source
      .filter((camp) => camp?.isExploreDestination)  // Only featured camps
      .map((camp) => ({
        id: camp.id,
        name: camp.name,
        location: camp.location,
        img: resolveImageUrl(camp.imageUrl, DEFAULT_CAMP_IMAGE),  // Fallback image
      }));
  }, [allCamps, camps]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Premium Minimal */}
      <section className="relative pt-12 pb-24 px-4 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232D5A3D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-6xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-forest)]/10 text-[var(--color-forest)] dark:bg-emerald-500/20 dark:text-emerald-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-current rounded-full animate-pulse"></span>
              Live availability across India
            </span>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-[1.1]">
              Find Your Perfect<br />
              <span className="text-gradient">Camping Escape</span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              Discover curated camping experiences with real-time pricing and instant booking.
            </p>
          </div>

          {/* Search Card - Premium Design */}
          <div className="card-flat rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-xl shadow-black/5 dark:shadow-black/20">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Check-in */}
              <div className="md:col-span-3">
                <label className="form-label text-xs uppercase tracking-wider opacity-70">Check-in</label>
                <div className="relative">
                  <input
                    type="date"
                    value={localDates.checkIn} // 
                    onChange={(e) => {
                      const checkIn = e.target.value;
                      let checkOut = localDates.checkOut;
                      if (!checkOut || new Date(checkOut) <= new Date(checkIn)) {
                        const d = new Date(checkIn);
                        d.setDate(d.getDate() + 1);
                        checkOut = d.toISOString().split('T')[0];
                      }
                      setLocalDates({ checkIn, checkOut });
                    }}
                    min={today}
                    className="input-field"
                  />
                </div>
              </div>
              
              {/* Check-out */}
              <div className="md:col-span-3">
                <label className="form-label text-xs uppercase tracking-wider opacity-70">Check-out</label>
                <input
                  type="date"
                  value={localDates.checkOut}
                  onChange={(e) => setLocalDates({ ...localDates, checkOut: e.target.value })}
                  min={localDates.checkIn || today}
                  max={maxCheckout}
                  className="input-field"
                />
              </div>
              
              {/* Location */}
              <div className="md:col-span-3">
                <label className="form-label text-xs uppercase tracking-wider opacity-70">Destination</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Kasol, Goa, Ladakh..."
                  className="input-field"
                />
              </div>
              
              {/* Guests */}
              <div className="md:col-span-2">
                <label className="form-label text-xs uppercase tracking-wider opacity-70">Guests</label>
                <select
                  value={searchParams.capacity || ''}
                  onChange={(e) => dispatch(setSearchParams({ capacity: e.target.value || undefined }))}
                  className="input-field"
                >
                  <option value="2">2 Guests</option>
                  <option value="4">4 Guests</option>
                  <option value="6">6 Guests</option>
                  <option value="8">8+ Guests</option>
                </select>
              </div>
              
              {/* Search Button */}
              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={!localDates.checkIn || !localDates.checkOut || isLoading}
                  className="w-full h-[52px] btn-primary rounded-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
            
            <p className="text-xs text-white/40 mt-4">
              Book from 1 to 30 nights • Weekend rates apply Fri-Sun • Free cancellation until 11 AM on check-in day
            </p>
          </div>
        </div>
      </section>

      {/* Available Camps Section */}
      {hasSelectedDates && (
        <section id="camps-section" className="py-16 px-4 bg-[var(--color-cream-dark)] dark:bg-[#151515]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-2">
                  {camps.length > 0 ? 'Available Camps' : 'Searching...'}
                </h2>
                {camps.length > 0 && (
                  <p className="text-white/50">
                    {totalCount || camps.length} camps found for your dates
                  </p>
                )}
              </div>
              {camps.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Sorted by relevance
                </div>
              )}
            </div>

            {error && (
              <div className="card-flat rounded-xl p-5 mb-6 border-l-4 border-red-400 bg-red-50 dark:bg-red-500/10">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
                <p className="text-white/50">Finding the best camps for you...</p>
              </div>
            ) : camps.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {camps.map((camp) => (
                    <CampCard key={camp.id} camp={camp} onBook={handleBook} bookings={campBookings[camp.id] || []} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
              </>
            ) : (
              <div className="card-flat rounded-2xl p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Camps Available</h3>
                <p className="text-white/50 mb-6 max-w-md mx-auto">We couldn't find any camps matching your criteria. Try adjusting your dates, location, or guest count.</p>
                <button onClick={() => setLocationInput('')} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Trip Planner */}
      {hasSelectedDates && quickTrips.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8 md:mb-10">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-2">Explore Destinations</h2>
                <p className="text-white/50">Popular camping spots handpicked for you</p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-5 overflow-x-auto pb-3 snap-x snap-mandatory">
              {quickTrips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    setLocationInput(trip.location);
                    const payload = {
                      ...searchParams,
                      checkInDate: localDates.checkIn,
                      checkOutDate: localDates.checkOut,
                      location: trip.location,
                      pageNumber: 1,
                    };
                    dispatch(setSearchParams(payload));
                    dispatch(searchCamps(payload));
                    scrollToCampsSection();
                  }}
                  className="group cursor-pointer text-left w-[78vw] max-w-[320px] sm:w-[300px] md:w-[280px] lg:w-[300px] flex-shrink-0 snap-start"
                >
                  <div className="relative h-56 sm:h-60 md:h-64 rounded-2xl overflow-hidden bg-[var(--color-sand)] dark:bg-[#333]">
                    <img
                      src={trip.img}
                      alt={trip.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        if (e.currentTarget.src !== DEFAULT_CAMP_IMAGE) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_CAMP_IMAGE;
                        }
                      }}
                    />
                    <div className="image-text-overlay" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <h3 className="image-text-title font-semibold text-base md:text-lg leading-tight line-clamp-1">{trip.name}</h3>
                      <p className="image-text-subtitle text-sm line-clamp-1 mt-1">{trip.location}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {!hasSelectedDates && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-3">Why Choose Luxecamp</h2>
              <p className="text-white/50 max-w-lg mx-auto">Premium camping experiences with transparent pricing and reliable service</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Verified Camps', 
                  desc: 'Every listing is personally verified for quality, safety, and authentic experiences' 
                },
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Honest Pricing', 
                  desc: 'No hidden fees. Real INR prices with clear weekday and weekend rates displayed' 
                },
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Flexible Booking', 
                  desc: 'Free cancellation until 11 AM on check-in day. Book with complete peace of mind' 
                },
              ].map((f) => (
                <div key={f.title} className="card-flat rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--color-forest)]/10 dark:bg-emerald-500/20 flex items-center justify-center text-[var(--color-forest)] dark:text-emerald-400">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
