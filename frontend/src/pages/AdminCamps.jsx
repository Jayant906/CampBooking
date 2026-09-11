import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { campService } from '../services/campService';
import { resolveImageUrl, DEFAULT_CAMP_IMAGE } from '../services/imageUrl';
import ConfirmDialog from '../components/UI/ConfirmDialog';

// Utility functions to handle image URLs and amenities formatting
const toAbsoluteImageUrl = (url) => resolveImageUrl(url, ''); 

const toPortableImageUrl = (url) => { 
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
// If it's already an absolute URL, we can return it as is,
// but we should check if it's a localhost URL and convert it to a relative path 
// if so to avoid issues in production environments. 
  if (/^https?:\/\//i.test(trimmed)) { 
    try {
      const parsed = new URL(trimmed);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (isLocalHost && parsed.pathname.startsWith('/')) {
        return `${parsed.pathname}${parsed.search || ''}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const toAmenitiesText = (amenities) => {
  if (Array.isArray(amenities)) {
    return amenities.join(', ');
  }

  if (typeof amenities === 'string') {
    return amenities;
  }

  return ''; 
};

const AdminCamps = () => {
  const [camps, setCamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [campToDelete, setCampToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    loadCamps();
  }, []);

  useEffect(() => {
    register('imageUrl');
  }, [register]);

  const loadCamps = async () => {
    try { 
      // For admin view, we want to load all camps without pagination to allow easy management.
      const response = await campService.getAllCamps({ pageSize: 100 });
      // We expect the response to have a 'data' property that is an array of camps.
      if (response.success && response.data) {
        setCamps(response.data);
      }
    } catch {
      toast.error('Failed to load camps');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (camp) => {
    setEditingCamp(camp);
    setValue('name', camp.name);
    setValue('location', camp.location);
    setValue('description', camp.description);
    setValue('pricePerNight', camp.pricePerNight);
    setValue('capacity', camp.capacity);
    const resolvedImageUrl = toAbsoluteImageUrl(camp.imageUrl || '');
    setValue('imageUrl', resolvedImageUrl);
    setValue('amenities', toAmenitiesText(camp.amenities)); // 
    setValue('isActive', camp.isActive);
    setValue('isExploreDestination', camp.isExploreDestination || false); // Handle undefined case
    setImagePreview(resolvedImageUrl || null); // Show preview if there's an image
    setShowImageUrlInput(false);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCamp(null);
    reset({
      name: '',
      location: '',
      description: '',
      pricePerNight: '',
      capacity: '',
      imageUrl: '',
      amenities: '',
      isActive: true,
      isExploreDestination: false,
    });
    setImagePreview(null);
    setShowImageUrlInput(false);
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: JPG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Create instant local blob preview for immediate feedback
    const localBlobUrl = URL.createObjectURL(file);
    setImagePreview(localBlobUrl);

    setIsUploadingImage(true);
    try {
      const response = await campService.uploadImage(file);
      if (response.success && response.data) {
        const portableUrl = toPortableImageUrl(response.data);
        setValue('imageUrl', portableUrl, { shouldDirty: true, shouldValidate: true });
        setImagePreview(toAbsoluteImageUrl(portableUrl));
        setShowImageUrlInput(false);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(response.message || 'Failed to upload image');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to upload image'); 
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setValue('imageUrl', '', { shouldDirty: true, shouldValidate: true });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (campId) => {
    setCampToDelete(campId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!campToDelete) return;
    setIsDeleting(true);
    try {
      const response = await campService.deleteCamp(campToDelete);
      if (response.success) {
        toast.success('Camp deleted successfully');
        loadCamps();
      } else {
        toast.error(response.message || 'Failed to delete camp');
      }
    } catch {
      toast.error('Failed to delete camp');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setCampToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCampToDelete(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const rawUrl = data.imageUrl?.trim() || '';
      const cleanedUrl = rawUrl ? resolveImageUrl(rawUrl, rawUrl) : '';
      const finalImageUrl = toPortableImageUrl(cleanedUrl);
      const campData = {
        name: data.name,
        location: data.location,
        description: data.description,
        pricePerNight: parseFloat(data.pricePerNight),
        capacity: parseInt(data.capacity),
        imageUrl: finalImageUrl,
        amenities: data.amenities || '',
        isActive: data.isActive,
        isExploreDestination: !!data.isExploreDestination,
      };

      let response;
      if (editingCamp) {
        response = await campService.updateCamp(editingCamp.id, { ...campData, id: editingCamp.id });
      } else {
        response = await campService.createCamp(campData);
      }

      if (response.success) {
        toast.success(editingCamp ? 'Camp updated successfully' : 'Camp created successfully');
        setShowForm(false);
        setEditingCamp(null);
        reset();
        loadCamps();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-3 border-[var(--color-sand)] border-t-[var(--color-forest)] rounded-full animate-spin mb-4" />
        <p className="text-white/50">Loading camps...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white mb-1">Camp Management</h1>
            <p className="text-white/50">Add, edit, and manage camping listings</p>
          </div>
          <button onClick={handleAdd} className="btn-primary self-start md:self-auto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Camp
          </button>
        </div>

        {/* Camp Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card-flat rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-display text-2xl font-semibold text-white">
                    {editingCamp ? 'Edit Camp' : 'Add New Camp'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-sand)] dark:hover:bg-[#333] transition-colors"
                  >
                    <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Camp Name</label>
                      <input
                        type="text"
                        {...register('name', { required: 'Name is required' })}
                        className="input-field"
                        placeholder="Riverside Retreat"
                      />
                      {errors.name && <p className="form-error">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        {...register('location', { required: 'Location is required' })}
                        className="input-field"
                        placeholder="Kasol, Himachal Pradesh"
                      />
                      {errors.location && <p className="form-error">{errors.location.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      className="input-field"
                      rows={3}
                      placeholder="Describe the camping experience..."
                    />
                    {errors.description && <p className="form-error">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label">Price per Night (₹)</label>
                      <input
                        type="number"
                        step="1"
                        {...register('pricePerNight', {
                          required: 'Price is required',
                          validate: (value) => {
                            const num = parseFloat(value);
                            if (isNaN(num) || num <= 0) return 'Price must be greater than 0';
                            return true;
                          }
                        })}
                        className="input-field"
                        placeholder="2500"
                      />
                      {errors.pricePerNight && <p className="form-error">{errors.pricePerNight.message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Capacity (guests)</label>
                      <input
                        type="number"
                        {...register('capacity', {
                          required: 'Capacity is required',
                          min: { value: 1, message: 'Capacity must be at least 1' },
                        })}
                        className="input-field"
                        placeholder="4"
                      />
                      {errors.capacity && <p className="form-error">{errors.capacity.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Camp Image</label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-4 relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Camp preview"
                          referrerPolicy="no-referrer"
                          className="w-full max-w-xs h-40 object-cover rounded-xl border border-[var(--color-sand)] dark:border-[#3D3D3D]"
                          onError={(e) => {
                            if (e.currentTarget.src !== DEFAULT_CAMP_IMAGE) {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_CAMP_IMAGE;
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        id="camp-image-upload"
                      />
                      <label
                        htmlFor="camp-image-upload"
                        className={`btn-secondary cursor-pointer text-center ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploadingImage ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upload Image
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          const next = !showImageUrlInput;
                          setShowImageUrlInput(next);
                          if (next && fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        {showImageUrlInput ? 'Hide URL Option' : 'Use Image URL Instead'}
                      </button>
                    </div>
                    {showImageUrlInput && (
                      <div className="mt-3">
                        <input
                          type="url"
                          {...register('imageUrl')}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setValue('imageUrl', nextValue, { shouldDirty: true, shouldValidate: true });
                            const resolved = resolveImageUrl(nextValue, '');
                            setImagePreview(resolved || null);
                          }}
                          className="input-field"
                          placeholder="Paste image URL (e.g. Unsplash or direct web link)"
                        />
                      </div>
                    )}
                    <p className="text-white/40 text-xs mt-2">Supported: JPG, PNG, GIF, WebP (max 5MB)</p>
                  </div>

                  <div>
                    <label className="form-label">Amenities <span className="text-white/30">(comma-separated)</span></label>
                    <input
                      type="text"
                      {...register('amenities')}
                      className="input-field"
                      placeholder="WiFi, Fire Pit, Shower, Parking"
                    />
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="w-5 h-5 rounded border-[var(--color-sand-dark)] text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
                    />
                    <label htmlFor="isActive" className="text-white/70 cursor-pointer">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="isExploreDestination"
                      {...register('isExploreDestination')}
                      className="w-5 h-5 rounded border-[var(--color-sand-dark)] text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
                    />
                    <label htmlFor="isExploreDestination" className="text-white/70 cursor-pointer">
                      Show in Explore Destinations (Quick Decide)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : editingCamp ? 'Update Camp' : 'Create Camp'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Camps Table */}
        <div className="card-flat rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--color-sand)]/50 dark:bg-[#333]">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Camp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Explore</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-sand)] dark:divide-[#3D3D3D]">
                {camps.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[var(--color-sand)]/30 dark:hover:bg-[#333] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(camp.imageUrl, DEFAULT_CAMP_IMAGE)}
                          alt={camp.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover"
                          onError={(e) => {
                            if (e.currentTarget.src !== DEFAULT_CAMP_IMAGE) {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_CAMP_IMAGE;
                            }
                          }}
                        />
                        <span className="font-medium text-white">{camp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{camp.location}</td>
                    <td className="px-6 py-4 text-[var(--color-forest)] dark:text-emerald-400 font-medium">
                      ₹{camp.pricePerNight.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-white/60">{camp.capacity} guests</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        camp.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${camp.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {camp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        camp.isExploreDestination
                          ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                          : 'bg-[var(--color-sand)] dark:bg-[#404040] text-white/60'
                      }`}>
                        {camp.isExploreDestination ? 'Selected' : 'Not Selected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {camp.averageRating > 0 ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {camp.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-white/30">No ratings</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(camp)}
                          className="p-2 rounded-lg hover:bg-[var(--color-sand)] dark:hover:bg-[#404040] text-white/60 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-white/60 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {camps.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-sand)] dark:bg-[#333] flex items-center justify-center">
                <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-white/50 mb-4">No camps found</p>
              <button onClick={handleAdd} className="btn-primary">Add Your First Camp</button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Camp?"
        message="Are you sure you want to delete this camp? This action cannot be undone."
        confirmLabel="Delete Camp"
        cancelLabel="Keep Camp"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminCamps;
