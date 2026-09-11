import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSearchParams, searchCamps } from '../../store/slices/campSlice';

const SearchFilter = () => {
  const dispatch = useAppDispatch();
  const { searchParams, isLoading } = useAppSelector((state) => state.camps);
  const canSearch = Boolean(searchParams.checkInDate && searchParams.checkOutDate);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatch(setSearchParams({ [name]: value === '' ? undefined : value }));
  };

  const handleSearch = () => {
    dispatch(searchCamps(searchParams));
  };

  const capacityOptions = [
    // { value: '', label: 'Any' }, 
    { value: '1', label: '1 Guest' },
    { value: '2', label: '2 Guests' },
    { value: '4', label: '4 Guests' },
    { value: '6', label: '6 Guests' },
    { value: '8', label: '8+ Guests' },
  ];

  return (
    <div className="glass-card rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Find Your Perfect Camp</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="form-label">Check-in Date</label>
          <input
            type="date"
            name="checkInDate"
            value={searchParams.checkInDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label">Check-out Date</label>
          <input
            type="date"
            name="checkOutDate"
            value={searchParams.checkOutDate}
            onChange={handleInputChange}
            min={searchParams.checkInDate}
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            value={searchParams.location || ''}
            onChange={handleInputChange}
            placeholder="City/Region"
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label">Capacity</label>
          <select
            name="capacity"
            value={searchParams.capacity || ''}
            onChange={handleInputChange}
            className="input-field"
          >
            {capacityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={isLoading || !canSearch}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>
      {!canSearch && (
        <p className="mt-3 text-sm text-amber-300">
          Please select both check-in and check-out dates to view camps.
        </p>
      )}
    </div>
  );
};

export default SearchFilter;
