import StarRating from './StarRating';
import { resolveImageUrl } from '../../services/imageUrl';

const CampCard = ({ camp, onBook, bookings = [] }) => {
  const hasBookings = bookings && bookings.length > 0;
  const weekendRate = Math.round(Number(camp?.pricePerNight || 0) * 1.25);
  const campImage = resolveImageUrl(camp.imageUrl, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800');
  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const formatInr = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));

  return (
    <div className="group bg-[var(--color-warm-white)] dark:bg-[#262626] rounded-2xl overflow-hidden border border-[var(--color-sand)] dark:border-[#3D3D3D] hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-500">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-[var(--color-sand)] dark:bg-[#333]">
        <img
          src={campImage}
          alt={camp.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        
        {/* Price Tag */}
        <div className="absolute top-4 right-4">
          <div className="bg-white dark:bg-[#222] px-3 py-2 rounded-xl shadow-lg">
            <span className="text-[var(--color-forest)] dark:text-emerald-400 font-semibold">{formatInr(camp.pricePerNight)}</span>
            <span className="text-[var(--color-charcoal-light)] dark:text-white/50 text-xs ml-1">/night</span>
          </div>
        </div>

        {/* Rating Badge - only if someone has rated */}
        {camp.ratingCount > 0 && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 dark:bg-[#222]/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-[var(--color-charcoal)] dark:text-white text-sm">{camp.averageRating?.toFixed(1)}</span>
            <span className="text-[var(--color-charcoal-light)] dark:text-white/50 text-xs">({camp.ratingCount})</span>
          </div>
        )}

        {/* Booked Overlay */}
        {hasBookings && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600/95 to-red-600/80 backdrop-blur-sm text-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="image-text-subtitle font-medium text-sm">Booked: {bookings.map((b, i) => `${formatDate(b.checkInDate)}-${formatDate(b.checkOutDate)}`).join(', ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Location */}
        <h3 className="text-lg font-semibold text-[var(--color-charcoal)] dark:text-white mb-1 line-clamp-1 group-hover:text-[var(--color-forest)] dark:group-hover:text-emerald-400 transition-colors">
          {camp.name}
        </h3>
        <div className="flex items-center gap-1.5 text-[var(--color-charcoal-light)] dark:text-white/50 text-sm mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{camp.location}</span>
        </div>
        
        {/* Description */}
        <p className="text-[var(--color-charcoal-light)] dark:text-white/40 text-sm mb-4 line-clamp-2 leading-relaxed">
          {camp.description}
        </p>

        {/* Pricing Info */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-charcoal-light)] dark:text-white/40 mb-4 pb-4 border-b border-[var(--color-sand)] dark:border-[#3D3D3D]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[var(--color-forest)] dark:bg-emerald-400 rounded-full"></span>
            Mon-Thu: {formatInr(camp.pricePerNight)}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            Fri-Sun: {formatInr(weekendRate)}
          </span>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-[var(--color-charcoal-light)] dark:text-white/50 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {camp.capacity}
            </span>
            {camp.amenities && (
              <span className="flex items-center gap-1.5 text-[var(--color-forest)] dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {camp.amenities.split(',').length} amenities
              </span>
            )}
          </div>
          
          <button
            onClick={() => onBook(camp.id)}
            disabled={hasBookings}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              hasBookings
                ? 'bg-[var(--color-sand)] dark:bg-[#404040] text-[var(--color-charcoal)] dark:text-[#F5F1EB] cursor-not-allowed opacity-60'
                : 'bg-[var(--color-forest)] hover:bg-[var(--color-forest-dark)] text-[#ffffff] shadow-md hover:shadow-lg hover:shadow-[var(--color-forest)]/20'
            }`}
          >
            {hasBookings ? 'Unavailable' : 'Book Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampCard;
